import os
import sys

# Replicate the logic in api.py
FILE_PATH = os.path.abspath("backend/api.py")
BASE_DIR = os.path.dirname(os.path.dirname(FILE_PATH))
DATA_DIR = os.path.join(BASE_DIR, "Data")

print(f"--- PATH DIAGNOSTICS ---")
print(f"Current Working Dir: {os.getcwd()}")
print(f"Script Path: {FILE_PATH}")
print(f"Calculated Base: {BASE_DIR}")
print(f"Calculated Data Dir: {DATA_DIR}")
print(f"Exists: {os.path.exists(DATA_DIR)}")

if os.path.exists(DATA_DIR):
    files = os.listdir(DATA_DIR)
    print(f"File Count: {len(files)}")
    for f in files[:5]:
        print(f" - {f}")
else:
    print("ERROR: DATA_DIR does not exist at this path.")

print("\n--- SEARCHING FOR OTHER DATA FOLDERS ---")
for root, dirs, files in os.walk(BASE_DIR):
    # Only look 2 levels deep to avoid long wait
    if root.count(os.sep) - BASE_DIR.count(os.sep) > 2:
        continue
    if "data" in root.lower() and ".git" not in root and "venv" not in root:
        try:
            print(f"Found: {root} (Files: {len(os.listdir(root))})")
        except:
            pass
