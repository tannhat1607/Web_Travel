from __future__ import annotations

import threading
import time
from collections import defaultdict, deque
from dataclasses import dataclass

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware


@dataclass(frozen=True)
class RateLimitRule:
    method: str
    path: str
    requests: int
    window_seconds: int


RULES = (
    RateLimitRule("POST", "/api/auth/login", 5, 60),
    RateLimitRule("POST", "/api/auth/register", 3, 3600),
    RateLimitRule("POST", "/api/auth/forgot-password", 3, 900),
    RateLimitRule("POST", "/api/auth/reset-password", 5, 900),
    RateLimitRule("POST", "/api/chat", 20, 60),
    RateLimitRule("POST", "/api/contacts", 5, 3600),
)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple per-process limiter for public endpoints.

    For a multi-instance deployment, replace this storage with Redis while
    keeping the same rules and response contract.
    """

    def __init__(self, app):
        super().__init__(app)
        self._requests: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    async def dispatch(self, request: Request, call_next):
        rule = _matching_rule(request.method, request.url.path)
        if rule is None:
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        key = f"{client_ip}:{rule.method}:{rule.path}"
        now = time.monotonic()
        cutoff = now - rule.window_seconds

        with self._lock:
            attempts = self._requests[key]
            while attempts and attempts[0] <= cutoff:
                attempts.popleft()
            if len(attempts) >= rule.requests:
                retry_after = max(1, int(rule.window_seconds - (now - attempts[0])) + 1)
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Bạn thao tác quá nhanh. Vui lòng thử lại sau."},
                    headers={"Retry-After": str(retry_after)},
                )
            attempts.append(now)

        return await call_next(request)


def _matching_rule(method: str, path: str) -> RateLimitRule | None:
    normalized_method = method.upper()
    return next(
        (rule for rule in RULES if rule.method == normalized_method and rule.path == path),
        None,
    )
