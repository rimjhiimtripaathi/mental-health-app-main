import hashlib
import jwt
from datetime import datetime, timedelta
from typing import Optional

def verify_password(password: str, stored_hash: str, salt: str) -> bool:
    """
    Verify a password against stored hash and salt
    
    Args:
        password: Plain text password to verify
        stored_hash: Stored password hash
        salt: Salt used for hashing
        
    Returns:
        bool: True if password matches, False otherwise
    """
    password_hash = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    ).hex()
    
    return password_hash == stored_hash

def create_access_token(data: dict, secret_key: str, algorithm: str, expires_delta: Optional[timedelta] = None):
    """
    Create JWT access token
    
    Args:
        data: Data to encode in the token
        secret_key: Secret key for signing
        algorithm: JWT algorithm to use
        expires_delta: Token expiration time
        
    Returns:
        str: Encoded JWT token
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, secret_key, algorithm=algorithm)
    return encoded_jwt