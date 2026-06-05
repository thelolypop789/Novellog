from dotenv import load_dotenv
load_dotenv()  # ต้องเรียกก่อน import อื่นที่อ่าน os.environ

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from services.limiter import limiter
from routers import translate, history, admin, scraper

app = FastAPI(title="NovelLog API")

app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "คำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่"},
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(translate.router)
app.include_router(history.router)
app.include_router(admin.router)
app.include_router(scraper.router)


@app.get("/")
def root():
    return {"status": "ok"}
