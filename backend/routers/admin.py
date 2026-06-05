import os
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from services.supabase_client import add_credits, get_user_credits

router = APIRouter(prefix="/admin")


def _verify(x_admin_key: str = Header(...)):
    secret = os.environ.get("ADMIN_SECRET", "")
    if not secret or x_admin_key != secret:
        raise HTTPException(status_code=403, detail="Forbidden")


class AddCreditsRequest(BaseModel):
    user_id: str
    amount: int


@router.post("/add-credits")
def admin_add_credits(req: AddCreditsRequest, x_admin_key: str = Header(...)):
    _verify(x_admin_key)
    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="amount ต้องมากกว่า 0")
    try:
        add_credits(req.user_id, req.amount)
        return {"user_id": req.user_id, "credits_added": req.amount, "credits_now": get_user_credits(req.user_id)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"user_id ไม่ถูกต้อง: {e}")


@router.get("/credits/{user_id}")
def admin_get_credits(user_id: str, x_admin_key: str = Header(...)):
    _verify(x_admin_key)
    try:
        return {"user_id": user_id, "credits": get_user_credits(user_id)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"user_id ไม่ถูกต้อง: {e}")
