from pathlib import Path
from uuid import uuid4
import os, re

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl

APP_NAME = os.getenv("APP_NAME", "SocialPilot AI")
STORAGE_DIR = Path(os.getenv("STORAGE_DIR", "storage"))
MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_MB", "500"))
STORAGE_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title=APP_NAME, version="0.2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ImportLinkRequest(BaseModel):
    url: HttpUrl

class PublishPreviewRequest(BaseModel):
    filename: str
    title: str
    caption: str = ""
    platforms: list[str]

def detect_source(url: str) -> str:
    host = re.sub(r"^www\.", "", HttpUrl(url).host.lower())
    if host in {"youtube.com", "m.youtube.com", "youtu.be"}:
        return "youtube"
    if host == "instagram.com":
        return "instagram"
    if host in {"facebook.com", "m.facebook.com", "fb.watch"}:
        return "facebook"
    raise HTTPException(status_code=400, detail="Unsupported video-link domain.")

@app.get("/health")
def health():
    return {"status": "ok", "app": APP_NAME, "version": "0.2.0"}

@app.post("/videos/upload")
async def upload_video(file: UploadFile = File(...)):
    allowed = {".mp4", ".mov", ".m4v", ".webm"}
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in allowed:
        raise HTTPException(status_code=400, detail="Upload MP4, MOV, M4V, or WEBM video.")
    target_name = f"{uuid4().hex}{suffix}"
    target = STORAGE_DIR / target_name
    size, limit = 0, MAX_UPLOAD_MB * 1024 * 1024
    try:
        with target.open("wb") as out:
            while chunk := await file.read(1024 * 1024):
                size += len(chunk)
                if size > limit:
                    target.unlink(missing_ok=True)
                    raise HTTPException(status_code=413, detail=f"Maximum file size is {MAX_UPLOAD_MB} MB.")
                out.write(chunk)
    finally:
        await file.close()
    return {"status":"uploaded","asset_id":target_name,"original_filename":file.filename,"size_bytes":size}

@app.post("/videos/import-link")
def import_link(payload: ImportLinkRequest):
    source = detect_source(str(payload.url))
    return {
        "status":"link_recognized",
        "source":source,
        "url":str(payload.url),
        "import_mode":"authorization_required",
        "message":"Link recognized. Arbitrary platform-video downloading is not enabled. Upload your own original file or use an authorized export/media source."
    }

@app.post("/publish/preview")
def publish_preview(payload: PublishPreviewRequest):
    allowed = {"facebook","instagram","youtube"}
    selected = {p.lower() for p in payload.platforms}
    invalid = selected - allowed
    if invalid:
        raise HTTPException(status_code=400, detail=f"Unsupported platforms: {sorted(invalid)}")
    if not selected:
        raise HTTPException(status_code=400, detail="Select at least one platform.")
    return {
        "status":"preview_created","asset":payload.filename,"title":payload.title,
        "caption":payload.caption,"platforms":sorted(selected),
        "approval_required":True,"published":False
    }
