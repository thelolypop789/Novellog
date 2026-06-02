import os
from supabase import create_client, Client

_client: Client | None = None


def get_client() -> Client:
    global _client
    if _client is None:
        _client = create_client(
            os.environ["SUPABASE_URL"],
            os.environ["SUPABASE_KEY"],
        )
    return _client


def save_translation(lang: str, original: str, translated: str) -> None:
    get_client().table("translations").insert(
        {"source_lang": lang, "original": original, "translated": translated}
    ).execute()


def get_translations(limit: int = 50) -> list[dict]:
    res = (
        get_client()
        .table("translations")
        .select("*")
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return res.data


def get_glossary(lang: str) -> dict[str, str]:
    res = (
        get_client()
        .table("glossary")
        .select("source_word, target_word")
        .eq("lang", lang)
        .execute()
    )
    return {row["source_word"]: row["target_word"] for row in res.data}


def upsert_glossary(source_word: str, target_word: str, lang: str) -> None:
    get_client().table("glossary").upsert(
        {"source_word": source_word, "target_word": target_word, "lang": lang},
        on_conflict="source_word,lang",
    ).execute()


def delete_glossary(source_word: str, lang: str) -> None:
    (
        get_client()
        .table("glossary")
        .delete()
        .eq("source_word", source_word)
        .eq("lang", lang)
        .execute()
    )
