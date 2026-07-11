from sqlalchemy import Boolean, DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column
from app.db.database import Base
class ContentItem(Base):
    __tablename__="content_items"
    id:Mapped[int]=mapped_column(Integer,primary_key=True)
    content_type:Mapped[str]=mapped_column(String(30),index=True)
    slug:Mapped[str]=mapped_column(String(200),unique=True,index=True)
    title:Mapped[str]=mapped_column(String(255))
    excerpt:Mapped[str|None]=mapped_column(Text)
    content:Mapped[str|None]=mapped_column(Text)
    image_url:Mapped[str|None]=mapped_column(Text)
    is_published:Mapped[bool]=mapped_column(Boolean,default=True,nullable=False)
    sort_order:Mapped[int]=mapped_column(Integer,default=0,nullable=False)
    created_at:Mapped[DateTime]=mapped_column(DateTime(timezone=True),server_default=func.now(),nullable=False)
