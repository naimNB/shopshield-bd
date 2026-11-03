"""Screenshot extraction schemas for ShopShield BD."""

from typing import Dict, Optional
from pydantic import BaseModel, Field


class ScreenshotExtractionResponse(BaseModel):
    """Response payload for screenshot OCR text extraction."""

    status: str = Field(default="success", description="Status indicator of the OCR extraction")
    extracted_text: str = Field(description="Exact visible text extracted from the screenshot")
    source_type: str = Field(description="Input category: 'advertisement' or 'seller_chat'")
    character_count: int = Field(description="Total characters extracted from the image")
    image_dimensions: Dict[str, int] = Field(description="Width and height of the processed image in pixels")
    model_used: Optional[str] = Field(default=None, description="Gemini model that performed OCR")
