from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.config import Settings


def test_settings_validate_processor_limits() -> None:
    with pytest.raises(ValidationError):
        Settings(max_faces=0)


def test_api_token_is_stored_as_a_secret() -> None:
    settings = Settings(api_token="processor-secret")

    assert str(settings.api_token) == "**********"
    assert settings.api_token is not None
    assert settings.api_token.get_secret_value() == "processor-secret"

