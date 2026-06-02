from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.chunker import split_chunks
from services.gemini import translate_chunk
from services.supabase_client import get_glossary

router = APIRouter()


class TranslateRequest(BaseModel):
    text: str
    lang: str  # 'EN' or 'CN'


class TranslateResponse(BaseModel):
    translated: str
    chunks: int


@router.post("/translate", response_model=TranslateResponse)
async def translate(req: TranslateRequest):
    if req.lang not in ("EN", "CN"):
        raise HTTPException(status_code=400, detail="lang ต้องเป็น 'EN' หรือ 'CN'")
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="text ว่างเปล่า")

    glossary = get_glossary(req.lang)
    chunks = split_chunks(req.text)

    translated_parts: list[str] = []
    for chunk in chunks:
        result = translate_chunk(chunk, req.lang, glossary)
        translated_parts.append(result)

    return TranslateResponse(
        translated="\n\n".join(translated_parts),
        chunks=len(chunks),
    )
