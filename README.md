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
  System Architecture

1. Architecture Overview
   SocialPilot AI follows a client-server-based architecture with a local AI integration. The frontend is developed using React and Vite, while the backend uses FastAPI to handle API requests, video uploads, AI caption generation, and publishing previews.

The system uses Ollama as its local AI runtime, allowing users to generate captions without depending on cloud-based AI services. 2. Main Architectural Components

1. Frontend Layer (React + Vite)

- Provides the user interface and dashboard.
- Allows users to upload video files.
- Collects video titles, descriptions, language, and tone preferences.
- Displays AI-generated captions and hashtags.
- Provides publishing previews for selected platforms.

2. Backend Layer (FastAPI)

- Handles frontend API requests.
- Manages video uploads and storage.
- Communicates with the local AI service.
- Processes caption generation requests.
- Prepares publishing previews.

3. AI Processing Layer (Ollama)

- Runs the local Qwen 2.5 1.5B language model.
- Generates social media captions.
- Produces relevant hashtags.
- Supports Bangla and English caption generation.
- Generates content based on user-provided information and preferences.

4. Storage Layer

- Stores uploaded video files locally.
- Uses a configurable storage directory.
- Keeps application files separate from uploaded media.

5. Social Media Integration Layer (Planned)

- Facebook Page authorization and publishing through Meta Graph API.
- Future integration with Instagram and YouTube.
- Publishing status and post ID management.

3. System Architecture Diagram (Text)
   USER
   |
   v
   REACT + VITE FRONTEND
   |
   | REST API Requests
   v
   FASTAPI BACKEND
   |
   +-------+--------+
   | | |
   v v v
   AI SERVICE VIDEO PUBLISHING
   (OLLAMA) STORAGE PREVIEW
   |
   v
   QWEN 2.5 1.5B
   |
   v
   AI-GENERATED CAPTION
   |
   v
   FRONTEND DISPLAY

FUTURE INTEGRATION
|
v
FACEBOOK PAGE
INSTAGRAM
YOUTUBE

4. Data Processing Workflow
1. The user uploads a video through the frontend dashboard.
1. The frontend sends the video and related information to the FastAPI backend.
1. The backend stores the uploaded video in the configured storage directory.
1. The user requests AI-generated captions.
1. The backend sends the caption generation request to Ollama.
1. The Qwen model processes the input and generates captions and hashtags.
1. The generated content is returned to the frontend.
1. The user reviews the content and generates a publishing preview.
1. Actual social media publishing will be handled through platform APIs in future development.
1. Architectural Approach
   The current MVP uses a modular client-server architecture. Its components are separated into frontend, backend, AI processing, and storage layers.

This separation makes the system easier to maintain, test, and extend. Additional social media integrations can be introduced without requiring a complete redesign of the existing application.

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
