"""Tests for gemini.py — the API key strip fix and extract_names JSON parsing."""
import sys, os, json
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


def test_api_key_strip():
    """The .strip() fix: key with newline must not crash client init."""
    os.environ["DEEPSEEK_API_KEY"] = "sk-fake-key\n"
    from unittest.mock import patch, MagicMock
    with patch("openai.OpenAI") as mock_openai:
        mock_openai.return_value = MagicMock()
        import importlib
        import services.gemini as gem
        importlib.reload(gem)
        call_args = mock_openai.call_args
        assert call_args is not None
        actual_key = call_args.kwargs.get("api_key") or call_args.args[0] if call_args.args else call_args.kwargs.get("api_key")
        # Key passed to OpenAI must not have trailing newline
        assert actual_key is None or not actual_key.endswith("\n")


def _make_mock_response(content: str):
    from unittest.mock import MagicMock
    mock_choice = MagicMock()
    mock_choice.message.content = content
    mock_resp = MagicMock()
    mock_resp.choices = [mock_choice]
    return mock_resp


def test_extract_names_valid_json():
    os.environ["DEEPSEEK_API_KEY"] = "sk-fake"
    from unittest.mock import patch, MagicMock
    with patch("openai.OpenAI") as mock_openai:
        mock_client = MagicMock()
        mock_openai.return_value = mock_client
        import importlib
        import services.gemini as gem
        importlib.reload(gem)

        mock_client.chat.completions.create.return_value = _make_mock_response(
            '[{"source": "Leon", "thai": "ลีออน"}, {"source": "Zhongzhou", "thai": "จงโจว"}]'
        )
        result = gem.extract_names("Leon traveled to Zhongzhou", "EN")
        assert len(result) == 2
        assert result[0]["source"] == "Leon"
        assert result[0]["thai"] == "ลีออน"


def test_extract_names_strips_markdown_fence():
    os.environ["DEEPSEEK_API_KEY"] = "sk-fake"
    from unittest.mock import patch, MagicMock
    with patch("openai.OpenAI") as mock_openai:
        mock_client = MagicMock()
        mock_openai.return_value = mock_client
        import importlib
        import services.gemini as gem
        importlib.reload(gem)

        raw = '```json\n[{"source": "Leon", "thai": "ลีออน"}]\n```'
        mock_client.chat.completions.create.return_value = _make_mock_response(raw)
        result = gem.extract_names("Leon is here", "EN")
        assert len(result) == 1
        assert result[0]["source"] == "Leon"


def test_extract_names_invalid_json_returns_empty():
    os.environ["DEEPSEEK_API_KEY"] = "sk-fake"
    from unittest.mock import patch, MagicMock
    with patch("openai.OpenAI") as mock_openai:
        mock_client = MagicMock()
        mock_openai.return_value = mock_client
        import importlib
        import services.gemini as gem
        importlib.reload(gem)

        mock_client.chat.completions.create.return_value = _make_mock_response("not json at all")
        result = gem.extract_names("some text", "EN")
        assert result == []


def test_extract_names_empty_array():
    os.environ["DEEPSEEK_API_KEY"] = "sk-fake"
    from unittest.mock import patch, MagicMock
    with patch("openai.OpenAI") as mock_openai:
        mock_client = MagicMock()
        mock_openai.return_value = mock_client
        import importlib
        import services.gemini as gem
        importlib.reload(gem)

        mock_client.chat.completions.create.return_value = _make_mock_response("[]")
        result = gem.extract_names("no names here", "EN")
        assert result == []


def test_extract_names_missing_fields_filtered():
    os.environ["DEEPSEEK_API_KEY"] = "sk-fake"
    from unittest.mock import patch, MagicMock
    with patch("openai.OpenAI") as mock_openai:
        mock_client = MagicMock()
        mock_openai.return_value = mock_client
        import importlib
        import services.gemini as gem
        importlib.reload(gem)

        # One valid, one missing 'thai' field
        raw = '[{"source": "Leon", "thai": "ลีออน"}, {"source": "bad"}]'
        mock_client.chat.completions.create.return_value = _make_mock_response(raw)
        result = gem.extract_names("text", "EN")
        assert len(result) == 1
        assert result[0]["source"] == "Leon"
