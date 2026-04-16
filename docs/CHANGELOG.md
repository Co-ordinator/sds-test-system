# SDS Test System Changelog

## 2026-04-16

### Registration and Email Verification
- Fixed registration failures caused by encrypted `nationalId` being validated as plaintext in the user model.
- Added explicit duplicate email checks during registration and mapped ORM uniqueness/validation errors to user-friendly API responses.
- Improved frontend registration error handling to show normalized backend messages and field-level validation feedback instead of generic failure text.
- Updated verification-link base URL resolution to avoid `localhost` links in production when forwarded host/protocol is available.

### Auth/API Reliability
- Improved backend CORS origin handling to support configured allowlists and local development defaults.
- Improved frontend API base URL fallback logic so production builds do not silently fall back to `http://localhost:5000`.
- Updated auth-related screens (register, forgot password, reset password, verify email, resend verification) to use normalized API errors consistently.

### UI Text and Encoding Cleanup
- Fixed corrupted mojibake icon/text bytes in the results UI (for example `ðŸ“ˆ`, `ðŸ“Š`, `ðŸ”§`, `ðŸ”¬`).
- Restored proper result icons (`📈`, `📊`, `🔧`, `🔬`, `🎨`, `🤝`) and cleaned corrupted separators/bullets/labels.
- Cleaned corrupted helper text characters in occupation search input messaging.
