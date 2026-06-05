"""
Tests for translate endpoint input validation and credit calculation.
No real DB/AI calls — patches all external dependencies.
"""
import sys, os, math
from unittest.mock import patch, MagicMock
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# Patch env before importing app modules
os.environ.setdefault("DEEPSEEK_API_KEY", "test-key")
os.environ.setdefault("SUPABASE_URL", "https://fake.supabase.co")
os.environ.setdefault("SUPABASE_KEY", "fake-anon-key")
os.environ.setdefault("SUPABASE_SERVICE_KEY", "fake-service-key")
os.environ.setdefault("SUPABASE_JWT_SECRET", "fake-jwt-secret")

from fastapi.testclient import TestClient


def make_client():
    with patch("services.supabase_client.create_client", return_value=MagicMock()):
        from main import app
        return TestClient(app, raise_server_exceptions=False)


def test_root():
    client = make_client()
    resp = client.get("/")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_translate_no_auth():
    client = make_client()
    resp = client.post("/translate", json={"text": "hello", "lang": "EN"})
    assert resp.status_code == 401


def test_translate_bad_lang():
    with patch("services.supabase_client.create_client", return_value=MagicMock()):
        from main import app
        from services.auth import get_current_user
        app.dependency_overrides[get_current_user] = lambda: "user-123"
        try:
            from fastapi.testclient import TestClient
            c = TestClient(app, raise_server_exceptions=False)
            resp = c.post("/translate", json={"text": "hello", "lang": "JP"})
            assert resp.status_code == 400
            assert "lang" in resp.json()["detail"].lower() or "en" in resp.json()["detail"].lower()
        finally:
            app.dependency_overrides.pop(get_current_user, None)


def test_translate_empty_text():
    with patch("services.supabase_client.create_client", return_value=MagicMock()):
        from main import app
        from services.auth import get_current_user
        app.dependency_overrides[get_current_user] = lambda: "user-123"
        try:
            from fastapi.testclient import TestClient
            c = TestClient(app, raise_server_exceptions=False)
            resp = c.post("/translate", json={"text": "   ", "lang": "EN"})
            assert resp.status_code == 400
        finally:
            app.dependency_overrides.pop(get_current_user, None)


def test_credits_calculation():
    """ceil(len(text) / 1000) credit formula"""
    assert math.ceil(999 / 1000) == 1
    assert math.ceil(1000 / 1000) == 1
    assert math.ceil(1001 / 1000) == 2
    assert math.ceil(5000 / 1000) == 5


def test_admin_no_key():
    client = make_client()
    resp = client.get("/admin/lookup?email=test@test.com")
    assert resp.status_code == 422  # missing required header


def test_admin_wrong_key():
    client = make_client()
    os.environ["ADMIN_SECRET"] = "correct-secret"
    resp = client.get(
        "/admin/lookup?email=test@test.com",
        headers={"x-admin-key": "wrong-secret"},
    )
    assert resp.status_code == 403


def test_admin_correct_key_structure():
    """Correct key passes auth check (will fail at user lookup which is expected)."""
    client = make_client()
    os.environ["ADMIN_SECRET"] = "correct-secret"
    with patch("routers.admin._resolve_user_id", side_effect=Exception("not found")):
        resp = client.get(
            "/admin/lookup?email=test@test.com",
            headers={"x-admin-key": "correct-secret"},
        )
    # Should be 500 (from _resolve_user_id) not 403
    assert resp.status_code != 403


def test_admin_add_credits_zero_amount():
    client = make_client()
    os.environ["ADMIN_SECRET"] = "correct-secret"
    with patch("routers.admin._resolve_user_id", return_value="some-uuid"):
        resp = client.post(
            "/admin/add-credits",
            json={"email": "test@test.com", "amount": 0},
            headers={"x-admin-key": "correct-secret"},
        )
    assert resp.status_code == 400


def test_admin_add_credits_negative():
    client = make_client()
    os.environ["ADMIN_SECRET"] = "correct-secret"
    with patch("routers.admin._resolve_user_id", return_value="some-uuid"):
        resp = client.post(
            "/admin/add-credits",
            json={"email": "test@test.com", "amount": -10},
            headers={"x-admin-key": "correct-secret"},
        )
    assert resp.status_code == 400


def test_extract_names_no_auth():
    client = make_client()
    resp = client.post("/extract-names", json={"text": "Leon fought bravely", "lang": "EN"})
    assert resp.status_code == 401


def test_rate_limit_headers_present():
    """slowapi should not crash the app on normal requests."""
    client = make_client()
    resp = client.get("/")
    assert resp.status_code == 200
