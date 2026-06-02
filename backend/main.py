from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from routers import translate, history

load_dotenv()

app = FastAPI(title="NovelLog API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ปรับเป็น Vercel URL จริงตอน deploy: ["https://your-app.vercel.app"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(translate.router)
app.include_router(history.router)


@app.get("/")
def root():
    return {"status": "ok"}
