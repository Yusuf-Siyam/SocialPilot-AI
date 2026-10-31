
from pathlib import Path
from uuid import uuid4
from typing import Literal
import json
import os
import re
import urllib.error
import urllib.request
import socket

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, HttpUrl


# =========================================================
# CONFIGURATION
# =========================================================

APP_NAME = os.getenv("APP_NAME", "SocialPilot AI")

STORAGE_DIR = Path(os.getenv("STORAGE_DIR", "storage"))

MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_MB", "500"))

OLLAMA_URL = os.getenv(
    "OLLAMA_URL",
    "http://127.0.0.1:11434"
)

OLLAMA_MODEL = os.getenv(
    "OLLAMA_MODEL",
    "qwen2.5:3b"
)

ALLOWED_PLATFORMS = {
    "facebook",
    "instagram",
    "youtube"
}

ALLOWED_VIDEO_EXTENSIONS = {
    ".mp4",
    ".mov",
    ".m4v",
    ".webm"
}

STORAGE_DIR.mkdir(parents=True, exist_ok=True)


# =========================================================
# FASTAPI APPLICATION
# =========================================================

app = FastAPI(
    title=APP_NAME,
    description="AI-powered social media video management platform",
    version="0.3.1"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# REQUEST MODELS
# =========================================================

class ImportLinkRequest(BaseModel):
    url: HttpUrl


class PublishPreviewRequest(BaseModel):
    filename: str = Field(min_length=1, max_length=255)
    title: str = Field(min_length=1, max_length=200)
    caption: str = Field(default="", max_length=5000)
    platforms: list[str] = Field(min_length=1)


class CaptionRequest(BaseModel):
    topic: str = Field(min_length=3, max_length=2000)

    title: str = Field(
        default="",
        max_length=200
    )

    platforms: list[str] = Field(
        min_length=1
    )

    language: Literal[
        "both",
        "bangla",
        "english"
    ] = "both"

    tone: Literal[
        "engaging",
        "professional",
        "educational",
        "funny",
        "informative",
        "promotional"
    ] = "engaging"


# =========================================================
# HELPER FUNCTIONS
# =========================================================

def normalize_platforms(platforms: list[str]) -> list[str]:
    """
    Validate and normalize selected social media platforms.
    """

    normalized = sorted({
        platform.strip().lower()
        for platform in platforms
    })

    invalid = set(normalized) - ALLOWED_PLATFORMS

    if invalid:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported platforms: {sorted(invalid)}"
        )

    if not normalized:
        raise HTTPException(
            status_code=400,
            detail="Select at least one platform."
        )

    return normalized


def detect_source(url: str) -> str:
    """
    Detect supported social media URL domains.
    This function does not download videos.
    """

    host = HttpUrl(url).host.lower()

    host = re.sub(r"^www\.", "", host)

    if host in {
        "youtube.com",
        "m.youtube.com",
        "youtu.be"
    }:
        return "youtube"

    if host in {
        "instagram.com",
        "m.instagram.com"
    }:
        return "instagram"

    if host in {
        "facebook.com",
        "m.facebook.com",
        "fb.watch"
    }:
        return "facebook"

    raise HTTPException(
        status_code=400,
        detail="Unsupported video-link domain."
    )


def ollama_request(
    path: str,
    payload: dict | None = None,
    timeout: int = 12
):
    """
    Send requests to the local Ollama server.
    """

    data = None

    if payload is not None:
        data = json.dumps(payload).encode("utf-8")

    request = urllib.request.Request(
        f"{OLLAMA_URL.rstrip('/')}{path}",
        data=data,
        headers={
            "Content-Type": "application/json"
        } if data is not None else {},
        method="POST" if data is not None else "GET"
    )

    try:
        with urllib.request.urlopen(
            request,
            timeout=timeout
        ) as response:

            return json.loads(
                response.read().decode("utf-8")
            )

    except urllib.error.HTTPError as exc:

        detail = exc.read().decode(
            "utf-8",
            errors="replace"
        )

        raise RuntimeError(
            f"Ollama returned HTTP {exc.code}: {detail[:500]}"
        ) from exc

    except urllib.error.URLError as exc:

        raise RuntimeError(
            "Ollama is not reachable. "
            "Start Ollama and check 127.0.0.1:11434."
        ) from exc

    except (TimeoutError, socket.timeout) as exc:

        raise RuntimeError(
            "Ollama request timed out. Try again."
        ) from exc

    except json.JSONDecodeError as exc:

        raise RuntimeError(
            "Ollama returned an invalid JSON response."
        ) from exc


def normalize_model_name(name: str) -> str:
    """
    Normalize Ollama model names.
    """

    name = name.strip().lower()

    if name.endswith(":latest"):
        name = name[:-7]

    return name


def validate_generated_response(data: dict) -> dict:
    """
    Validate the AI-generated response before returning it.
    """

    if not isinstance(data, dict):
        raise RuntimeError(
            "The AI model returned an invalid response."
        )

    suggested_title = data.get("suggested_title", "")

    bangla_caption = data.get("bangla_caption", "")

    english_caption = data.get("english_caption", "")

    hashtags = data.get("hashtags", [])

    platform_notes = data.get("platform_notes", {})

    if not isinstance(suggested_title, str):
        suggested_title = ""

    if not isinstance(bangla_caption, str):
        bangla_caption = ""

    if not isinstance(english_caption, str):
        english_caption = ""

    if not isinstance(hashtags, list):
        hashtags = []

    if not isinstance(platform_notes, dict):
        platform_notes = {}

    hashtags = [
        tag for tag in hashtags
        if isinstance(tag, str)
    ][:15]

    clean_notes = {}

    for platform in ALLOWED_PLATFORMS:

        note = platform_notes.get(platform, "")

        clean_notes[platform] = (
            note if isinstance(note, str) else ""
        )

    return {
        "suggested_title": suggested_title,
        "bangla_caption": bangla_caption,
        "english_caption": english_caption,
        "hashtags": hashtags,
        "platform_notes": clean_notes
    }


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/")
def root():

    return {
        "app": APP_NAME,
        "status": "running",
        "version": "0.3.1",
        "message": "Welcome to SocialPilot AI API"
    }


@app.get("/health")
def health():

    return {
        "status": "ok",
        "app": APP_NAME,
        "version": "0.3.1"
    }


# =========================================================
# OLLAMA AI STATUS
# =========================================================

@app.get("/ai/status")
def ai_status():

    try:

        data = ollama_request(
            "/api/tags",
            timeout=5
        )

        models = [
            item.get("name", "")
            for item in data.get("models", [])
            if isinstance(item, dict)
        ]

        installed = any(
            normalize_model_name(name)
            == normalize_model_name(OLLAMA_MODEL)
            for name in models
        )

        return {
            "available": True,
            "installed": installed,
            "model": OLLAMA_MODEL,
            "models": models,
            "message": (
                "Local AI is ready."
                if installed
                else f"{OLLAMA_MODEL} is not installed."
            )
        }

    except Exception as exc:

        return {
            "available": False,
            "installed": False,
            "model": OLLAMA_MODEL,
            "models": [],
            "message": str(exc)
        }


# =========================================================
# AI CAPTION GENERATION
# =========================================================

@app.post("/ai/generate-caption")
def generate_caption(payload: CaptionRequest):

    platforms = normalize_platforms(
        payload.platforms
    )

    language_instruction = {

        "both": (
            "Write both a natural Bangla caption "
            "and a natural English caption."
        ),

        "bangla": (
            "Write only a natural Bangla caption. "
            "Return an empty English caption."
        ),

        "english": (
            "Write only a natural English caption. "
            "Return an empty Bangla caption."
        )

    }[payload.language]

    selected_platform_instructions = []

    for platform in platforms:

        if platform == "facebook":
            selected_platform_instructions.append(
                "Facebook: Create an engaging caption "
                "suitable for Facebook posts."
            )

        elif platform == "instagram":
            selected_platform_instructions.append(
                "Instagram: Create a concise caption "
                "with relevant hashtags."
            )

        elif platform == "youtube":
            selected_platform_instructions.append(
                "YouTube: Create a suitable video title "
                "and description-style caption."
            )

    prompt = f"""
You are a professional social media content writer
working for SocialPilot AI.

Your task is to create accurate and engaging
social media content.

IMPORTANT RULES:

1. Use ONLY the information provided by the user.
2. Never claim that you watched the actual video.
3. Never invent people, places, events or results.
4. Avoid misleading clickbait.
5. Keep the content natural and readable.
6. Generate relevant hashtags.
7. Follow the requested language.

VIDEO INFORMATION:

Topic / Description:
{payload.topic}

Existing Title:
{payload.title}

Selected Platforms:
{", ".join(platforms)}

Tone:
{payload.tone}

Language:
{language_instruction}

PLATFORM REQUIREMENTS:

{" ".join(selected_platform_instructions)}

Return ONLY valid JSON using exactly these keys:

{{
    "suggested_title": "Suitable short title",
    "bangla_caption": "Bangla caption or empty string",
    "english_caption": "English caption or empty string",
    "hashtags": [
        "#RelevantTag1",
        "#RelevantTag2",
        "#RelevantTag3",
        "#RelevantTag4",
        "#RelevantTag5"
    ],
    "platform_notes": {{
        "facebook": "Facebook suggestion or empty string",
        "instagram": "Instagram suggestion or empty string",
        "youtube": "YouTube suggestion or empty string"
    }}
}}
"""

    try:

        result = ollama_request(
            "/api/generate",
            {
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "format": "json",
                "options": {
                    "temperature": 0.7
                }
            },
            timeout=180
        )

        raw = result.get("response", "")

        if not isinstance(raw, str) or not raw.strip():
            raise RuntimeError(
                "The AI model returned an empty response."
            )

        try:

            generated = json.loads(raw)

        except json.JSONDecodeError as exc:

            raise RuntimeError(
                "The AI model returned invalid JSON. "
                "Please try again."
            ) from exc

        generated = validate_generated_response(
            generated
        )

        if not generated["suggested_title"]:
            generated["suggested_title"] = payload.title

        return {
            "status": "generated",
            "model": OLLAMA_MODEL,
            "platforms": platforms,
            **generated
        }

    except Exception as exc:

        raise HTTPException(
            status_code=503,
            detail=str(exc)
        ) from exc


# =========================================================
# VIDEO UPLOAD
# =========================================================

@app.post("/videos/upload")
async def upload_video(
    file: UploadFile = File(...)
):

    suffix = Path(
        file.filename or ""
    ).suffix.lower()

    if suffix not in ALLOWED_VIDEO_EXTENSIONS:

        await file.close()

        raise HTTPException(
            status_code=400,
            detail=(
                "Upload MP4, MOV, M4V, or WEBM video."
            )
        )

    target_name = f"{uuid4().hex}{suffix}"

    target = STORAGE_DIR / target_name

    size = 0

    limit = MAX_UPLOAD_MB * 1024 * 1024

    try:

        with target.open("wb") as out:

            while True:

                chunk = await file.read(
                    1024 * 1024
                )

                if not chunk:
                    break

                size += len(chunk)

                if size > limit:

                    raise HTTPException(
                        status_code=413,
                        detail=(
                            f"Maximum file size is "
                            f"{MAX_UPLOAD_MB} MB."
                        )
                    )

                out.write(chunk)

        return {
            "status": "uploaded",
            "asset_id": target_name,
            "original_filename": file.filename,
            "size_bytes": size
        }

    except Exception:

        target.unlink(missing_ok=True)

        raise

    finally:

        await file.close()


# =========================================================
# SOCIAL MEDIA LINK RECOGNITION
# =========================================================

@app.post("/videos/import-link")
def import_link(
    payload: ImportLinkRequest
):

    source = detect_source(
        str(payload.url)
    )

    return {
        "status": "link_recognized",
        "source": source,
        "url": str(payload.url),
        "import_mode": "authorization_required",
        "message": (
            "Link recognized. Arbitrary platform-video "
            "downloading is not enabled. Upload your own "
            "original file or use an authorized "
            "export/media source."
        )
    }


# =========================================================
# PUBLISHING PREVIEW
# =========================================================

@app.post("/publish/preview")
def publish_preview(
    payload: PublishPreviewRequest
):

    platforms = normalize_platforms(
        payload.platforms
    )

    return {
        "status": "preview_created",
        "asset": payload.filename,
        "title": payload.title,
        "caption": payload.caption,
        "platforms": platforms,
        "approval_required": True,
        "published": False,
        "message": (
            "Publishing preview created. "
            "No content has been published."
        )
    }


# =========================================================
# APPLICATION STARTUP
# =========================================================

@app.on_event("startup")
async def startup_event():

    print("=" * 50)
    print(f"{APP_NAME} Backend Started")
    print("Version: 0.3.1")
    print(f"Ollama URL: {OLLAMA_URL}")
    print(f"Ollama Model: {OLLAMA_MODEL}")
    print(f"Storage Directory: {STORAGE_DIR.resolve()}")
    print("=" * 50)
