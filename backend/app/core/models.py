from typing import Literal

from pydantic import BaseModel


class CanvasMouseData(BaseModel):
    x: float
    y: float
    type: Literal["Spray", "Pencil", "Dotted", "Circular"]
    color: str
    width: int
    svgData: str


class CursorData(BaseModel):
    x: float
    y: float
