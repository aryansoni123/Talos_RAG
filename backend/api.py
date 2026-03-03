import os
import threading
from flask import Flask, request, jsonify
from flask_cors import CORS
import database
import engine
import watcher
from config import DEVICE

app = Flask(__name__)
CORS(app) # Enable Cross-Origin Resource Sharing

DATA_DIR = "./data"

def startup_logic():
    """Initializes the database and starts the file watcher."""
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)
    
    print("Initializing Vector Databases...")
    database.init_dbs(data_dir=DATA_DIR)
    
    # Start watcher in background
    watcher_thread = threading.Thread(
        target=watcher.start_file_watcher, 
        args=(DATA_DIR,), 
        daemon=True
    )
    watcher_thread.start()
    print("Background File Watcher Started.")

@app.route('/chat', methods=['POST'])
def handle_chat():
    data = request.json
    user_query = data.get("query")
    
    if not user_query:
        return jsonify({"error": "No query provided"}), 400
    
    try:
        result = engine.chatbot(user_query)
        # If it's a dictionary (successful RAG or caught error), structure it for the frontend
        if isinstance(result, dict):
            return jsonify({
                "response": result.get("answer"),
                "sources": result.get("sources", [])
            })
        else:
            # Fallback if result is just a string
            return jsonify({
                "response": result,
                "sources": []
            })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/status', methods=['GET'])
def get_status():
    files = database.processed_files
    return jsonify({
        "status": "online",
        "knowledge_base": f"{len(files)} files indexed ({database.text_db.index.ntotal if database.text_db else 0} vectors)",
        "device": str(DEVICE)
    })

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    file_path = os.path.join(DATA_DIR, file.filename)
    file.save(file_path)
    
    return jsonify({"message": f"File {file.filename} uploaded and being indexed."}), 201

if __name__ == '__main__':
    startup_logic()
    # Run Flask App on port 8000 to match frontend's api.ts
    app.run(host='0.0.0.0', port=8000, debug=False)
