import subprocess
import sys
import tempfile
import os
import re

from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # allow the Netlify/GitHub Pages frontend (different origin) to call this API

# Max seconds a submitted script may run before we kill it (handles infinite loops)
EXECUTION_TIMEOUT = 5


def extract_error_type(stderr: str) -> str:
    """
    Pull ONLY the exception class name out of a Python traceback.
    Everything else (message, line number, file path) is thrown away on
    purpose — the tool must never leak real debugging info.
    """
    if not stderr:
        return None

    lines = stderr.strip().splitlines()
    if not lines:
        return None

    last_line = lines[-1]
    # A normal traceback's last line looks like: "TypeError: unsupported operand..."
    match = re.match(r"^([A-Za-z_][A-Za-z0-9_]*)\s*:", last_line)
    if match:
        return match.group(1)

    # SyntaxErrors and a few edge cases don't match that pattern cleanly.
    # Fall back to a generic bucket so the frontend always gets *something*.
    return "UnknownError"


@app.route("/run", methods=["POST"])
def run_code():
    data = request.get_json(silent=True) or {}
    code = data.get("code", "")

    if not isinstance(code, str) or not code.strip():
        return jsonify({"status": "error", "error_type": "EmptyInputError"}), 200

    with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False) as tmp:
        tmp.write(code)
        tmp_path = tmp.name

    try:
        result = subprocess.run(
            [sys.executable, tmp_path],
            capture_output=True,
            text=True,
            timeout=EXECUTION_TIMEOUT,
        )

        if result.returncode == 0:
            # Ran clean — no moths today.
            return jsonify({"status": "clean"}), 200

        error_type = extract_error_type(result.stderr)
        return jsonify({"status": "error", "error_type": error_type}), 200

    except subprocess.TimeoutExpired:
        # Infinite loops / hangs become their own error category so the
        # frontend can spawn moths for this case too.
        return jsonify({"status": "error", "error_type": "TimeoutError"}), 200

    except Exception:
        # Catch-all so an unexpected subprocess failure never 500s on the frontend.
        return jsonify({"status": "error", "error_type": "UnknownError"}), 200

    finally:
        try:
            os.remove(tmp_path)
        except OSError:
            pass


@app.route("/health", methods=["GET"])
def health():
    """Ping target for the frontend's 'the ancient machine stirs...' cold-start screen."""
    return jsonify({"status": "awake"}), 200


if __name__ == "__main__":
    app.run(debug=True, port=5000)