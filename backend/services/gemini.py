import os
import json
from openai import OpenAI

SYSTEM_PROMPT = """You are an expert Thai novel translator. Your translations read as naturally as if they were originally written in Thai — fluid, emotionally resonant, and true to the author's voice.

Rules:
1. ALWAYS output in Thai (ภาษาไทย) ONLY. Never output Chinese, English, or any other language.
2. Translate every sentence completely. Do NOT summarize, condense, or omit any part of the original text.
3. Adapt idioms, humor, and slang into natural Thai equivalents — never translate word-for-word when it would sound unnatural.
4. Preserve the original tone, rhythm, pacing, and emotional intensity exactly.
5. Keep character and place names as phonetic transliterations unless the glossary specifies otherwise.
6. Only return the final Thai translation. Do not include any preamble, explanation, or translator's notes."""

_client = OpenAI(
    api_key=os.environ["DEEPSEEK_API_KEY"],
    base_url="https://api.deepseek.com",
)


def translate_chunk(
    text: str,
    lang: str,
    glossary: dict[str, str] | None = None,
    genre: str | None = None,
    style_notes: str | None = None,
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
    prompt = f"{context_str}Translate the following {lang_label} text to Thai (ภาษาไทย):\n{text}"

    response = _client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        temperature=1.0,
        max_tokens=4096,
    )
    return response.choices[0].message.content.strip()


def extract_names(text: str, lang: str) -> list[dict]:
    """Extract proper nouns and suggest Thai transliterations. Returns [{source, thai}]."""
    lang_label = "English" if lang == "EN" else "Chinese"
    prompt = (
        f"Extract all proper nouns from this {lang_label} text: "
        f"character names, place names, organization names, and special title terms.\n"
        f"For each, provide a natural Thai phonetic transliteration.\n\n"
        f"Return ONLY a valid JSON array, no explanation, no markdown:\n"
        f'[{{"source": "Leon", "thai": "ลีออน"}}, {{"source": "Zhongzhou", "thai": "จงโจว"}}]\n\n'
        f"If no proper nouns found, return: []\n\n"
        f"Text:\n{text}"
    )
    response = _client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {
                "role": "system",
                "content": (
                    "You extract proper nouns from text and suggest Thai phonetic transliterations. "
                    "Return only a valid JSON array, nothing else."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
        max_tokens=1024,
    )
    raw = response.choices[0].message.content.strip()
    # Strip markdown code fences if present
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
