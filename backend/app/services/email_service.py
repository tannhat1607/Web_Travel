from __future__ import annotations

import logging
import smtplib
from email.message import EmailMessage

from app.core.config import settings


logger = logging.getLogger(__name__)


def password_reset_email_is_configured() -> bool:
    return bool(settings.SMTP_HOST and settings.SMTP_FROM_EMAIL)


def send_password_reset_email(recipient: str, reset_url: str) -> None:
    """Send a reset link without ever logging its secret token."""
    if not password_reset_email_is_configured():
        return

    message = EmailMessage()
    message["Subject"] = "Đặt lại mật khẩu Travelora"
    message["From"] = settings.SMTP_FROM_EMAIL
    message["To"] = recipient
    message.set_content(
        "Bạn vừa yêu cầu đặt lại mật khẩu Travelora.\n\n"
        f"Mở liên kết sau trong vòng 15 phút:\n{reset_url}\n\n"
        "Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email."
    )

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
            if settings.SMTP_USE_TLS:
                server.starttls()
            if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.send_message(message)
    except Exception:
        logger.exception("Could not send password reset email")
