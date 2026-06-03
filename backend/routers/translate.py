import math
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from openai import APIStatusError
from services.auth import get_current_user
from services.chunker import split_chunks
from services.gemini import translate_chunk
from services.supabase_client import get_glossary, get_user_credits, deduct_credits

CHARS_PER_CREDIT = 1000

router = APIRouter()


class TranslateRequest(BaseModel):
    text: str
    lang: str  # 'EN' or 'CN'


class TranslateResponse(BaseModel):
    translated: str
    chunks: int
    credits_used: int
    credits_remaining: int


@router.post("/translate", response_model=TranslateResponse)
async def translate(req: TranslateRequest, user_id: str = Depends(get_current_user)):
    if req.lang not in ("EN", "CN"):
        raise HTTPException(status_code=400, detail="lang ต้องเป็น 'EN' หรือ 'CN'")
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="text ว่างเปล่า")

    credits_needed = math.ceil(len(req.text) / CHARS_PER_CREDIT)
    remaining = get_user_credits(user_id)
    if remaining < credits_needed:
        raise HTTPException(
            status_code=402,
            detail=f"Credits ไม่พอ ต้องการ {credits_needed} credit มีแค่ {remaining} credit",
        )

    glossary = get_glossary(user_id, req.lang)
    chunks = split_chunks(req.text)

    translated_parts: list[str] = []
    try:
        for chunk in chunks:
            result = translate_chunk(chunk, req.lang, glossary)
            translated_parts.append(result)
    except APIStatusError as e:
        if e.status_code == 402:
            raise HTTPException(status_code=502, detail="DeepSeek credit หมด กรุณาติดต่อผู้ดูแลระบบ")
        raise HTTPException(status_code=500, detail=f"AI API error: {e.message}")

    deduct_credits(user_id, credits_needed)
    credits_after = remaining - credits_needed

    return TranslateResponse(
        translated="\n\n".join(translated_parts),
        chunks=len(chunks),
        credits_used=credits_needed,
        credits_remaining=credits_after,
    )
