from urllib.parse import quote

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.security import create_access_token, create_password_reset_token, decode_password_reset_token, get_password_hash, verify_password
from app.db.database import get_db
from app.models.user import User
from app.models.loyalty import LoyaltyTransaction
from app.schemas.loyalty import LoyaltyTransactionRead
from app.schemas.user import (
    LoginRequest,
    ForgotPasswordRequest,
    PasswordResetRequest,
    Token,
    UserAvatarUpdate,
    UserCreate,
    UserPasswordChange,
    UserProfileUpdate,
    UserRead,
)
from app.services.storage_service import upload_image_to_supabase
from app.services.email_service import password_reset_email_is_configured, send_password_reset_email
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)) -> User:
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        full_name=payload.full_name,
        email=payload.email,
        password_hash=get_password_hash(payload.password),
        phone=payload.phone,
        avatar_url=payload.avatar_url,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> Token:
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is inactive")

    return Token(access_token=create_access_token(str(user.id)))


@router.post("/forgot-password")
def forgot_password(
    payload: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> dict:
    user = db.query(User).filter(User.email == payload.email).first()
    if user and password_reset_email_is_configured():
        token = create_password_reset_token(str(user.id))
        reset_url = f"{settings.FRONTEND_URL.rstrip('/')}/forgot-password?reset_token={quote(token)}"
        background_tasks.add_task(send_password_reset_email, user.email, reset_url)
    return {"message": "Nếu email tồn tại, liên kết đặt lại mật khẩu sẽ được gửi đến hộp thư."}


@router.post("/reset-password")
def reset_password(payload: PasswordResetRequest, db: Session = Depends(get_db)) -> dict:
    user_id = decode_password_reset_token(payload.token)
    user = db.get(User, int(user_id)) if user_id and user_id.isdigit() else None
    if user is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reset token is invalid or expired")
    user.password_hash = get_password_hash(payload.new_password)
    db.commit()
    return {"message": "Password updated"}


@router.get("/me", response_model=UserRead)
def read_me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.get("/me/loyalty", response_model=list[LoyaltyTransactionRead])
def read_my_loyalty_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[LoyaltyTransaction]:
    return (
        db.query(LoyaltyTransaction)
        .filter(LoyaltyTransaction.user_id == current_user.id)
        .order_by(LoyaltyTransaction.created_at.desc())
        .limit(50)
        .all()
    )


@router.patch("/me", response_model=UserRead)
def update_profile(
    payload: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.patch("/me/password", response_model=UserRead)
def change_password(
    payload: UserPasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")

    current_user.password_hash = get_password_hash(payload.new_password)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.patch("/me/avatar", response_model=UserRead)
def update_avatar(
    payload: UserAvatarUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    current_user.avatar_url = payload.avatar_url
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/avatar-upload", response_model=UserRead)
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    upload = await upload_image_to_supabase(file)
    current_user.avatar_url = upload.image_url
    db.commit()
    db.refresh(current_user)
    return current_user
