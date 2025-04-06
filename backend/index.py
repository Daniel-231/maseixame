from flask import Flask, jsonify
from flask_cors import CORS
import sqlite3

from routes.userRouter import user_bp
from routes.postsRouter import posts_bp

app = Flask(__name__)
CORS(
    app,
    resources={r"/*": {"origins": "http://localhost:3000"}},
    supports_credentials=True  # Allow cookies/auth headers
)

# Function to connect to the database
def get_db_connection():
    conn = sqlite3.connect('database/app.db')
    conn.row_factory = sqlite3.Row
    return conn

app.register_blueprint(user_bp, url_prefix='/user')  # Correct blueprint registration
app.register_blueprint(posts_bp, url_prefix='/posts')


if __name__ == '__main__':
    app.run(debug=True, port=5000)