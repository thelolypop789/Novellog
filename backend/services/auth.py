from fastapi import Header, HTTPException
from services.supabase_client import get_client


def get_current_user(authorization: str = Header(None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="กรุณาเข้าสู่ระบบก่อน")
    token = authorization[7:]
    try:
        res = get_client().auth.get_user(token)
        if not res.user:
            raise HTTPException(status_code=401, detail="Token ไม่ถูกต้อง")
        return res.user.id
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Token หมดอายุหรือไม่ถูกต้อง")
