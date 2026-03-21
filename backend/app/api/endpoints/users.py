from fastapi import APIRouter, HTTPException, status
from app.services.user_service import UserService

router = APIRouter()

@router.get("/profile/{user_id}")
async def get_user_profile(user_id: str):
    """
    Get user profile by ID
    
    Args:
        user_id: User ID to get profile for
        
    Returns:
        User: User profile information
    """
    try:
        user = UserService.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user profile: {str(e)}"
        )