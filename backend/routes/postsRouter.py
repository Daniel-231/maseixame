from flask import Blueprint, jsonify, request
import sqlite3
import json  # Required for JSON serialization
from datetime import datetime  # For timestamp handling

def get_db_connection():
    conn = sqlite3.connect('database/app.db')
    conn.row_factory = sqlite3.Row
    return conn

posts_bp = Blueprint('posts', __name__)

@posts_bp.route('/all', methods=['GET'])
def get_posts():
    conn = get_db_connection()
    try:
        posts = conn.execute('SELECT * FROM posts').fetchall()
        if not posts:
            return jsonify({"message": "No posts found"}), 404

        posts_list = []
        for post in posts:
            post_data = dict(post)
            post_data['reviews'] = json.loads(post_data['reviews'])
            posts_list.append(post_data)

        return jsonify(posts_list)
        
    except sqlite3.Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@posts_bp.route('/create', methods=['POST'])
def createPost():
    conn = None
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['userId', 'reviews', 'title', 'description', 'photo']
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields"}), 400

        # Validate reviews array
        if not isinstance(data['reviews'], list) or not all(isinstance(r, int) and 1 <= r <= 5 for r in data['reviews']):
            return jsonify({"error": "Reviews must be an array of integers (1-5)"}), 400

        # Serialize reviews to JSON string
        reviews_json = json.dumps(data['reviews'])
        
        conn = get_db_connection()
        
        # Insert post with parameterized query
        cursor = conn.execute('''
            INSERT INTO posts 
            (userId, reviews, title, description, createdAt, photo, location)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['userId'],
            reviews_json,
            data['title'],
            data['description'],
            datetime.utcnow().isoformat(),  # Server-generated timestamp
            data['photo'],
            data['location']
        ))
        
        conn.commit()
        
        return jsonify({
            "message": "Post created successfully",
            "post_id": cursor.lastrowid
        }), 201

    except sqlite3.Error as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500
    finally:
        if conn:
            conn.close()


