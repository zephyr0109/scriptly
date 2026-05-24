from datetime import datetime, timedelta
from typing import Optional, Any
from jose import jwt
import bcrypt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import uuid

from app.infrastructure.database import get_db
from app.domain.models import UserModel

# 보안 설정 (실제 운영 시에는 환경 변수에서 로드해야 함)
SECRET_KEY = "your-secret-key-for-scriptly-project-change-this-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 hours

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

class AuthService:
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """
        비밀번호 검증 (단방향 해시 비교)
        bcrypt는 최대 72바이트까지만 지원하므로 입력값을 UTF-8 72바이트로 제한하여 처리합니다.
        """
        try:
            return bcrypt.checkpw(
                plain_password.encode("utf-8")[:72],
                hashed_password.encode("utf-8")
            )
        except Exception:
            return False

    @staticmethod
    def get_password_hash(password: str) -> str:
        """
        비밀번호 해싱 (bcrypt 사용)
        bcrypt는 최대 72바이트까지만 지원하므로 입력값을 UTF-8 72바이트로 제한하여 처리합니다.
        """
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode("utf-8")[:72], salt)
        return hashed.decode("utf-8")

    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt

    @classmethod
    async def get_user_by_email(cls, db: AsyncSession, email: str) -> Optional[UserModel]:
        result = await db.execute(select(UserModel).where(UserModel.email == email))
        return result.scalars().first()

    @classmethod
    async def get_current_user(
        cls, 
        token: str = Depends(oauth2_scheme), 
        db: AsyncSession = Depends(get_db)
    ) -> UserModel:
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="인증 정보가 유효하지 않습니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            email: str = payload.get("sub")
            if email is None:
                raise credentials_exception
        except Exception:
            raise credentials_exception
            
        user = await cls.get_user_by_email(db, email)
        if user is None:
            raise credentials_exception
        return user
