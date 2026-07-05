from pydantic import BaseModel


class ImageUploadRead(BaseModel):
    filename: str
    original_filename: str
    image_url: str
    content_type: str
    size: int
