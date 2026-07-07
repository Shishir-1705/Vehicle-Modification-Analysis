"""
Async notification service.

Supports:
- Telegram Bot alerts (via python-telegram-bot)
- SMTP Email alerts
- Configurable severity thresholds
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from loguru import logger

try:
    import telegram
    _telegram_available = True
except ImportError:
    _telegram_available = False

from ..config.env import settings


class NotifierService:
    """
    Centralized alerting service for violation detection events.
    Lazily initialized — only sends if credentials are configured.
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    # --- Telegram ---

    async def send_telegram(self, message: str) -> bool:
        """Send a Telegram alert to the configured chat ID."""
        if not _telegram_available:
            logger.warning("[Notifier] python-telegram-bot not installed. Skipping Telegram.")
            return False

        token = getattr(settings, "TELEGRAM_BOT_TOKEN", None)
        chat_id = getattr(settings, "TELEGRAM_CHAT_ID", None)

        if not token or not chat_id:
            logger.debug("[Notifier] Telegram not configured. Skipping.")
            return False

        try:
            bot = telegram.Bot(token=token)
            await bot.send_message(chat_id=chat_id, text=message, parse_mode="HTML")
            logger.success(f"[Notifier] Telegram alert sent.")
            return True
        except Exception as e:
            logger.error(f"[Notifier] Telegram failed: {e}")
            return False

    # --- Email ---

    def send_email(self, subject: str, body: str, to: Optional[str] = None) -> bool:
        """Send an SMTP email alert."""
        smtp_host = getattr(settings, "SMTP_HOST", None)
        smtp_port = getattr(settings, "SMTP_PORT", 587)
        smtp_user = getattr(settings, "SMTP_USER", None)
        smtp_pass = getattr(settings, "SMTP_PASS", None)
        recipient = to or getattr(settings, "ALERT_EMAIL", None)

        if not all([smtp_host, smtp_user, smtp_pass, recipient]):
            logger.debug("[Notifier] Email not configured. Skipping.")
            return False

        try:
            msg = MIMEMultipart()
            msg["From"] = smtp_user
            msg["To"] = recipient
            msg["Subject"] = subject
            msg.attach(MIMEText(body, "html"))

            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.sendmail(smtp_user, recipient, msg.as_string())

            logger.success(f"[Notifier] Email sent to {recipient}")
            return True
        except Exception as e:
            logger.error(f"[Notifier] Email failed: {e}")
            return False

    # --- High-level alert ---

    async def alert_violation(self, plate: str, violation: str, severity: str, confidence: float):
        """
        Compose and dispatch a violation alert across all channels.
        Only fires for high/critical severity violations.
        """
        if severity not in ("high", "critical"):
            return

        message = (
            f"🚨 <b>Violation Detected</b>\n\n"
            f"🔴 Severity: <b>{severity.upper()}</b>\n"
            f"🏍️ Plate: <code>{plate}</code>\n"
            f"⚠️ Violation: {violation}\n"
            f"📊 Confidence: {confidence*100:.1f}%"
        )

        await self.send_telegram(message)
        self.send_email(
            subject=f"🚨 {severity.upper()} Violation – {plate}",
            body=f"<pre>{message}</pre>"
        )


_notifier: Optional[NotifierService] = None

def get_notifier() -> NotifierService:
    global _notifier
    if _notifier is None:
        _notifier = NotifierService()
    return _notifier
