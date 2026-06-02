import os
import google.generativeai as genai

SYSTEM_PROMPT = (
    "คุณคือนักแปลนิยาย แปลเป็นภาษาไทยสำนวนธรรมชาติ\n"
    "รักษาอารมณ์ต้นฉบับ ห้ามอธิบายหรือเพิ่มเติมใดๆ\n"
    "ตอบเฉพาะข้อความที่แปลแล้วเท่านั้น"
)

genai.configure(api_key=os.environ["GEMINI_API_KEY"])

_model = genai.GenerativeModel(
    model_name="gemini-2.0-flash",
    system_instruction=SYSTEM_PROMPT,
)


def translate_chunk(text: str, lang: str, glossary: dict[str, str] | None = None) -> str:
    gloss_str = ""
    if glossary:
        pairs = ", ".join(f"{k}={v}" for k, v in glossary.items())
        gloss_str = f"ชื่อ: {pairs}\n"

    prompt = f"{lang}>TH\n{gloss_str}{text}"
    response = _model.generate_content(prompt)
    return response.text.strip()
