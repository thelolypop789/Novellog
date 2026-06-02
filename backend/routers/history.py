from fastapi import APIRouter
from pydantic import BaseModel
from services.supabase_client import (
    save_translation,
    get_translations,
    get_glossary,
    upsert_glossary,
    delete_glossary,
)

router = APIRouter()


class SaveTranslationRequest(BaseModel):
    lang: str
    original: str
    translated: str


class GlossaryItem(BaseModel):
    source_word: str
    target_word: str
    lang: str


@router.get("/history")
async def list_history():
    return get_translations()


@router.post("/history")
async def add_history(req: SaveTranslationRequest):
    save_translation(req.lang, req.original, req.translated)
    return {"status": "ok"}


@router.get("/glossary/{lang}")
async def list_glossary(lang: str):
    data = get_glossary(lang)
    return [{"source_word": k, "target_word": v} for k, v in data.items()]


@router.post("/glossary")
async def add_glossary(item: GlossaryItem):
    upsert_glossary(item.source_word, item.target_word, item.lang)
    return {"status": "ok"}


@router.delete("/glossary/{lang}/{source_word}")
async def remove_glossary(lang: str, source_word: str):
    delete_glossary(source_word, lang)
    return {"status": "ok"}
