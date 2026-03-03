import time
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from config import API_KEY
import database
from flashrank import Ranker, RerankRequest

# Initialize FlashRank (Optimized for CPU speed)
ranker = Ranker(model_name="ms-marco-TinyBERT-L-2-v2", cache_dir="opt_models")

def rerank_results(query, retrieved_docs, top_n=5):
    """
    High-speed CPU reranking using FlashRank.
    """
    if not retrieved_docs:
        return [], []
        
    # Convert LangChain docs to FlashRank format
    passages = []
    for i, doc in enumerate(retrieved_docs):
        passages.append({
            "id": i,
            "text": doc.page_content,
            "meta": doc.metadata
        })
    
    rerank_request = RerankRequest(query=query, passages=passages)
    results = ranker.rerank(rerank_request)
    
    reranked_docs = []
    scores = []
    
    for res in results[:top_n]:
        # Map back to original docs using the result text
        original_doc = next(d for d in retrieved_docs if d.page_content == res['text'])
        reranked_docs.append(original_doc)
        scores.append(res['score'])
        
    return reranked_docs, scores

# Global Memory Storage (Short-Term Memory)
chat_history = []
MAX_HISTORY_MESSAGES = 6 # Keep the last 6 exchanges in full detail
MEMORY_SUMMARY = ""      # Stores the distilled "Sticky Note" recap

def get_history_context():
    """Formats history for the prompt, including the summary recap."""
    global MEMORY_SUMMARY, chat_history
    history_str = ""
    if MEMORY_SUMMARY:
        history_str += f"[Previous Summary Recap: {MEMORY_SUMMARY}]\n\n"
    
    for turn in chat_history:
        history_str += f"User: {turn['user']}\nAssistant: {turn['bot']}\n"
    return history_str

def summarize_history():
    """Distills old messages into a summary to save tokens."""
    global chat_history, MEMORY_SUMMARY
    if len(chat_history) <= MAX_HISTORY_MESSAGES:
        return

    print("STM: Memory limit reached. Summarizing old context...")
    # Extract the messages to be summarized (all but the last 2)
    to_summarize = chat_history[:-2]
    content = "\n".join([f"U: {t['user']} A: {t['bot']}" for t in to_summarize])
    
    summarizer_prompt = f"""
    Distill the following conversation into a 2-sentence summary of the key facts and user needs.
    Current Recap: {MEMORY_SUMMARY}
    New exchanges: {content}
    """
    
    llm = ChatGoogleGenerativeAI(model="gemini-3.0-flash", api_key=API_KEY)
    try:
        response = llm.invoke(summarizer_prompt)
        MEMORY_SUMMARY = response.content
        # Keep only the most recent 2 exchanges in full detail
        chat_history = chat_history[-2:]
    except Exception as e:
        print(f"Summarization error: {e}")

def chatbot(query):
    """
    Optimized RAG Pipeline with STM.
    """
    global chat_history
    if database.text_db is None:
        return {"error": "DB_EMPTY", "answer": "Knowledge Base is empty.", "sources": []}

    start_time = time.time()
    history_context = get_history_context()

    # 1. Similarity Search
    candidates = database.text_db.similarity_search(query, k=25)
    search_time = time.time() - start_time

    # 2. Reranking
    rerank_start = time.time()
    reranked_docs, scores = rerank_results(query, candidates, top_n=7)
    rerank_time = time.time() - rerank_start

    # 3. Context Construction
    context_text = "\n\n".join([f"[{d.metadata.get('source', 'Unknown')}]\n{d.page_content}" for d in reranked_docs])

    # 4. LLM Generation with Memory
    prompt = ChatPromptTemplate.from_template("""
    You are Talos, an Enterprise AI. Use the provided context AND chat history to answer accurately.
    If the context doesn't contain the answer, use your memory of previous turns.
    
    RECAP OF OLDER CONVERSATION:
    {history}

    CURRENT DOCUMENT CONTEXT:
    {context}

    USER QUESTION: {query}
    """)

    llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", api_key=API_KEY)
    chain = prompt | llm
    
    try:
        gen_start = time.time()
        response = chain.invoke({
            "history": history_context,
            "context": context_text, 
            "query": query
        })
        gen_time = time.time() - gen_start
        
        # 5. Update Memory (Strip sources, save only Q&A)
        chat_history.append({"user": query, "bot": response.content})
        summarize_history() # Check if we need to compact memory

        sources = [{
            "content": doc.page_content,
            "score": float(score),
            "metadata": doc.metadata
        } for doc, score in zip(reranked_docs, scores)]

        return {"answer": response.content, "sources": sources}
    except Exception as e:
        return {"error": str(e), "answer": "Generation Error.", "sources": []}
