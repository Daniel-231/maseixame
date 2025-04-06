from flask import Blueprint, jsonify, request # Flask
import sqlite3 # SQL
import json  # Required for JSON serialization
from datetime import datetime  # For timestamp handling
import jwt  # For JWT handling


from middleware.checkAuthentication import check_authentication

# .env
import os
from dotenv import load_dotenv


load_dotenv(dotenv_path='../.env')
SECRET_KEY = os.getenv('SECRET_KEY')
ALGORITHM = os.getenv('ALGORITHM')

def get_db_connection():
    conn = sqlite3.connect('database/app.db')
    conn.row_factory = sqlite3.Row
    return conn

posts_bp = Blueprint('posts', __name__)

@posts_bp.route('/all', methods=['GET'])
@check_authentication # Authentication Middleware
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
@check_authentication # Authentication Middleware
def createPost():
    conn = None
    try:
        data = request.get_json()

        # Validate required fields (excluding userId)
        required_fields = ['reviews', 'title', 'description', 'photo']
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields"}), 400

        # Validate reviews array
        if not isinstance(data['reviews'], list) or not all(isinstance(r, int) and 1 <= r <= 5 for r in data['reviews']):
            return jsonify({"error": "Reviews must be an array of integers (1-5)"}), 400

        # Serialize reviews to JSON string
        reviews_json = json.dumps(data['reviews'])

        # Retrieve token from cookie
        token = request.cookies.get('authCookie')
        if not token:
            return jsonify({"error": "Token is missing"}), 401

        try:
            # Decode the JWT and get the userId from the token
            payloadJWT = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payloadJWT.get("user_id")
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401

        # Check if the user exists
        conn = get_db_connection()
        user = conn.execute('SELECT id FROM users WHERE id = ?', (user_id,)).fetchone()
        if not user:
            return jsonify({"error": "User not found"}), 404

        # Insert post with the userId from the token
        cursor = conn.execute('''
            INSERT INTO posts 
            (userId, reviews, title, description, createdAt, photo, location)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            user_id,  # Use the userId from the token
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


@posts_bp.route('/<string:title>', methods=['GET'])
@check_authentication # Authentication Middleware
def get_post_by_title(title):
    conn = get_db_connection()
    
    try:
        post = conn.execute('SELECT * FROM posts  WHERE title = ?', (title, )).fetchone()
        if not post:
            return jsonify({"error": f"Post Not Found: "}), 404
        
        post_data = dict(post)
        post_data['reviews'] = json.loads(post_data['reviews']) # Motherfucker Reviews Array

        return jsonify(post_data), 200
        
    except Exception as e:
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500
    
    finally:
        if conn:
            conn.close()
