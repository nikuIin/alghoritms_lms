from base_model import Base
from pydantic import EmailStr
from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from time import time

USER_ROLE_ID = 2

class User(Base):
    __tablename__ = "user"

    user_login = Column(String(255), primary_key=True)
    email = Column(String(320), unique=True, nullable=False)
    phone = Column(String(18), unique=True)
    password = Column(String(60), nullable=False)
    role_id = Column(Integer, ForeignKey("role.role_id"), nullable=False)
    role = relationship("Role", back_populates="users")
    md_user = relationship("MdUser", back_populates="user", uselist=False)


class MdUser(Base):
    __tablename__ = "md_user"

    user_login = Column(String(255), ForeignKey("user.user_login"), primary_key=True)
    first_name = Column(String(255), nullable=False)
    second_name = Column(String(255), nullable=False)
    patronymic = Column(String(255))
    additional_info = Column(String)
    registration_date = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="md_user")

