# Talos RAG: Enterprise Multi-Modal Intelligence

Talos is a high-performance, production-grade Retrieval-Augmented Generation (RAG) system designed to provide deep intelligence across diverse enterprise data formats. It seamlessly integrates text, structured data, and audio into a unified reasoning engine with a high-end, responsive user interface.

## 🚀 Key Features

- **Multi-Modal Ingestion**: Native support for **PDFs**, **CSVs**, **Plain Text**, and **Audio** (MP3/WAV).
- **Hybrid RAG Pipeline**:
    - **Vector Retrieval**: FAISS-powered similarity search using `all-MiniLM-L6-v2` embeddings.
    - **High-Speed Reranking**: CPU-optimized reranking via **FlashRank** (TinyBERT) for maximum precision.
    - **Reasoning**: Powered by **Gemini 2.0 Flash** for state-of-the-art response generation.
- **Acoustic Intelligence**: Dual-layer audio processing using **OpenAI Whisper** for transcription and **Wav2Vec2** for semantic acoustic feature extraction.
- **Real-Time Indexing**: Automated file-watcher (`watchdog`) that monitors the `./data` directory and updates the knowledge base instantly.
- **High-End UI/UX**:
    - **Rich Text Support**: Full Markdown rendering with syntax-highlighted code blocks and one-click copy.
    - **Inertial Scrolling**: Ultra-smooth scrolling experience powered by **Lenis**.
    - **Responsive Design**: Modern, glassmorphism-inspired aesthetic with Dark/Light mode synchronization.
    - **Source Citations**: Interactive citations showing metadata, confidence scores, and content snippets.

---

## 🏗️ Architecture

### **Backend (Python)**
The backend is a modular Flask application built for speed and reliability.
- **`api.py`**: The RESTful gateway (Port 8000) managing chat, status, and uploads.
- **`engine.py`**: The RAG orchestrator. It handles retrieval, FlashRank reranking, and LLM communication.
- **`database.py`**: Manages the FAISS vector stores and metadata persistence.
- **`processors.py`**: Specialized loaders for different file types (PDF, CSV, Audio).
- **`watcher.py`**: Background service for real-time file system monitoring.

### **Frontend (React + TypeScript)**
A modern SPA designed for enterprise-level performance.
- **Vite**: Ultra-fast build tool and development server.
- **Framer Motion**: High-fidelity animations and transitions.
- **Tailwind CSS**: Utility-first styling with a custom "Talos Bronze" design system.
- **Lucide React**: Clean, consistent iconography.

---

## 🛠️ Tech Stack

| Category | Technology |
| :--- | :--- |
| **LLM** | Google Gemini 2.0 Flash |
| **Embeddings** | HuggingFace (all-MiniLM-L6-v2) |
| **Vector DB** | FAISS (Facebook AI Similarity Search) |
| **Reranker** | FlashRank (ms-marco-TinyBERT-L-2-v2) |
| **Audio** | OpenAI Whisper, Facebook Wav2Vec2 |
| **Frontend** | React, TypeScript, Framer Motion, Lenis |
| **Backend** | Flask, LangChain, PyMuPDF, Trafilatura |

---

## 🚦 Getting Started

### **1. Prerequisites**
- Python 3.10+
- Node.js 18+
- A Google Gemini API Key

### **2. Backend Setup**
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment:
   Create a `.env` file in the `backend` directory:
   ```env
   GOOGLE_API_KEY=your_gemini_api_key_here
   ```
5. Launch the API:
   ```bash
   python api.py
   ```

### **3. Frontend Setup**
1. Navigate to the `Frontend` folder:
   ```bash
   cd Frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

---

## 📂 Data Management
- **Manual Upload**: Use the "Paperclip" or "Bulk Upload" buttons in the UI.
- **Direct Drop**: Simply drop supported files into the `backend/data` directory. The system will automatically index them within seconds.

---

## 📜 License
Internal Enterprise Use. (C) 2024 Talos Intelligence Systems.
