import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  UploadCloud,
  Link2,
  Video,
  LayoutDashboard,
  Clock3,
  Settings,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Send,
  LoaderCircle,
} from "lucide-react";
import "./style.css";

const API = "http://127.0.0.1:8000";

// Social Media Brand Icons
function BrandIcon({ platform }) {
  const icons = {
    facebook: <span className="brand-mark fb">f</span>,
    instagram: <span className="brand-mark ig">◎</span>,
    youtube: <span className="brand-mark yt">▶</span>,
  };

  return icons[platform] || null;
}

function App() {
  const [mode, setMode] = useState("file");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [platforms, setPlatforms] = useState(["facebook"]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [asset, setAsset] = useState("");
  const [source, setSource] = useState("");
  const [preview, setPreview] = useState(null);

  const toggle = (platform) => {
    setPlatforms((old) =>
      old.includes(platform)
        ? old.filter((p) => p !== platform)
        : [...old, platform],
    );
  };

  // Validate social media link
  async function importLink() {
    if (!url.trim()) {
      setMessage("Please enter a video URL.");
      return;
    }

    setBusy(true);
    setMessage("Checking link...");
    setPreview(null);

    try {
      const response = await fetch(`${API}/videos/import-link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not validate link");
      }

      setSource(data.source);
      setAsset("");

      setMessage(
        `${data.source.toUpperCase()} link recognized. ${data.message}`,
      );
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setBusy(false);
    }
  }

  // Upload video
  async function uploadFile() {
    if (!file) {
      setMessage("Choose a video file first.");
      return;
    }

    setBusy(true);
    setMessage("Uploading video to local backend...");
    setPreview(null);

    try {
      const body = new FormData();
      body.append("file", file);

      const response = await fetch(`${API}/videos/upload`, {
        method: "POST",
        body,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Upload failed");
      }

      setAsset(data.asset_id);
      setUrl("");
      setSource("");

      setTitle(title || file.name.replace(/\.[^.]+$/, ""));

      setMessage(`Video stored locally: ${data.original_filename}`);
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setBusy(false);
    }
  }

  // Generate publishing preview
  async function makePreview() {
    const filename =
      asset || (source && url ? `${source}-link-pending-import` : "");

    if (!filename) {
      setMessage("Upload a video file or validate a video link first.");
      return;
    }

    if (!platforms.length) {
      setMessage("Select at least one platform.");
      return;
    }

    setBusy(true);

    try {
      const response = await fetch(`${API}/publish/preview`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filename,
          title,
          caption,
          platforms,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Preview failed");
      }

      setPreview(data);

      setMessage("Publishing preview created. Nothing has been published yet.");
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <Sparkles size={21} />
          </div>

          <div>
            <b>SocialPilot AI</b>
            <small>Creator workspace</small>
          </div>
        </div>

        <nav>
          <a className="active">
            <LayoutDashboard size={18} />
            Overview
          </a>

          <a>
            <Video size={18} />
            Video Library
          </a>

          <a>
            <Clock3 size={18} />
            Publishing Queue
          </a>

          <a>
            <Settings size={18} />
            Settings
          </a>
        </nav>

        <div className="side-note">
          <span className="dot" />
          Local development mode
          <small>API: 127.0.0.1:8000</small>
        </div>
      </aside>

      {/* Main Dashboard */}
      <main className="main">
        <header>
          <div>
            <p className="eyebrow">WORKSPACE / OVERVIEW</p>
            <h1>Good to see you 👋</h1>
            <p className="sub">
              Prepare one video for all your social channels.
            </p>
          </div>

          <div className="avatar">SP</div>
        </header>

        {/* Statistics */}
        <section className="stats">
          <div className="stat">
            <span>Connected platforms</span>
            <strong>
              1 <small>/ 3</small>
            </strong>
            <em>Facebook Page ready for setup</em>
          </div>

          <div className="stat">
            <span>Videos uploaded</span>
            <strong>0</strong>
            <em>Local development</em>
          </div>

          <div className="stat">
            <span>Published posts</span>
            <strong>0</strong>
            <em>No live publishing yet</em>
          </div>
        </section>

        <section className="workspace">
          {/* Video Composer */}
          <div className="panel composer">
            <div className="panel-head">
              <div>
                <p className="eyebrow">NEW CONTENT</p>
                <h2>Create a post</h2>
              </div>

              <span className="step">STEP 1 OF 3</span>
            </div>

            {/* Input Tabs */}
            <div className="tabs">
              <button
                className={mode === "file" ? "selected" : ""}
                onClick={() => {
                  setMode("file");
                  setMessage("");
                }}
              >
                <UploadCloud size={17} />
                Upload video
              </button>

              <button
                className={mode === "link" ? "selected" : ""}
                onClick={() => {
                  setMode("link");
                  setMessage("");
                }}
              >
                <Link2 size={17} />
                Paste link
              </button>
            </div>

            {/* Video Upload */}
            {mode === "file" ? (
              <div className="dropzone">
                <input
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm"
                  onChange={(e) => {
                    setFile(e.target.files?.[0] || null);
                    setAsset("");
                    setUrl("");
                    setSource("");
                  }}
                />

                <div className="upload-icon">
                  <UploadCloud size={25} />
                </div>

                <b>{file ? file.name : "Choose a video to upload"}</b>

                <p>MP4, MOV, M4V or WEBM · Max 500 MB</p>

                <button
                  className="primary light"
                  disabled={!file || busy}
                  onClick={uploadFile}
                >
                  {busy ? (
                    <LoaderCircle className="spin" size={16} />
                  ) : (
                    <UploadCloud size={16} />
                  )}
                  Upload to workspace
                </button>
              </div>
            ) : (
              /* Video Link Input */
              <div className="linkbox">
                <label>Video URL</label>

                <div className="url-input">
                  <Link2 size={17} />

                  <input
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      setAsset("");
                      setSource("");
                    }}
                    placeholder="Paste YouTube, Instagram or Facebook URL"
                  />
                </div>

                <button
                  className="primary light"
                  disabled={!url.trim() || busy}
                  onClick={importLink}
                >
                  {busy ? (
                    <LoaderCircle className="spin" size={16} />
                  ) : (
                    <Link2 size={16} />
                  )}
                  Validate link
                </button>

                <p className="hint">
                  We validate the source first. Direct media import depends on
                  platform permissions and your rights to reuse the video.
                </p>
              </div>
            )}

            {/* Platform Selection */}
            <div className="section-title">
              <h3>Publishing platforms</h3>
              <span>Choose destinations</span>
            </div>

            <div className="platforms">
              <button
                className={`platform ${
                  platforms.includes("facebook") ? "chosen" : ""
                }`}
                onClick={() => toggle("facebook")}
              >
                <BrandIcon platform="facebook" />

                <span>
                  <b>Facebook Page</b>
                  <small>Page connection pending</small>
                </span>

                <i>{platforms.includes("facebook") ? "✓" : ""}</i>
              </button>

              <button
                className={`platform ${
                  platforms.includes("instagram") ? "chosen" : ""
                }`}
                onClick={() => toggle("instagram")}
              >
                <BrandIcon platform="instagram" />

                <span>
                  <b>Instagram</b>
                  <small>Switch Personal to Professional</small>
                </span>

                <i>{platforms.includes("instagram") ? "✓" : ""}</i>
              </button>

              <button
                className={`platform ${
                  platforms.includes("youtube") ? "chosen" : ""
                }`}
                onClick={() => toggle("youtube")}
              >
                <BrandIcon platform="youtube" />

                <span>
                  <b>YouTube</b>
                  <small>Create a channel first</small>
                </span>

                <i>{platforms.includes("youtube") ? "✓" : ""}</i>
              </button>
            </div>

            {/* Post Details */}
            <div className="section-title">
              <h3>Post details</h3>
              <span>AI assistance coming next</span>
            </div>

            <label>Video title</label>

            <input
              className="field"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title"
            />

            <label>Caption / description</label>

            <textarea
              className="field textarea"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption (AI generator will be added in the next phase)..."
            />

            <button
              className="primary full"
              onClick={makePreview}
              disabled={busy}
            >
              <Send size={16} />
              Generate publishing preview
            </button>

            {/* Status Message */}
            {message && (
              <div className="message">
                <AlertCircle size={17} />
                <span>{message}</span>
              </div>
            )}

            {/* Preview */}
            {preview && (
              <div className="preview">
                <div className="success">
                  <CheckCircle2 size={18} />
                  Preview ready — approval required
                </div>

                <b>{preview.title || "Untitled video"}</b>

                <p>{preview.caption || "No caption provided."}</p>

                <small>
                  Selected: {preview.platforms.join(", ")}
                  {" · "}
                  Published: No
                </small>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="rightcol">
            <div className="panel checklist">
              <p className="eyebrow">ACCOUNT SETUP</p>
              <h2>Connect your channels</h2>

              <div className="account">
                <BrandIcon platform="facebook" />

                <div>
                  <b>Facebook Page</b>
                  <small>Page exists · API authorization needed</small>
                </div>

                <span className="pill warn">Pending</span>
              </div>

              <div className="account">
                <BrandIcon platform="instagram" />

                <div>
                  <b>Instagram</b>
                  <small>Personal account · switch to Professional</small>
                </div>

                <span className="pill warn">Action</span>
              </div>

              <div className="account">
                <BrandIcon platform="youtube" />

                <div>
                  <b>YouTube</b>
                  <small>Channel not created yet</small>
                </div>

                <span className="pill muted">Setup</span>
              </div>
            </div>

            {/* AI Assistant */}
            <div className="panel tips">
              <div className="tip-icon">
                <Sparkles size={19} />
              </div>

              <h3>Next up: AI assistant</h3>

              <p>
                We’ll add automatic captions, hashtags, title suggestions and
                platform-specific formatting after the upload flow is tested.
              </p>

              <ul>
                <li>Caption generation</li>
                <li>Hashtag suggestions</li>
                <li>Approval before publishing</li>
              </ul>
            </div>

            <div className="security">
              <CheckCircle2 size={17} />

              <span>
                Your API tokens will stay on the backend. Never paste passwords
                or access tokens into this dashboard.
              </span>
            </div>
          </div>
        </section>

        <footer>SocialPilot AI · MVP v0.2 · Local development build</footer>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
