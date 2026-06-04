import os
from openai import OpenAI

SYSTEM_PROMPT = (
    "You are a professional novel translator. "
    "ALWAYS translate to Thai (ภาษาไทย). "
    "NEVER output Chinese, English, or any other language.\n"
    "คุณคือนักแปลนิยายมืออาชีพ แปลเป็นภาษาไทยเท่านั้น ห้ามแปลเป็นภาษาจีนหรือภาษาอื่นเด็ดขาด\n"
    "รักษาอารมณ์ต้นฉบับ ห้ามอธิบายหรือเพิ่มเติมใดๆ ตอบเฉพาะข้อความที่แปลแล้วเท่านั้น"
)

_client = OpenAI(
    api_key=os.environ["DEEPSEEK_API_KEY"],
    base_url="https://api.deepseek.com",
)


def translate_chunk(text: str, lang: str, glossary: dict[str, str] | None = None) -> str:
    gloss_str = ""
    if glossary:
        pairs = ", ".join(f"{k}={v}" for k, v in glossary.items())
        gloss_str = f"ชื่อ: {pairs}\n"

    lang_label = "English" if lang == "EN" else "Chinese"
    prompt = f"Translate the following {lang_label} text to Thai (ภาษาไทย):\n{gloss_str}{text}"
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
