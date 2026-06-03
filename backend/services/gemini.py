import os
from openai import OpenAI

SYSTEM_PROMPT = (
    "คุณคือนักแปลนิยาย แปลเป็นภาษาไทยสำนวนธรรมชาติ\n"
    "รักษาอารมณ์ต้นฉบับ ห้ามอธิบายหรือเพิ่มเติมใดๆ\n"
    "ตอบเฉพาะข้อความที่แปลแล้วเท่านั้น"
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

    prompt = f"{lang}>TH\n{gloss_str}{text}"
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
