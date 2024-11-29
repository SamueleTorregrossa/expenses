import os

from flask import Flask, send_file

app = Flask(__name__)


@app.route("/")
def index():
    return send_file("index.html")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)
