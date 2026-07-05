from uuid import uuid4

import httpx
from fastapi import HTTPException, UploadFile, status

from app.core.config import settings
from app.schemas.upload import ImageUploadRead

ALLOWED_IMAGE_CONTENT_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}


async def upload_image_to_supabase(file: UploadFile) -> ImageUploadRead:
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase storage is not configured",
        )

    content_type = file.content_type or "application/octet-stream"
    extension = ALLOWED_IMAGE_CONTENT_TYPES.get(content_type)
    if extension is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPG, PNG, WEBP and GIF images are allowed",
        )

    content = await file.read()
    max_size = settings.MAX_UPLOAD_IMAGE_SIZE_MB * 1024 * 1024
    if len(content) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image size must be <= {settings.MAX_UPLOAD_IMAGE_SIZE_MB}MB",
        )
    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Image file is empty")

    folder = settings.SUPABASE_STORAGE_FOLDER.strip("/")
    filename = f"{uuid4().hex}{extension}"
    object_path = f"{folder}/{filename}" if folder else filename

    base_url = settings.SUPABASE_URL.rstrip("/")
    upload_url = f"{base_url}/storage/v1/object/{settings.SUPABASE_STORAGE_BUCKET}/{object_path}"
    headers = {
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
        "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
        "content-type": content_type,
        "x-upsert": "false",
    }
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(upload_url, content=content, headers=headers)
        response.raise_for_status()
    except Exception as exc:
        detail = str(exc)
        if isinstance(exc, httpx.HTTPStatusError):
            detail = exc.response.text
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Could not upload image to Supabase: {detail}",
        ) from exc

    image_url = f"{base_url}/storage/v1/object/public/{settings.SUPABASE_STORAGE_BUCKET}/{object_path}"
    return ImageUploadRead(
        filename=object_path,
        original_filename=file.filename or filename,
        image_url=image_url,
        content_type=content_type,
        size=len(content),
    )
