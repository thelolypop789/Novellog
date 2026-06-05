import re
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from services.auth import get_current_user
from services.limiter import limiter
from fastapi import Request

router = APIRouter()

FETCH_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}

CHAPTER_PATTERN = re.compile(
    r"(chapter|ch|ep|episode|chap|part|ตอน|บทที่|บท)[-_\s]?\d+",
    re.IGNORECASE,
)

CONTENT_SELECTORS = [
    "#chapter-content", "#content", "#chapter-body",
    ".chapter-content", ".content", ".text-left", ".desc-text",
    ".chapter-body", ".reading-content", ".entry-content",
    "article", ".post-content", ".novel-content",
    "[class*='chapter']", "[id*='chapter']",
]


def _fetch_html(url: str) -> str:
    try:
        with httpx.Client(follow_redirects=True, timeout=15, headers=FETCH_HEADERS) as c:
            r = c.get(url)
            r.raise_for_status()
        return r.text
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="เว็บปลายทางตอบช้าเกินไป (timeout 15s)")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"เว็บปลายทางตอบกลับ {e.response.status_code}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"ไม่สามารถดึงข้อมูลได้: {e}")


def _extract_chapter_links(html: str, base_url: str) -> tuple[list[dict], bool]:
    """Returns (chapters, is_auto_detected)"""
    soup = BeautifulSoup(html, "lxml")
    base_domain = urlparse(base_url).netloc

    all_links: list[dict] = []
    seen: set[str] = set()
    for a in soup.find_all("a", href=True):
        href = (a.get("href") or "").strip()
        title = a.get_text(separator=" ", strip=True)[:120]
        if not href or not title or href.startswith(("#", "javascript", "mailto")):
            continue
        full_url = urljoin(base_url, href)
        parsed = urlparse(full_url)
        if parsed.netloc != base_domain or full_url in seen:
            continue
        seen.add(full_url)
        all_links.append({"title": title, "url": full_url})

    # Filter to chapter-like links
    chapter_links = [
        l for l in all_links
        if CHAPTER_PATTERN.search(l["url"]) or CHAPTER_PATTERN.search(l["title"])
    ]
    if chapter_links:
        return chapter_links, True

    # Fallback: return all same-domain links (user can browse manually)
    return all_links[:200], False


def _extract_main_text(html: str) -> str:
    soup = BeautifulSoup(html, "lxml")

    # Remove boilerplate tags
    for tag in soup(["script", "style", "nav", "footer", "header",
                     "aside", "form", "button", "noscript", "iframe"]):
        tag.decompose()

    # Try known content selectors
    for sel in CONTENT_SELECTORS:
        el = soup.select_one(sel)
        if el:
            text = el.get_text(separator="\n", strip=True)
            if len(text) > 300:
                return _clean_text(text)

    # Heuristic: largest <div>/<article>/<section> block
    best_el = None
    best_len = 0
    for tag in soup.find_all(["div", "article", "section"]):
        if tag.find(["div", "article"]):  # skip wrapper elements
            continue
        t = tag.get_text(strip=True)
        if len(t) > best_len:
            best_len = len(t)
            best_el = tag

    if best_el and best_len > 300:
        return _clean_text(best_el.get_text(separator="\n", strip=True))

    return _clean_text(soup.get_text(separator="\n", strip=True))


def _clean_text(text: str) -> str:
    lines = [l.strip() for l in text.splitlines()]
    # Drop very short lines that are likely nav remnants (< 3 chars, not Thai)
    cleaned: list[str] = []
    for l in lines:
        if l:
            cleaned.append(l)
    # Collapse 3+ consecutive blank lines into 1
    result: list[str] = []
    blank_count = 0
    for l in cleaned:
        if l == "":
            blank_count += 1
            if blank_count <= 1:
                result.append(l)
        else:
            blank_count = 0
            result.append(l)
    return "\n".join(result).strip()


# ── Endpoints ────────────────────────────────────────────────────────────────

class FetchChaptersRequest(BaseModel):
    url: str


class FetchChapterTextRequest(BaseModel):
    url: str


@router.post("/scrape/chapters")
@limiter.limit("10/minute")
def fetch_chapters(
    req: FetchChaptersRequest,
    request: Request,
    _user: str = Depends(get_current_user),
):
    url = req.url.strip()
    if not url.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="URL ต้องขึ้นต้นด้วย http:// หรือ https://")

    html = _fetch_html(url)
    soup = BeautifulSoup(html, "lxml")
    site_title = (soup.title.string or "").strip() if soup.title else ""

    chapters, auto_detected = _extract_chapter_links(html, url)

    return {
        "site_title": site_title,
        "chapters": chapters,
        "auto_detected": auto_detected,
        "total": len(chapters),
    }


@router.post("/scrape/chapter-text")
@limiter.limit("10/minute")
def fetch_chapter_text(
    req: FetchChapterTextRequest,
    request: Request,
    _user: str = Depends(get_current_user),
):
    url = req.url.strip()
    if not url.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="URL ต้องขึ้นต้นด้วย http:// หรือ https://")

    html = _fetch_html(url)
    soup = BeautifulSoup(html, "lxml")
    title = (soup.title.string or "").strip() if soup.title else ""
    text = _extract_main_text(html)

    if len(text) < 50:
        raise HTTPException(
            status_code=422,
            detail="ดึงข้อความไม่ได้ — เว็บอาจใช้ JavaScript render หรือต้องการ login",
        )

    return {"title": title, "text": text, "chars": len(text)}
