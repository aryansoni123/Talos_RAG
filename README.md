# 🤖 Talos - Multimodal AI Assistant

Talos is a powerful multimodal AI assistant capable of processing and understanding PDF documents, CSV data, and audio files (WAV/MP3). It monitors changes in the data directory in real-time and updates embeddings using FAISS for efficient semantic search. It also utilizes reranking via a cross-encoder model for enhanced retrieval quality and answers queries using Google's Gemini LLM.

---

## 🚀 Features

- ✅ PDF, CSV, and Audio file processing
- 🔄 Real-time file monitoring and dynamic FAISS index updating
- 🎙️ Whisper + Wav2Vec2-based audio transcription and embedding
- 📊 Semantic search via FAISS vector store
- 🧠 Cross-encoder reranking using Sentence Transformers
- 💬 Response generation via Gemini 2.0 Flash

---

## 📁 Directory Structure

```
Talos/
├── Data/
│   ├── sample.pdf
│   ├── data.csv
│   └── audio.wav
├── bot.py
├── requirements.txt
└── README.md
```

---

## 🔧 Requirements

- Python 3.8+
- PyTorch (with CUDA support for GPU acceleration)
- Transformers
- Langchain
- HuggingFace Embeddings
- FAISS
- Whisper
- Librosa
- Sentence-Transformers
- Watchdog
- Requests, BeautifulSoup4

---

## 🛠️ Setup

1. Clone the repository:

```bash
https://github.com/aryansoni123/Talos_RAG.git
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Place your PDFs, CSVs, and audio files in the `Data/` directory.
4. Run the bot:

```bash
python bot.py
```

---

## 💬 Usage

Simply type a natural language query after starting the script. Type `exit` to terminate the session.

---

## 🔐 API Keys

Make sure to set your API key for Gemini:

```python
API_key = "your_google_api_key"
```

---

## 📌 Notes

- For real-time audio embedding and query, Whisper's transcription is used alongside Wav2Vec2 embeddings.
- FAISS is used to maintain low-latency similarity search.
- Gemini Flash is fast and cost-effective for rapid responses.

---

## ✨ Credits

- [Whisper](https://github.com/openai/whisper)
- [Wav2Vec2](https://huggingface.co/facebook/wav2vec2-base-960h)
- [LangChain](https://www.langchain.com/)
- [FAISS](https://github.com/facebookresearch/faiss)
- [Gemini Flash](https://ai.google.dev/)

---

## 📬 Contact

For support or contributions, reach out at: `your.email@example.com`

---

**Happy building with Talos!** 🚀

