from datetime import datetime
from pydantic import BaseModel,ConfigDict
class ContentBase(BaseModel):
    content_type:str; slug:str; title:str; excerpt:str|None=None; content:str|None=None; image_url:str|None=None; is_published:bool=True; sort_order:int=0
class ContentCreate(ContentBase): pass
class ContentUpdate(BaseModel):
    content_type:str|None=None; slug:str|None=None; title:str|None=None; excerpt:str|None=None; content:str|None=None; image_url:str|None=None; is_published:bool|None=None; sort_order:int|None=None
class ContentRead(ContentBase):
    model_config=ConfigDict(from_attributes=True)
    id:int; created_at:datetime
