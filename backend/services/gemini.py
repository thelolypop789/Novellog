import os
import json
from openai import OpenAI

SYSTEM_PROMPT = """You are a professional Thai novelist who translates foreign novels into Thai. Your goal is Thai prose that reads as if it was originally written in Thai — not a translation.

Core principles:
1. OUTPUT IN THAI ONLY. Never mix in English, Chinese, or any other language.
2. Translate the full meaning of every passage. Do not skip, summarize, or merge sentences.
3. Rewrite for natural Thai flow — restructure sentences, split or combine clauses, and choose Thai phrasing that carries the same emotional weight as the original. Avoid word-for-word rendering.
4. Capture the emotional core: tension feels tense, humor lands, tenderness moves the reader. Tone and pacing are as important as content.
5. Use natural Thai particles, rhythm, and idioms. Internal monologue should feel immediate; dialogue should match each character's voice.
6. Apply glossary terms exactly as given. For names not in the glossary, use phonetic Thai transliteration.
7. Return only the translated Thai text. No notes, no explanations, no preamble."""

_client = OpenAI(
    api_key=os.environ["DEEPSEEK_API_KEY"].strip(),
    base_url="https://api.deepseek.com",
)


def translate_chunk(
    text: str,
    lang: str,
    glossary: dict[str, str] | None = None,
    genre: str | None = None,
    style_notes: str | None = None,
    prev_context: str = "",
) -> str:
    context_parts = []

    if genre:
        context_parts.append(f"Genre: {genre}")
    if style_notes:
        context_parts.append(f"Style notes: {style_notes}")
    if glossary:
        pairs = ", ".join(f"{k}={v}" for k, v in glossary.items())
        context_parts.append(f"Glossary: {pairs}")

    context_str = "\n".join(context_parts)
    if context_str:
        context_str += "\n\n"

    lang_label = "English" if lang == "EN" else "Chinese"

    if prev_context:
        prompt = (
            f"{context_str}"
            f"[Preceding source text for context — do NOT translate this part]:\n{prev_context}\n\n"
            f"Translate the following {lang_label} text to Thai (ภาษาไทย):\n{text}"
        )
    else:
        prompt = f"{context_str}Translate the following {lang_label} text to Thai (ภาษาไทย):\n{text}"

    response = _client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        temperature=0.7,
        max_tokens=4096,
    )
    return response.choices[0].message.content.strip()


def extract_names(text: str, lang: str) -> list[dict]:
    """Extract proper nouns and special terms. Returns [{source, thai, type}]."""
    lang_label = "English" if lang == "EN" else "Chinese"
    prompt = (
        f"From this {lang_label} novel text, extract two categories:\n"
        f"1. Proper nouns (type: 'name'): character names, place names, organization names, honorifics/titles\n"
        f"2. Special terms (type: 'term'): cultivation realms/stages, techniques/skills, spells, "
        f"   artifact/weapon names, pills/items, world-specific concepts that need consistent translation\n\n"
        f"For each item provide a natural Thai equivalent "
        f"(phonetic transliteration for names; translated or transliterated for terms).\n\n"
        f"Return ONLY a valid JSON array, no explanation, no markdown:\n"
        f'[{{"source": "Leon", "thai": "ลีออน", "type": "name"}}, '
        f'{{"source": "Golden Core", "thai": "แก่นทอง", "type": "term"}}]\n\n'
        f"If nothing found, return: []\n\n"
        f"Text:\n{text}"
    )
    response = _client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {
                "role": "system",
                "content": (
                    "You extract proper nouns and domain-specific terms from novel text, "
                    "then suggest Thai translations or phonetic transliterations. "
                    "Categorize each as 'name' (proper noun) or 'term' (special concept/skill/item). "
                    "Return only a valid JSON array, nothing else."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
        max_tokens=1024,
    )
    raw = response.choices[0].message.content.strip()
    if raw.startswith("```"):
        parts = raw.split("```")
        raw = parts[1].lstrip("json").strip() if len(parts) > 1 else raw
    try:
        result = json.loads(raw)
        if isinstance(result, list):
            return [
                r for r in result
                if isinstance(r, dict) and "source" in r and "thai" in r
            ]
    except (json.JSONDecodeError, ValueError):
        pass
    return []
