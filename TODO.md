# EcropGuardAI Integration TODO

## Completed: Fix Vite HTML parse error in index.html

- [x] Remove malformed content after `</html>`, add proper `<link rel="icon">` in `<head>`
- [x] Edit index.html with fix
- [x] Verify fix — no parse errors

## Completed: AnalyticsScreen Fix

- [x] Edit src/screens/AnalyticsScreen.tsx — all changes implemented
- [x] Linting passed, code TypeScript-valid, ready for runtime test
- [x] AnalyticsScreen.tsx now uses real scan data from Supabase/localStorage via useScans/useAuth. Added computed metrics, empty state, typed interfaces.

## Integration Final

- [ ] Verify backend `/chat` endpoint returns `{ responses: [{model, text}], best: {model, text} }`
- [ ] Verify `/detect-disease` accepts image upload
- [ ] Ensure CORS middleware is present
- [ ] Confirm `.env.example` has all required keys
- [ ] Frontend API URL uses env var, not hardcoded localhost
