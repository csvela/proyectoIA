
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory

BASE_DIR = Path(__file__).resolve().parent

app = Flask(__name__)


@app.get("/")
def home():
    return send_from_directory(BASE_DIR, "index.html")


@app.get("/styles.css")
def styles():
    return send_from_directory(BASE_DIR, "styles.css")


@app.get("/script.js")
def script():
    return send_from_directory(BASE_DIR, "script.js")


@app.get("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "message": "El servidor de ClariCopilot funciona."
    })


@app.post("/api/analyze")
def analyze():
    data = request.get_json(silent=True) or {}
    instructions = data.get("instructions", "").strip()

    if not instructions:
        return jsonify({
            "status": "error",
            "message": "Escribe unas instrucciones para analizar."
        }), 400

    return jsonify({
        "status": "ok",
        "message": "Las instrucciones llegaron correctamente a Flask.",
        "instructions": instructions,
        "analysis": (
            "ClariCopilot recibió tus instrucciones. "
            "El análisis inteligente se agregará en una siguiente etapa."
        )
    })


if __name__ == "__main__":
    app.run(debug=True)
