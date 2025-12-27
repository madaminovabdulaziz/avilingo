"""
Email Service

Handles email sending using Resend for verification codes and notifications.
"""

import secrets
import logging
from typing import Optional

import resend

from app.core.config import settings

logger = logging.getLogger(__name__)


def generate_verification_code() -> str:
    """
    Generate a cryptographically secure 6-digit verification code.
    
    Uses secrets.choice for security instead of random.
    
    Returns:
        6-digit numeric string (e.g., "847293")
    """
    return ''.join(secrets.choice('0123456789') for _ in range(6))


def get_verification_email_html(code: str) -> str:
    """
    Generate HTML email template for verification code.
    
    Args:
        code: 6-digit verification code
        
    Returns:
        HTML string for email body
    """
    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #0F172A;
      color: #F8FAFC;
      padding: 40px 20px;
      margin: 0;
      line-height: 1.6;
    }}
    .container {{
      max-width: 480px;
      margin: 0 auto;
      background: #1E293B;
      border-radius: 16px;
      padding: 40px;
    }}
    .logo {{
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 32px;
      color: #F8FAFC;
    }}
    .logo span {{
      margin-right: 8px;
    }}
    h2 {{
      color: #F8FAFC;
      font-size: 24px;
      margin: 0 0 16px 0;
      font-weight: 600;
    }}
    p {{
      color: #94A3B8;
      margin: 0 0 16px 0;
      font-size: 16px;
    }}
    .code {{
      font-size: 40px;
      font-weight: bold;
      letter-spacing: 12px;
      color: #38BDF8;
      background: #0F172A;
      padding: 24px 32px;
      border-radius: 12px;
      text-align: center;
      margin: 32px 0;
      font-family: 'SF Mono', Monaco, 'Courier New', monospace;
    }}
    .expiry {{
      color: #F59E0B;
      font-size: 14px;
      text-align: center;
      margin-bottom: 32px;
    }}
    .footer {{
      color: #64748B;
      font-size: 13px;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #334155;
    }}
    .footer p {{
      font-size: 13px;
      color: #64748B;
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="logo"><span>✈️</span>AviLingo</div>
    <h2>Verify your email</h2>
    <p>Welcome to AviLingo! Enter this code to complete your registration and start your aviation English journey:</p>
    <div class="code">{code}</div>
    <p class="expiry">⏱️ This code expires in 10 minutes</p>
    <div class="footer">
      <p>If you didn't create an AviLingo account, you can safely ignore this email.</p>
      <p>Need help? Contact us at support@avilingo.com</p>
    </div>
  </div>
</body>
</html>"""


def get_verification_email_text(code: str) -> str:
    """
    Generate plain text email for verification code.
    
    Args:
        code: 6-digit verification code
        
    Returns:
        Plain text string for email body
    """
    return f"""AviLingo - Verify Your Email

Welcome to AviLingo!

Enter this code to complete your registration:

{code}

This code expires in 10 minutes.

If you didn't create an AviLingo account, you can safely ignore this email.

Need help? Contact us at support@avilingo.com
"""


async def send_verification_email(
    to_email: str,
    code: str
) -> bool:
    """
    Send verification email with 6-digit code using Resend.
    
    Args:
        to_email: Recipient email address
        code: 6-digit verification code
        
    Returns:
        True if email sent successfully, False otherwise
    """
    if not settings.RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not configured, skipping email send")
        # In development, log the code for testing
        if settings.ENVIRONMENT == "development":
            logger.info(f"[DEV] Verification code for {to_email}: {code}")
        return True
    
    try:
        resend.api_key = settings.RESEND_API_KEY
        
        params = {
            "from": settings.EMAIL_FROM,
            "to": [to_email],
            "subject": "Verify your AviLingo account",
            "html": get_verification_email_html(code),
            "text": get_verification_email_text(code),
        }
        
        response = resend.Emails.send(params)
        
        logger.info(f"Verification email sent to {to_email[:3]}***, id: {response.get('id', 'unknown')}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send verification email to {to_email[:3]}***: {str(e)}")
        return False


async def send_welcome_email(
    to_email: str,
    display_name: str
) -> bool:
    """
    Send welcome email after successful verification.
    
    Args:
        to_email: Recipient email address
        display_name: User's display name
        
    Returns:
        True if email sent successfully, False otherwise
    """
    if not settings.RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not configured, skipping welcome email")
        return True
    
    html = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #0F172A;
      color: #F8FAFC;
      padding: 40px 20px;
      margin: 0;
      line-height: 1.6;
    }}
    .container {{
      max-width: 480px;
      margin: 0 auto;
      background: #1E293B;
      border-radius: 16px;
      padding: 40px;
    }}
    .logo {{
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 32px;
      color: #F8FAFC;
    }}
    h2 {{
      color: #F8FAFC;
      font-size: 24px;
      margin: 0 0 16px 0;
    }}
    p {{
      color: #94A3B8;
      margin: 0 0 16px 0;
      font-size: 16px;
    }}
    .cta {{
      display: inline-block;
      background: #38BDF8;
      color: #0F172A;
      padding: 14px 28px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      margin: 24px 0;
    }}
    .footer {{
      color: #64748B;
      font-size: 13px;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #334155;
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">✈️ AviLingo</div>
    <h2>Welcome aboard, {display_name}! 🎉</h2>
    <p>Your email has been verified and your account is ready. You're now part of the AviLingo community of pilots improving their aviation English.</p>
    <p>Here's what you can do next:</p>
    <ul style="color: #94A3B8;">
      <li>Take a placement test to assess your current level</li>
      <li>Set your target ICAO level and test date</li>
      <li>Start daily practice with vocabulary, listening, and speaking exercises</li>
    </ul>
    <p>Clear skies ahead! ☁️</p>
    <div class="footer">
      <p>Need help? Contact us at support@avilingo.com</p>
    </div>
  </div>
</body>
</html>"""
    
    try:
        resend.api_key = settings.RESEND_API_KEY
        
        params = {
            "from": settings.EMAIL_FROM,
            "to": [to_email],
            "subject": f"Welcome to AviLingo, {display_name}! ✈️",
            "html": html,
        }
        
        response = resend.Emails.send(params)
        logger.info(f"Welcome email sent to {to_email[:3]}***, id: {response.get('id', 'unknown')}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send welcome email: {str(e)}")
        return False

