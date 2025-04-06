from flask import request, jsonify
from functools import wraps
import jwt
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path='../.env')
SECRET_KEY = os.getenv('SECRET_KEY')
ALGORITHM = os.getenv('ALGORITHM')


def check_authentication(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.cookies.get('authCookie')
        
        if not token:
            return jsonify({"error": "Authentication required. Token is missing"}), 401
        
        try:
            payloadJWT = jwt.decode(token, SECRET_KEY,  algorithms=[ALGORITHM])
            request.user_id = payloadJWT.get("user_id")
        
            # Check if user_id exists in the token
            if not request.user_id:
                return jsonify({"error": "Invalid token format"}), 401
        # Catch    
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Authentication failed. Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Authentication failed. Invalid token"}), 401
        
        return f(*args, **kwargs) # If everything is valid, proceed to the route function
    
    return decorated_function
    