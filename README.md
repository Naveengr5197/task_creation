# task_manager

## Password Reset Email Setup

The forgot-password flow sends reset tokens via email (SMTP). Tokens are no longer returned in API responses or shown in the UI.

1. Create `api/.env` using `api/.env.example`.
2. Set SMTP values:
	- `SMTP_HOST`
	- `SMTP_PORT`
	- `SMTP_SECURE`
	- `SMTP_USER`
	- `SMTP_PASS`
	- `SMTP_FROM`
3. Set `FRONTEND_BASE_URL` (for reset link generation).
4. Start the API server from the `api` folder.

Reset flow:
- User clicks **Send reset email**.
- User receives email with reset token and link.
- User opens the link (email/token can prefill on forgot-password page) and sets a new password.