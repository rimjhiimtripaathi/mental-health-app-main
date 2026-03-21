# backend/app/services/user_service.py
import secrets
import hashlib
from datetime import datetime
from typing import Optional
import json
import os

from app.models.models import UserCreate, UserResponse
from app.utils.security import verify_password

class UserService:
    """Service class for user management operations"""
    
    # In production, use a proper database
    USERS_FILE = "data/users.json"
    
    @classmethod
    def _load_users(cls):
        """Load users from JSON file"""
        os.makedirs(os.path.dirname(cls.USERS_FILE), exist_ok=True)
        try:
            with open(cls.USERS_FILE, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            return {}
    
    @classmethod
    def _save_users(cls, users):
        """Save users to JSON file"""
        with open(cls.USERS_FILE, 'w') as f:
            json.dump(users, f, indent=2, default=str)
    
    @classmethod
    def _hash_password(cls, password: str, salt: Optional[str] = None):
        """Hash password with salt using PBKDF2"""
        if salt is None:
            salt = secrets.token_hex(16)
        
        password_hash = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            salt.encode('utf-8'),
            100000
        ).hex()
        
        return password_hash, salt
    
    @classmethod
    def create_user(cls, user_data: UserCreate):
        """
        Create a new user in the system
        """
        users = cls._load_users()
        
        # Generate unique user ID
        user_id = secrets.token_hex(8)
        
        # Hash password
        password_hash, salt = cls._hash_password(user_data.password)
        
        # Create user object
        user = {
            "user_id": user_id,
            "email": user_data.email.lower(),
            "full_name": user_data.full_name,
            "password_hash": password_hash,
            "salt": salt,
            "created_at": datetime.now().isoformat(),
            "last_login": None
        }
        
        # Save user
        users[user_data.email.lower()] = user
        cls._save_users(users)
        
        return UserResponse(
            user_id=user_id,
            email=user_data.email,
            full_name=user_data.full_name,
            created_at=datetime.fromisoformat(user["created_at"]),
            last_login=None
        )
    
    @classmethod
    def get_user_by_email(cls, email: str):
        """
        Get user by email address
        """
        users = cls._load_users()
        user_data = users.get(email.lower())
        
        if user_data:
            return UserResponse(
                user_id=user_data["user_id"],
                email=user_data["email"],
                full_name=user_data["full_name"],
                created_at=datetime.fromisoformat(user_data["created_at"]),
                last_login=datetime.fromisoformat(user_data["last_login"]) if user_data["last_login"] else None
            )
        return None
    
    @classmethod
    def get_user_by_id(cls, user_id: str):
        """
        Get user by user ID
        """
        users = cls._load_users()
        for user_data in users.values():
            if user_data["user_id"] == user_id:
                return UserResponse(
                    user_id=user_data["user_id"],
                    email=user_data["email"],
                    full_name=user_data["full_name"],
                    created_at=datetime.fromisoformat(user_data["created_at"]),
                    last_login=datetime.fromisoformat(user_data["last_login"]) if user_data["last_login"] else None
                )
        return None
    
    @classmethod
    def update_last_login(cls, user_id: str):
        """
        Update user's last login timestamp
        
        Args:
            user_id: User ID to update
        """
        users = cls._load_users()
        
        for email, user_data in users.items():
            if user_data["user_id"] == user_id:
                user_data["last_login"] = datetime.now().isoformat()
                cls._save_users(users)
                break
    
    @classmethod
    def verify_user_password(cls, email: str, password: str) -> bool:
        """
        Verify user password
        
        Args:
            email: User email
            password: Password to verify
            
        Returns:
            bool: True if password is correct
        """
        users = cls._load_users()
        user_data = users.get(email.lower())
        
        if not user_data:
            return False
        
        return verify_password(password, user_data["password_hash"], user_data["salt"])