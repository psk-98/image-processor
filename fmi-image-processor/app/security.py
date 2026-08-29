from __future__ import annotations

import secrets
from typing import Annotated

from fastapi import Header, HTTPException, Request, status


def require_api_token(
    request: Request,
    authorization: Annotated[str | None, Header()] = None,
) -> None:
    expected_token = request.app.state.settings.api_token

    if expected_token is None:
        return

    expected_token_value = expected_token.get_secret_value()

    scheme, separator, provided_token = (authorization or "").partition(" ")
    authenticated = (
        separator == " "
        and scheme.lower() == "bearer"
        and secrets.compare_digest(provided_token, expected_token_value)
    )

    if not authenticated:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing image processor token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
