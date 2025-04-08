from flask import Blueprint, jsonify, request, make_response
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash

import json
import jwt
import datetime
import uuid

# .env 
from dotenv import load_dotenv
import os

load_dotenv(dotenv_path='../.env')
SECRET_KEY = os.getenv('SECRET_KEY')
ALGORITHM = os.getenv('ALGORITHM')

user_bp = Blueprint('user', __name__) # Blueprint for user-related routes


def get_db_connection(): # Database connection function
    conn = sqlite3.connect('database/app.db')
    conn.row_factory = sqlite3.Row
    return conn

def generate_user_id():
    return str(uuid.uuid4())

# Register
@user_bp.route('/register', methods=['POST'])
def register():
    conn = get_db_connection()
    try:
        data = request.get_json()

        # Validate required fields
        if not data or 'username' not in data or 'password' not in data:
            return jsonify({"error": "Missing username or password"}), 400

        username = data['username']
        password = data['password']

        if not username or not password:
            return jsonify({"error": "Username and password cannot be empty"}), 400

        # Hash the password
        hashed_password = generate_password_hash(password)

        # Check for existing username
        existing_user = conn.execute('SELECT id FROM users WHERE username = ?', (username,)).fetchone()

        if existing_user:
            return jsonify({"error": "Username already exists"}), 409

        # Generate user ID
        user_id = generate_user_id()  # Generate random UUID

        # Insert the new user into the database
        conn.execute(
            'INSERT INTO users (id, username, password) VALUES (?, ?, ?)',
            (user_id, username, hashed_password)
        )
        conn.commit()

        return jsonify({"message": "User registered successfully", "user_id": user_id}), 201

    except sqlite3.Error as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500
    finally:
        if conn:
            conn.close()

# Login
@user_bp.route('/login', methods=['POST'])
def login():
    conn = get_db_connection()
    try:
        data = request.get_json()
        if not data or 'username' not in data or 'password' not in data:
            return jsonify({"error": "Missing username or password"}), 400

        username = data['username']
        password = data['password']

        # Look up the user
        user = conn.execute('SELECT id, password FROM users WHERE username = ?', (username,)).fetchone()
        if user is None or not check_password_hash(user['password'], password):
            return jsonify({"error": "Invalid credentials"}), 401

        # Create a JWT payload with an expiration time (6 Hours)
        payloadJWT = {
            'user_id': user['id'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=6)
        }
        token = jwt.encode(payloadJWT, SECRET_KEY, algorithm=ALGORITHM)

        # Build the response
        response = make_response(jsonify({
            "message": "Login successful",
            "token": token
        }), 200)
        
        # Optionally, set the JWT in an HttpOnly cookie
        response.set_cookie(
            "authCookie",
            token,
            max_age=60 * 60,  # 1 hour
            secure=True,
            httponly=True,
            samesite='Lax'
        )

        return response

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


@user_bp.route('/profile', methods=['GET'])
def profile():
    conn = get_db_connection()
    # Retrieve token from cookie
    token = request.cookies.get('authCookie')
    if not token:
        return jsonify({"error": "Token is missing"}), 401

    try:
        payloadJWT = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM]) # Decode the token and verify its signature and expiration
        user_id = payloadJWT.get("user_id")
        
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401
    
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401

    
    try:
        user = conn.execute('SELECT id, username FROM users WHERE id = ?', (user_id,)).fetchone() # Get User Info
        posts = conn.execute('SELECT * FROM posts WHERE userId = ?', (user_id,)).fetchall() # Get User Posts
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        if not posts:
            return jsonify({"message": "No posts found"}), 404
        
        posts_list = []
        for post in posts:
            post_data = dict(post)
            post_data['reviews'] = json.loads(post_data['reviews'])
            posts_list.append(post_data)
            
        if user:
            return jsonify({"id": user['id'], "username": user['username'], "posts": posts_list}), 200
        else:
            return jsonify({"error": "User not found"}), 404
    except sqlite3.Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()
        
        
# Logout
@user_bp.route('/logout', methods=['POST'])
def logout():
    response = make_response(jsonify({"message": "Logged out successfully"}), 200)
    response.set_cookie('authCookie', '', expires=0)
    return response


# Check User Login Status
@user_bp.route('/status', methods=['GET'])
def check_status():
    token = request.cookies.get('authCookie')
    if not token:
        return jsonify({"logged_in": False}), 200

    try:
        payloadJWT = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payloadJWT.get("user_id")
        return jsonify({"logged_in": True, "user_id": user_id}), 200
    except jwt.ExpiredSignatureError:
        return jsonify({"logged_in": False}), 200
    except jwt.InvalidTokenError:
        return jsonify({"logged_in": False}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
