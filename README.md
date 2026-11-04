# SocialPilot AI

**SocialPilot AI** is a local AI-assisted social media content
preparation dashboard. It helps users upload a video, generate Bangla
and English captions with a locally running Ollama model, and prepare a
publishing preview for selected social platforms.

> **Project status:** MVP v0.3.1. Video upload and local AI caption
> generation are implemented. The publishing screen currently creates a
> preview only; it does **not** publish videos to Facebook, Instagram,
> or YouTube yet. Facebook Page API integration is planned as the next
> development stage.

## Current Features

- React + Vite dashboard.
- FastAPI backend.
- Upload video files to local workspace storage.
- Local AI caption generation through Ollama.
- Bangla, English, or bilingual caption generation.
- Caption tone and platform-oriented suggestions.
- Hashtag generation.
- Publishing preview for selected destinations.
- AI service status endpoint to check Ollama availability.

## Technology Stack

Layer Technology

---

Frontend React, Vite, JavaScript
Backend Python, FastAPI, Uvicorn
Local AI runtime Ollama
Suggested lightweight model `qwen2.5:1.5b`

## Requirements

- Windows 10/11
- Python 3.10 or newer
- Node.js 20 or newer
- npm
- Ollama installed locally
- Internet connection for initial dependency and model downloads

A dedicated GPU is not required for the lightweight model, but
generation speed depends on available system memory and CPU performance.

## Installation and Setup

### 1. Clone the repository

```powershell
git clone https://github.com/Yusuf-Siyam/SocialPilot-AI.git
cd SocialPilot-AI
```

### 2. Set up Ollama

Install Ollama, then download the model:

```powershell
ollama pull qwen2.5:1.5b
```

Check that the model is available:

```powershell
ollama list
```

If you want Ollama models stored on the D drive, set the environment
variable before starting Ollama. Example:

```powershell
setx OLLAMA_MODELS "D:\AI-Models\Ollama"
```

After using `setx`, close and reopen the terminal (and restart Ollama)
so the new environment variable is loaded. Ensure the folder exists.

### 3. Set up the backend

Open PowerShell:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Configure the backend environment for the local Ollama model and upload
storage:

```powershell
$env:OLLAMA_URL = "http://127.0.0.1:11434"
$env:OLLAMA_MODEL = "qwen2.5:1.5b"
$env:STORAGE_DIR = "D:\AI-Uploads"
New-Item -ItemType Directory -Force -Path $env:STORAGE_DIR
```

Start the backend:

```powershell
uvicorn app.main:app --reload
```

Backend API: http://127.0.0.1:8000\
Interactive API documentation: http://127.0.0.1:8000/docs

### 4. Set up the frontend

Open a second PowerShell terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL shown by Vite (normally http://localhost:5173).

## Useful Backend Endpoints

---

Method Endpoint Purpose

---

`GET` `/` Basic API information

`GET` `/health` Backend health check

`GET` `/ai/status` Check local AI/Ollama
status

`POST` `/ai/generate-caption` Generate captions using
local AI

`POST` `/videos/upload` Upload a video to local
storage

`POST` `/videos/import-link` Handle a supported
video-link import
request

`POST` `/publish/preview` Generate a publishing
preview (not a live
post)

---

## Important Notes

- Generated captions should be reviewed and edited before use. Small
  local language models can sometimes produce irrelevant or inaccurate
  text.
- A publishing preview is not proof that a post was published.
- Facebook, Instagram, and YouTube publishing require
  platform-specific authorization, permissions, and API integration.
  These are not yet completed in this MVP.
- Do not put access tokens, app secrets, passwords, or private
  credentials in source code or commit them to Git.
- Keep `.env` files, virtual environments, `node_modules`, generated
  build files, and uploaded media out of version control.
- Only upload or reuse videos that you own or are authorized to use.

## Development Roadmap

1.  Complete and test Facebook Page authorization with Meta.
2.  Implement and verify real Facebook Page video publishing.
3.  Add publishing status and post-ID handling.
4.  Improve caption prompt quality and error handling.
5.  Add Instagram Professional account publishing.
6.  Add YouTube channel authorization and video publishing.
7.  Add publishing history, scheduling, and deployment improvements.

## Repository

GitHub: https://github.com/Yusuf-Siyam/SocialPilot-AI

---

**SocialPilot AI --- Local AI-assisted social media content
preparation.**
