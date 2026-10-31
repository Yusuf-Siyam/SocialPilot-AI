# SocialPilot AI v0.2 — Dashboard + Backend

## Requirements
- Python 3.10+
- Node.js 20+ (LTS recommended)
- VS Code

## Run backend (Terminal 1, Windows PowerShell)
```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```
Backend docs: http://127.0.0.1:8000/docs

## Run frontend (Terminal 2)
```powershell
cd frontend
npm install
npm run dev
```
Open the local URL Vite prints (normally http://localhost:5173).

## What works in this MVP
- React dashboard UI
- Upload video file to local FastAPI backend
- Detect YouTube, Instagram, and Facebook URL domains
- Create a publishing preview with selected destinations
- Account readiness reminders

## What does not work yet
- It does not publish to social platforms.
- It does not download arbitrary third-party videos.
- AI captions are not connected yet.
- OAuth is not connected yet.

## Safe link import
A recognized link is not the same as an accessible downloadable video. Use official export/API routes and only import videos you own or are licensed to reuse. If a platform does not provide permitted media access, download/export your own original video through the platform's supported tools or upload the original file.

## Next
1. Test upload + preview locally.
2. Add SQLite job/history storage.
3. Implement YouTube channel creation instructions and OAuth.
4. Implement Meta OAuth, Facebook Page, Instagram Professional publishing.
