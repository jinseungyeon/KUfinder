from app.schemas.common import CamelModel


class ImageUploadResponse(CamelModel):
    image_url: str
