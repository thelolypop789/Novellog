import math
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from openai import APIStatusError
from services.auth import get_current_user
from services.chunker import split_chunks
from services.gemini import translate_chunk, extract_names as ai_extract_names
from services.supabase_client import get_glossary, get_user_credits, deduct_credits, add_credits, get_novel

CHARS_PER_CREDIT = 1000

router = APIRouter()


class TranslateRequest(BaseModel):
    text: str
    lang: str  # 'EN' or 'CN'
    novel_id: str | None = None


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

    # Ensure user has a credits row, then do a quick pre-flight check
    remaining = get_user_credits(user_id)
    if remaining < credits_needed:
        raise HTTPException(
            status_code=402,
            detail=f"Credits ไม่พอ ต้องการ {credits_needed} credit มีแค่ {remaining} credit",
        )

    # Deduct BEFORE translating to prevent TOCTOU race condition
    credits_after = deduct_credits(user_id, credits_needed)
    if credits_after == -1:
        raise HTTPException(
            status_code=402,
            detail=f"Credits ไม่พอ (concurrent use detected) ต้องการ {credits_needed} credit",
        )

    novel_genre = None
    novel_style = None
    if req.novel_id:
        novel = get_novel(user_id, req.novel_id)
        if novel:
            novel_genre = novel.get("genre")
            novel_style = novel.get("style_notes")

    glossary = get_glossary(user_id, req.lang, req.novel_id)
    chunks = split_chunks(req.text)

    translated_parts: list[str] = []
    try:
        for chunk in chunks:
            result = translate_chunk(chunk, req.lang, glossary, genre=novel_genre, style_notes=novel_style)
            translated_parts.append(result)
    except APIStatusError as e:
        add_credits(user_id, credits_needed)
        if e.status_code == 402:
            raise HTTPException(status_code=502, detail="DeepSeek credit หมด กรุณาติดต่อผู้ดูแลระบบ")
        raise HTTPException(status_code=500, detail=f"AI API error: {e.message}")
    except Exception as e:
        import traceback
        print(f"TRANSLATE ERROR: {type(e).__name__}: {e!r}", flush=True)
        traceback.print_exc()
        add_credits(user_id, credits_needed)
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")

    return TranslateResponse(
        translated="\n\n".join(translated_parts),
        chunks=len(chunks),
        credits_used=credits_needed,
        credits_remaining=credits_after,
    )


class ExtractNamesRequest(BaseModel):
    text: str
    lang: str


@router.post("/extract-names")
async def extract_names(req: ExtractNamesRequest, user_id: str = Depends(get_current_user)):
    if req.lang not in ("EN", "CN"):
        raise HTTPException(status_code=400, detail="lang ต้องเป็น 'EN' หรือ 'CN'")
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="text ว่างเปล่า")

    credits_needed = max(1, math.ceil(len(req.text) / CHARS_PER_CREDIT))
    remaining = get_user_credits(user_id)
    if remaining < credits_needed:
        raise HTTPException(
            status_code=402,
            detail=f"Credits ไม่พอ ต้องการ {credits_needed} credit มีแค่ {remaining} credit",
        )

    credits_after = deduct_credits(user_id, credits_needed)
    if credits_after == -1:
        raise HTTPException(status_code=402, detail="Credits ไม่พอ")

    try:
        names = ai_extract_names(req.text, req.lang)
    except Exception as e:
        add_credits(user_id, credits_needed)
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")

    return {
        "names": [{"source_word": n["source"], "suggested_thai": n["thai"]} for n in names],
        "credits_used": credits_needed,
        "credits_remaining": credits_after,
    }
