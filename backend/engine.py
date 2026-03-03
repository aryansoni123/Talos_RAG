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

def chatbot(query):
    """
    Optimized RAG Pipeline for speed.
    """
    if database.text_db is None:
        print("Warning: Database not initialized.")
        return "System error: Database is empty."

    start_time = time.time()

    # 1. Similarity Search (Increased k for broader coverage of large docs)
    print(f"Searching for: '{query}'...")
    candidates = database.text_db.similarity_search(query, k=25)
    search_time = time.time() - start_time

    # 2. FlashRank Reranking (Keep top 7 for LLM)
    rerank_start = time.time()
    reranked_docs, scores = rerank_results(query, candidates, top_n=7)
    rerank_time = time.time() - rerank_start

    if not reranked_docs:
        return "I couldn't find any relevant information."

    # 3. Context Construction
    context_blocks = []
    for doc in reranked_docs:
        source = doc.metadata.get("source", "Unknown")
        doc_type = doc.metadata.get("type", "text")
        context_blocks.append(f"[{doc_type.upper()} Source: {source}]\n{doc.page_content}")
    
    context_text = "\n\n".join(context_blocks)

    # 4. LLM Generation
    prompt = ChatPromptTemplate.from_template("""
    You are the Talos RAG Assistant. Use the context to answer precisely.
    
    Context:
    {context}

    User Question: {query}
    """)

    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", api_key=API_KEY)
    chain = prompt | llm
    
    try:
        gen_start = time.time()
        response = chain.invoke({"context": context_text, "query": query})
        gen_time = time.time() - gen_start
        
        # Prepare structured sources for the frontend
        sources = []
        for doc, score in zip(reranked_docs, scores):
            sources.append({
                "content": doc.page_content,
                "score": float(score),
                "metadata": doc.metadata
            })

        print(f"\nPerformance Metrics:")
        print(f"  - Vector Search: {search_time:.3f}s")
        print(f"  - Reranking:     {rerank_time:.3f}s")
        print(f"  - LLM Gen:       {gen_time:.3f}s")
        
        return {
            "answer": response.content,
            "sources": sources
        }
    except Exception as e:
        print(f"Error during LLM generation: {e}")
        return {"error": str(e), "answer": "I encountered an error generating a response.", "sources": []}
