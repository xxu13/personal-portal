"""
Authentication API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, get_current_user_id
from app.core.security import create_access_token
from app.schemas.token import Token
from app.schemas.user import UserCreate, UserResponse, UserLogin
from app.services.user_service import UserService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_create: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Register a new user.
    """
    user_service = UserService(db)
    
    # Check if username exists
    if await user_service.check_username_exists(user_create.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered",
        )
    
    # Check if email exists
    if await user_service.check_email_exists(user_create.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    # Create user
    user = await user_service.create(user_create)
    return user


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """
    Login with username/email and password.
    Returns JWT access token.
    """
    user_service = UserService(db)
    
    user = await user_service.authenticate(
        username=form_data.username,
        password=form_data.password,
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token = create_access_token(subject=user.id)
    
    return Token(access_token=access_token)


@router.post("/login/json", response_model=Token)
async def login_json(
    login_data: UserLogin,
    db: AsyncSession = Depends(get_db),
):
    """
    Login with JSON body (alternative to form-data).
    Returns JWT access token.
    """
    user_service = UserService(db)
    
    user = await user_service.authenticate(
        username=login_data.username,
        password=login_data.password,
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token = create_access_token(subject=user.id)
    
    return Token(access_token=access_token)


@router.post("/logout")
async def logout():
    """
    Logout current user.
    Note: JWT tokens are stateless, so logout is handled client-side.
    This endpoint is provided for API consistency.
    """
    return {"message": "Successfully logged out"}


@router.post("/refresh", response_model=Token)
async def refresh_token(
    current_user_id: int = Depends(get_current_user_id),
):
    """
    Refresh access token.
    """
    access_token = create_access_token(subject=current_user_id)
    return Token(access_token=access_token)

