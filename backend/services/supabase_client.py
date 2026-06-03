import os
from supabase import create_client, Client

_anon_client: Client | None = None
_service_client: Client | None = None


def get_client() -> Client:
    global _anon_client
    if _anon_client is None:
        _anon_client = create_client(
            os.environ["SUPABASE_URL"],
            os.environ["SUPABASE_KEY"],
        )
    return _anon_client


def get_service_client() -> Client:
    global _service_client
    if _service_client is None:
        _service_client = create_client(
            os.environ["SUPABASE_URL"],
            os.environ["SUPABASE_SERVICE_KEY"],
        )
    return _service_client


# --- Translations ---

def save_translation(user_id: str, lang: str, original: str, translated: str) -> None:
    get_service_client().table("translations").insert(
        {"user_id": user_id, "source_lang": lang, "original": original, "translated": translated}
    ).execute()


def get_translations(user_id: str, limit: int = 50) -> list[dict]:
    res = (
        get_service_client()
        .table("translations")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return res.data


# --- Glossary ---

def get_glossary(user_id: str, lang: str) -> dict[str, str]:
    res = (
        get_service_client()
        .table("glossary")
        .select("source_word, target_word")
        .eq("user_id", user_id)
        .eq("lang", lang)
        .execute()
    )
    return {row["source_word"]: row["target_word"] for row in res.data}


def upsert_glossary(user_id: str, source_word: str, target_word: str, lang: str) -> None:
    get_service_client().table("glossary").upsert(
        {"user_id": user_id, "source_word": source_word, "target_word": target_word, "lang": lang},
        on_conflict="user_id,source_word,lang",
    ).execute()


def delete_glossary(user_id: str, source_word: str, lang: str) -> None:
    (
        get_service_client()
        .table("glossary")
        .delete()
        .eq("user_id", user_id)
        .eq("source_word", source_word)
        .eq("lang", lang)
        .execute()
    )


# --- Credits ---

INITIAL_CREDITS = 50  # 50,000 chars free on signup


def get_user_credits(user_id: str) -> int:
    res = (
        get_service_client()
        .table("user_credits")
        .select("credits")
        .eq("user_id", user_id)
        .execute()
    )
    if res.data:
        return res.data[0]["credits"]
    # First time — initialize with free credits
    get_service_client().table("user_credits").insert(
        {"user_id": user_id, "credits": INITIAL_CREDITS}
    ).execute()
    return INITIAL_CREDITS


def deduct_credits(user_id: str, amount: int) -> None:
    current = get_user_credits(user_id)
    get_service_client().table("user_credits").update(
        {"credits": max(0, current - amount)}
    ).eq("user_id", user_id).execute()


def add_credits(user_id: str, amount: int) -> None:
    current = get_user_credits(user_id)
    get_service_client().table("user_credits").update(
        {"credits": current + amount}
    ).eq("user_id", user_id).execute()
