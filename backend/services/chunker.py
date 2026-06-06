import textwrap


def split_chunks(text: str, max_chars: int = 1500) -> list[str]:
    paragraphs = text.split("\n")
    chunks: list[str] = []
    current = ""

    for para in paragraphs:
        if len(para) > max_chars:
            # Flush current buffer first
            if current.strip():
                chunks.append(current.strip())
                current = ""
            # Split oversized paragraph at sentence boundaries, fallback to hard wrap
            sub_chunks = textwrap.wrap(
                para,
                width=max_chars,
                break_long_words=False,
                break_on_hyphens=False,
            )
            # textwrap cannot split CJK text (no spaces) — hard-split by character count
            if not sub_chunks or any(len(c) > max_chars for c in sub_chunks):
                sub_chunks = [para[i : i + max_chars] for i in range(0, len(para), max_chars)]
            chunks.extend(sub_chunks)
        elif len(current) + len(para) + 1 > max_chars:
            if current.strip():
                chunks.append(current.strip())
            current = para
        else:
            current = (current + "\n" + para) if current else para

    if current.strip():
        chunks.append(current.strip())

    return [c for c in chunks if c.strip()]
