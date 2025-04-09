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

def get_db_connection(): # Connect to SQLite database
    conn = sqlite3.connect('database/app.db')
    conn.row_factory = sqlite3.Row
    return conn

posts_bp = Blueprint('posts', __name__)

# Get All Posts
@posts_bp.route('/all', methods=['GET'])
@check_authentication # Authentication Middleware
def get_posts():
    conn = get_db_connection()
    try:
        # Modified query to include reviews with the posts
        posts = conn.execute('''
            SELECT p.*, u.username
            FROM posts p
            LEFT JOIN users u ON p.userId = u.id
        ''').fetchall()

        if not posts:
            return jsonify({"message": "No posts found"}), 404

        posts_list = []
        for post in posts:
            post_data = dict(post)

            # Fetch reviews for this post
            reviews = conn.execute('''
                SELECT r.rating, r.userId, u.username, r.content
                FROM reviews r
                JOIN users u ON r.userId = u.id
                WHERE r.postId = ?
            ''', (post_data['id'],)).fetchall()

            # Calculate average rating
            ratings = [review['rating'] for review in reviews]
            post_data['reviews'] = {
                'ratings': [dict(r) for r in reviews],
                'average': sum(ratings) / len(ratings) if ratings else 0,
                'count': len(ratings)
            }

            posts_list.append(post_data)

        return jsonify(posts_list)

    except sqlite3.Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# Create Post
@posts_bp.route('/create', methods=['POST'])
@check_authentication # Authentication Middleware
def createPost():
    conn = None
    try:
        data = request.get_json()

        # Validate required fields (excluding userId and reviews)
        required_fields = ['title', 'description', 'photo', 'location']
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields"}), 400

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
        if data['title'] != "" and data['description'] != "" and data['photo'] != "" and data['location'] != "":
            cursor = conn.execute('''
                INSERT INTO posts 
                (userId, title, description, createdAt, photo, location)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                user_id,  # Use the userId from the token
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

# Get Post By Title
@posts_bp.route('/<string:title>', methods=['GET'])
@check_authentication # Authentication Middleware
def get_post_by_title(title):
    conn = get_db_connection()

    try:
        post = conn.execute('''
            SELECT p.*, u.username 
            FROM posts p
            JOIN users u ON p.userId = u.id
            WHERE p.title = ?
        ''', (title,)).fetchone()

        if not post:
            return jsonify({"error": "Post Not Found"}), 404

        post_data = dict(post)

        # Fetch reviews for this post
        reviews = conn.execute('''
            SELECT r.id, r.rating, r.userId, r.createdAt, u.username
            FROM reviews r
            JOIN users u ON r.userId = u.id
            WHERE r.postId = ?
        ''', (post_data['id'],)).fetchall()

        # Calculate average rating
        ratings = [review['rating'] for review in reviews]
        post_data['reviews'] = {
            'ratings': [dict(r) for r in reviews],
            'average': sum(ratings) / len(ratings) if ratings else 0,
            'count': len(ratings)
        }

        return jsonify(post_data), 200

    except Exception as e:
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500

    finally:
        if conn:
            conn.close()


#

# Add a Review
@posts_bp.route('/review/<int:id>', methods=['PUT'])
@check_authentication
def update_post_review(id):
    conn = get_db_connection()
    try:
        data = request.get_json()
        if 'rating' not in data:
            return jsonify({"error": "Rating is required"}), 400

        # Validate rating
        if not isinstance(data['rating'], int) or not (1 <= data['rating'] <= 5):
            return jsonify({"error": "Rating must be an integer between 1 and 5"}), 400

        # Check if content field exists, set default if not
        content = data.get('content', '')  # Default empty string if not provided

        # Get post to verify it exists
        post = conn.execute('SELECT id FROM posts WHERE id = ?', (id,)).fetchone()
        if not post:
            return jsonify({"error": "Post Not Found"}), 404

        # Retrieve user ID from token
        token = request.cookies.get('authCookie')
        payloadJWT = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payloadJWT.get("user_id")

        # Check if user has a review to update
        existing_review = conn.execute(
            'SELECT id FROM reviews WHERE userId = ? AND postId = ?',
            (user_id, id)
        ).fetchone()

        conn.execute('BEGIN TRANSACTION')

        if not existing_review:
            # Instead of returning an error, create a new review
            conn.execute(
                'INSERT INTO reviews (userId, postId, rating, content, createdAt) VALUES (?, ?, ?, ?, ?)',
                (user_id, id, data['rating'], content, datetime.utcnow().isoformat())
            )
            message = "Review created successfully"
        else:
            # Update the existing review - ONLY for the current user
            conn.execute(
                'UPDATE reviews SET rating = ?, content = ? WHERE userId = ? AND postId = ?',
                (data['rating'], content, user_id, id)
            )
            message = "Review updated successfully"

        conn.execute('COMMIT')

        # Get all reviews for this post to return
        reviews = conn.execute('''
            SELECT r.id, r.rating, r.userId, r.content, r.createdAt, u.username
            FROM reviews r
            JOIN users u ON r.userId = u.id
            WHERE r.postId = ?
        ''', (id,)).fetchall()

        # Calculate average rating
        ratings = [review['rating'] for review in reviews]
        review_data = {
            'ratings': [dict(r) for r in reviews],
            'average': sum(ratings) / len(ratings) if ratings else 0,
            'count': len(ratings)
        }

        return jsonify({
            "message": message,
            "reviews": review_data
        }), 200

    except sqlite3.Error as e:
        if conn:
            conn.execute('ROLLBACK')
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        if conn:
            conn.execute('ROLLBACK')
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500
    finally:
        if conn:
            conn.close()
            
            
@posts_bp.route('/delete/<int:id>', methods=['DELETE'])
@check_authentication
def delete_Post(id):
    conn = get_db_connection();
    try:
        post = conn.execute('DELETE FROM posts WHERE id = ?', (id,))
        if not post:
            return jsonify({"error": "Post Not Found"}), 404
        conn.commit()
        return jsonify({"message": "Post deleted successfully"}), 200
    
    except sqlite3.Error as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500
        
    except Exception as e:
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500
    finally:
        if conn:
            conn.close()