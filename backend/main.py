from dotenv import load_dotenv
load_dotenv()  # ต้องเรียกก่อน import อื่นที่อ่าน os.environ

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import translate, history

app = FastAPI(title="NovelLog API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(translate.router)
app.include_router(history.router)


@app.get("/")
def root():
    return {"status": "ok"}


@app.get("/diag")
def diag():
    import httpx, os, socket
    result = {}
    try:
        result["dns"] = socket.gethostbyname("api.deepseek.com")
    except Exception as e:
        result["dns_error"] = f"{type(e).__name__}: {e}"
    try:
        r = httpx.get("https://api.deepseek.com/", timeout=10)
        result["http_status"] = r.status_code
    except Exception as e:
        result["http_error"] = f"{type(e).__name__}: {e}"
    result["has_key"] = bool(os.environ.get("DEEPSEEK_API_KEY"))
    return result
