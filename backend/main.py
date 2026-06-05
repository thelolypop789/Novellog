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
