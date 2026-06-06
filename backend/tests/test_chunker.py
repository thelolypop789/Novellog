import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from services.chunker import split_chunks


def test_empty_string():
    assert split_chunks("") == []


def test_single_short_paragraph():
    result = split_chunks("Hello world")
    assert result == ["Hello world"]


def test_whitespace_only():
    assert split_chunks("   \n\n  ") == []


def test_multiple_short_paragraphs_merged():
    text = "Para one\nPara two\nPara three"
    result = split_chunks(text)
    assert len(result) == 1
    assert "Para one" in result[0]
    assert "Para three" in result[0]


def test_chunk_size_respected():
    long_para = "A" * 800
    text = f"{long_para}\n{long_para}"
    result = split_chunks(text, max_chars=1500)
    # Two 800-char paragraphs with newline = 1601 chars → must split
    assert len(result) == 2


def test_oversized_single_paragraph_split():
    # Paragraph larger than max_chars should be split
    text = "word " * 400  # ~2000 chars
    result = split_chunks(text, max_chars=1500)
    assert len(result) >= 2
    for chunk in result:
        assert len(chunk) <= 1500


def test_preserves_content():
    text = "Line A\nLine B\nLine C"
    result = split_chunks(text)
    joined = "\n".join(result)
    assert "Line A" in joined
    assert "Line B" in joined
    assert "Line C" in joined


def test_strips_leading_trailing_whitespace():
    text = "  hello  \n  world  "
    result = split_chunks(text)
    assert all(c == c.strip() for c in result)


def test_no_empty_chunks():
    text = "\n\n\nhello\n\n\nworld\n\n\n"
    result = split_chunks(text)
    assert all(c.strip() for c in result)


def test_exact_boundary():
    # text == max_chars exactly: should be one chunk
    text = "A" * 1500
    result = split_chunks(text, max_chars=1500)
    assert len(result) == 1


def test_one_over_boundary_with_spaces():
    # Words with spaces: textwrap can split at word boundaries
    # ~1501 chars of "word " = easy split
    text = ("hello " * 260).strip()  # ~1560 chars
    result = split_chunks(text, max_chars=1500)
    assert len(result) >= 2
    for chunk in result:
        assert len(chunk) <= 1500


def test_one_over_boundary_no_spaces():
    # CJK/no-space text longer than max_chars must be hard-split at character boundary
    text = "A" * 1501
    result = split_chunks(text, max_chars=1500)
    assert len(result) == 2
    assert len(result[0]) == 1500
    assert len(result[1]) == 1
