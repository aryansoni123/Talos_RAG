# Talos RAG Backend Documentation (Updated)

## 🌐 API Reference

The backend operates as a RESTful service on `http://localhost:8000`.

### 1. Chat Interface
- **Endpoint**: `POST /chat`
- **Payload**: `{ "query": "string" }`
- **Response**:
    ```json
    {
      "response": "The AI's answer",
      "sources": [
        {
          "content": "Original text chunk",
          "score": 0.98,
          "metadata": { "source": "path/to/doc.pdf", "type": "pdf" }
        }
      ]
    }
    ```

### 2. Knowledge Base Status
- **Endpoint**: `GET /status`
- **Response**: Returns the operational state, hardware (CPU/CUDA), and a summary of indexed files.

### 3. File Ingestion
- **Endpoint**: `POST /upload`
- **Method**: `multipart/form-data`
- **Behavior**: Saves the file to `./data`, triggering the `watchdog` observer for automatic FAISS indexing.

---

## 🧠 The RAG Pipeline (In-Depth)

1.  **Ingestion**: Files in `./data` are hashed (SHA-256). Only new/modified files are processed.
2.  **Vectorization**: Text is split into 1000-character chunks with a 150-character overlap using `RecursiveCharacterTextSplitter`.
3.  **Retrieval**: `FAISS.similarity_search` retrieves the top 25 candidates using `all-MiniLM-L6-v2` embeddings.
4.  **Reranking**: `FlashRank` (TinyBERT) scores the candidates against the query, narrowing them down to the top 7 most relevant chunks.
5.  **Generation**: The context is injected into a system prompt for **Gemini 2.0 Flash**, which generates the final response.

---

## 🛠️ Configuration
All sensitive keys and model parameters are managed in `config.py` and the `.env` file.
- **`DEVICE`**: Automatically detects NVIDIA GPUs (CUDA) for faster Whisper and Embedding inference.
- **`whisper_model`**: Using the "base" model for a balance of speed and accuracy.
