import os
from fastapi import APIRouter, HTTPException, Header, Query
from pydantic import BaseModel
from services.supabase_client import add_credits, get_user_credits, get_service_client

router = APIRouter(prefix="/admin")


def _verify(x_admin_key: str):
    secret = os.environ.get("ADMIN_SECRET", "")
    if not secret or x_admin_key != secret:
        raise HTTPException(status_code=403, detail="Forbidden")


def _resolve_user_id(email: str) -> str:
    try:
        users = get_service_client().auth.admin.list_users()
        for user in users:
            if user.email == email:
                return str(user.id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ไม่สามารถค้นหา user ได้: {e}")
    raise HTTPException(status_code=404, detail=f"ไม่พบ user สำหรับ email: {email}")


class AddCreditsRequest(BaseModel):
    email: str
    amount: int


@router.get("/lookup")
def admin_lookup(email: str = Query(...), x_admin_key: str = Header(...)):
    _verify(x_admin_key)
    user_id = _resolve_user_id(email)
    return {"email": email, "credits": get_user_credits(user_id)}


@router.post("/add-credits")
def admin_add_credits(req: AddCreditsRequest, x_admin_key: str = Header(...)):
    _verify(x_admin_key)
    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="amount ต้องมากกว่า 0")
    user_id = _resolve_user_id(req.email)
    add_credits(user_id, req.amount)
    return {
        "email": req.email,
        "credits_added": req.amount,
        "credits_now": get_user_credits(user_id),
    }
