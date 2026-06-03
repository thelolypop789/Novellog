from fastapi import APIRouter, Depends
from pydantic import BaseModel
from services.auth import get_current_user
from services.supabase_client import (
    save_translation,
    get_translations,
    get_glossary,
    get_novel_glossary_only,
    upsert_glossary,
    delete_glossary,
    get_user_credits,
    get_novels,
    create_novel,
    delete_novel,
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
    novel_id: str | None = None


class NovelCreate(BaseModel):
    title: str
    url: str | None = None
    lang: str = "EN"


@router.get("/history")
async def list_history(user_id: str = Depends(get_current_user)):
    return get_translations(user_id)


@router.post("/history")
async def add_history(req: SaveTranslationRequest, user_id: str = Depends(get_current_user)):
    save_translation(user_id, req.lang, req.original, req.translated)
    return {"status": "ok"}


@router.get("/glossary/{lang}")
async def list_glossary(
    lang: str, novel_id: str | None = None, user_id: str = Depends(get_current_user)
):
    if novel_id:
        data = get_novel_glossary_only(user_id, lang, novel_id)
    else:
        data = get_glossary(user_id, lang)
    return [{"source_word": k, "target_word": v} for k, v in data.items()]


@router.post("/glossary")
async def add_glossary(item: GlossaryItem, user_id: str = Depends(get_current_user)):
    upsert_glossary(user_id, item.source_word, item.target_word, item.lang, item.novel_id)
    return {"status": "ok"}


@router.delete("/glossary/{lang}/{source_word}")
async def remove_glossary(
    lang: str,
    source_word: str,
    novel_id: str | None = None,
    user_id: str = Depends(get_current_user),
):
    delete_glossary(user_id, source_word, lang, novel_id)
    return {"status": "ok"}


@router.get("/novels")
async def list_novels(user_id: str = Depends(get_current_user)):
    return get_novels(user_id)


@router.post("/novels")
async def add_novel(req: NovelCreate, user_id: str = Depends(get_current_user)):
    return create_novel(user_id, req.title, req.url, req.lang)


@router.delete("/novels/{novel_id}")
async def remove_novel(novel_id: str, user_id: str = Depends(get_current_user)):
    delete_novel(user_id, novel_id)
    return {"status": "ok"}


@router.get("/me/credits")
async def my_credits(user_id: str = Depends(get_current_user)):
    return {"credits": get_user_credits(user_id)}
