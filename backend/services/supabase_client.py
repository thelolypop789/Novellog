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

def get_glossary(user_id: str, lang: str, novel_id: str | None = None) -> dict[str, str]:
    """Global terms, optionally merged with novel-specific (novel overrides global)."""
    db = get_service_client()
    res = (
        db.table("glossary")
        .select("source_word, target_word")
        .eq("user_id", user_id)
        .eq("lang", lang)
        .is_("novel_id", "null")
        .execute()
    )
    result = {row["source_word"]: row["target_word"] for row in res.data}

    if novel_id:
        novel_res = (
            db.table("glossary")
            .select("source_word, target_word")
            .eq("user_id", user_id)
            .eq("lang", lang)
            .eq("novel_id", novel_id)
            .execute()
        )
        for row in novel_res.data:
            result[row["source_word"]] = row["target_word"]

    return result


def get_novel_glossary_only(user_id: str, lang: str, novel_id: str) -> dict[str, str]:
    """Only novel-specific terms (for display in NovelManager)."""
    res = (
        get_service_client()
        .table("glossary")
        .select("source_word, target_word")
        .eq("user_id", user_id)
        .eq("lang", lang)
        .eq("novel_id", novel_id)
        .execute()
    )
    return {row["source_word"]: row["target_word"] for row in res.data}


def upsert_glossary(
    user_id: str, source_word: str, target_word: str, lang: str, novel_id: str | None = None
) -> None:
    db = get_service_client()
    query = (
        db.table("glossary")
        .select("source_word")
        .eq("user_id", user_id)
        .eq("source_word", source_word)
        .eq("lang", lang)
    )
    query = query.eq("novel_id", novel_id) if novel_id else query.is_("novel_id", "null")
    existing = query.execute()

    if existing.data:
        upd = (
            db.table("glossary")
            .update({"target_word": target_word})
            .eq("user_id", user_id)
            .eq("source_word", source_word)
            .eq("lang", lang)
        )
        upd = upd.eq("novel_id", novel_id) if novel_id else upd.is_("novel_id", "null")
        upd.execute()
    else:
        data: dict = {
            "user_id": user_id,
            "source_word": source_word,
            "target_word": target_word,
            "lang": lang,
        }
        if novel_id:
            data["novel_id"] = novel_id
        db.table("glossary").insert(data).execute()


def delete_glossary(user_id: str, source_word: str, lang: str, novel_id: str | None = None) -> None:
    query = (
        get_service_client()
        .table("glossary")
        .delete()
        .eq("user_id", user_id)
        .eq("source_word", source_word)
        .eq("lang", lang)
    )
    query = query.eq("novel_id", novel_id) if novel_id else query.is_("novel_id", "null")
    query.execute()


# --- Novels ---

def get_novels(user_id: str) -> list[dict]:
    res = (
        get_service_client()
        .table("novels")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=False)
        .execute()
    )
    return res.data


def create_novel(user_id: str, title: str, url: str | None, lang: str) -> dict:
    res = (
        get_service_client()
        .table("novels")
        .insert({"user_id": user_id, "title": title, "url": url, "lang": lang})
        .execute()
    )
    return res.data[0]


def delete_novel(user_id: str, novel_id: str) -> None:
    get_service_client().table("novels").delete().eq("user_id", user_id).eq("id", novel_id).execute()


# --- Credits ---

INITIAL_CREDITS = 50


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
    # First time — upsert avoids race condition from concurrent requests
    try:
        get_service_client().table("user_credits").upsert(
            {"user_id": user_id, "credits": INITIAL_CREDITS},
            on_conflict="user_id",
            ignore_duplicates=True,
        ).execute()
    except Exception:
        pass
    return INITIAL_CREDITS


def deduct_credits(user_id: str, amount: int) -> int:
    """Atomic deduction via SQL RPC. Returns remaining credits, or -1 if insufficient."""
    res = get_service_client().rpc(
        "deduct_credits", {"p_user_id": user_id, "p_amount": amount}
    ).execute()
    return res.data


def add_credits(user_id: str, amount: int) -> None:
    """Atomic credit addition via SQL RPC."""
    get_service_client().rpc(
        "add_credits", {"p_user_id": user_id, "p_amount": amount}
    ).execute()
