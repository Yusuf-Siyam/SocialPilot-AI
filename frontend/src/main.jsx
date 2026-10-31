import React, { useEffect, useState } from "react";
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
  WandSparkles,
  RefreshCw,
} from "lucide-react";

import "./style.css";

const API = "http://127.0.0.1:8000";

const PLATFORMS = [
  {
    id: "facebook",
    name: "Facebook Page",
    description: "Page connection pending",
    icon: "f",
    className: "fb",
  },
  {
    id: "instagram",
    name: "Instagram",
    description: "Professional account required",
    icon: "◎",
    className: "ig",
  },
  {
    id: "youtube",
    name: "YouTube",
    description: "Create a channel first",
    icon: "▶",
    className: "yt",
  },
];

const VIDEO_EXTENSIONS = [".mp4", ".mov", ".m4v", ".webm"];

// ======================================================
// HELPER FUNCTIONS
// ======================================================

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API}${endpoint}`, options);

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error("Invalid response received from backend.");
  }

  if (!response.ok) {
    const detail = data?.detail;

    throw new Error(
      typeof detail === "string"
        ? detail
        : "Something went wrong. Please try again.",
    );
  }

  return data;
}

// ======================================================
// BRAND ICON
// ======================================================

function BrandIcon({ platform }) {
  const item = PLATFORMS.find((p) => p.id === platform);

  if (!item) return null;

  return <span className={`brand-mark ${item.className}`}>{item.icon}</span>;
}

// ======================================================
// MAIN APPLICATION
// ======================================================

function App() {
  // Content input
  const [mode, setMode] = useState("file");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState(null);

  // Post details
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [caption, setCaption] = useState("");

  // AI settings
  const [language, setLanguage] = useState("both");
  const [tone, setTone] = useState("engaging");

  // Social platforms
  const [platforms, setPlatforms] = useState(["facebook"]);

  // Application states
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  // Uploaded video
  const [asset, setAsset] = useState("");
  const [source, setSource] = useState("");

  // Preview
  const [preview, setPreview] = useState(null);

  // AI status
  const [aiStatus, setAiStatus] = useState({
    loading: true,
    available: false,
    installed: false,
    model: "qwen2.5:3b",
    message: "Checking local AI...",
  });

  // AI generated result
  const [aiResult, setAiResult] = useState(null);

  // ====================================================
  // CHECK LOCAL AI ON PAGE LOAD
  // ====================================================

  useEffect(() => {
    checkAIStatus();
  }, []);

  // ====================================================
  // OLLAMA STATUS
  // ====================================================

  async function checkAIStatus() {
    setAiStatus((old) => ({
      ...old,
      loading: true,
    }));

    try {
      const data = await apiRequest("/ai/status");

      setAiStatus({
        loading: false,
        available: Boolean(data.available),
        installed: Boolean(data.installed),
        model: data.model || "qwen2.5:3b",
        message: data.message || "AI status checked.",
      });
    } catch (error) {
      setAiStatus({
        loading: false,
        available: false,
        installed: false,
        model: "qwen2.5:3b",
        message: error.message || "Cannot reach backend.",
      });
    }
  }

  // ====================================================
  // TOGGLE SOCIAL PLATFORMS
  // ====================================================

  function togglePlatform(platform) {
    setPlatforms((old) =>
      old.includes(platform)
        ? old.filter((item) => item !== platform)
        : [...old, platform],
    );

    setPreview(null);
  }

  // ====================================================
  // CHANGE CONTENT MODE
  // ====================================================

  function changeMode(nextMode) {
    setMode(nextMode);
    setMessage("");
    setPreview(null);
  }

  // ====================================================
  // VALIDATE VIDEO FILE
  // ====================================================

  function handleFileChange(event) {
    const selectedFile = event.target.files?.[0] || null;

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const extension = selectedFile.name
      .substring(selectedFile.name.lastIndexOf("."))
      .toLowerCase();

    if (!VIDEO_EXTENSIONS.includes(extension)) {
      setFile(null);
      setMessage("Please select MP4, MOV, M4V, or WEBM video.");

      event.target.value = "";
      return;
    }

    const maxSize = 500 * 1024 * 1024;

    if (selectedFile.size > maxSize) {
      setFile(null);
      setMessage("Maximum video size is 500 MB.");

      event.target.value = "";
      return;
    }

    setFile(selectedFile);
    setAsset("");
    setSource("");
    setPreview(null);
    setAiResult(null);
    setMessage("");
  }

  // ====================================================
  // UPLOAD VIDEO
  // ====================================================

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

      const data = await apiRequest("/videos/upload", {
        method: "POST",
        body,
      });

      setAsset(data.asset_id);

      setTitle((old) => old || file.name.replace(/\.[^.]+$/, ""));

      setMessage(`Video uploaded successfully: ${data.original_filename}`);
    } catch (error) {
      setMessage(`Upload Error: ${error.message}`);
    } finally {
      setBusy(false);
    }
  }

  // ====================================================
  // IMPORT / VALIDATE SOCIAL MEDIA LINK
  // ====================================================

  async function importLink() {
    if (!url.trim()) {
      setMessage("Please enter a video URL.");
      return;
    }

    setBusy(true);
    setMessage("Validating social media link...");
    setPreview(null);

    try {
      const data = await apiRequest("/videos/import-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: url.trim(),
        }),
      });

      setSource(data.source);

      // A recognized link is NOT a downloaded video.
      setAsset("");

      setMessage(
        `${data.source.toUpperCase()} link recognized. ${data.message}`,
      );
    } catch (error) {
      setSource("");
      setMessage(`Link Error: ${error.message}`);
    } finally {
      setBusy(false);
    }
  }

  // ====================================================
  // GENERATE AI CAPTION
  // ====================================================

  async function generateCaption() {
    const context = topic.trim() || caption.trim();

    if (context.length < 3) {
      setMessage(
        "Describe what happens in the video so Local AI can generate an accurate caption.",
      );
      return;
    }

    if (platforms.length === 0) {
      setMessage("Select at least one publishing platform.");
      return;
    }

    if (!aiStatus.available || !aiStatus.installed) {
      setMessage(
        "Local AI is not ready. Start Ollama and install the selected model.",
      );

      return;
    }

    setBusy(true);
    setMessage("Local AI is generating your captions...");
    setAiResult(null);

    try {
      const data = await apiRequest("/ai/generate-caption", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          topic: context,
          title,
          platforms,
          language,
          tone,
        }),
      });

      setAiResult(data);

      if (data.suggested_title) {
        setTitle(data.suggested_title);
      }

      let selectedCaption = "";

      if (language === "bangla") {
        selectedCaption = data.bangla_caption || "";
      } else if (language === "english") {
        selectedCaption = data.english_caption || "";
      } else {
        selectedCaption = [data.bangla_caption, data.english_caption]
          .filter(Boolean)
          .join("\n\n");
      }

      const finalCaption = [selectedCaption, (data.hashtags || []).join(" ")]
        .filter(Boolean)
        .join("\n\n");

      setCaption(finalCaption);

      setMessage(
        `Caption generated successfully using ${data.model}. Review before publishing.`,
      );
    } catch (error) {
      setMessage(`AI Error: ${error.message}`);

      // Refresh AI connection status after an error.
      await checkAIStatus();
    } finally {
      setBusy(false);
    }
  }

  // ====================================================
  // GENERATE PUBLISHING PREVIEW
  // ====================================================

  async function makePreview() {
    if (!asset && !source) {
      setMessage("Upload a video file or validate a social media link first.");
      return;
    }

    if (!platforms.length) {
      setMessage("Select at least one publishing platform.");
      return;
    }

    if (!title.trim()) {
      setMessage("Please enter a video title.");
      return;
    }

    if (!asset && source) {
      setMessage(
        "The link is recognized, but the video has not been imported. Upload an authorized video file before creating a publishing preview.",
      );
      return;
    }

    setBusy(true);
    setMessage("Creating publishing preview...");

    try {
      const data = await apiRequest("/publish/preview", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          filename: asset,
          title: title.trim(),
          caption,
          platforms,
        }),
      });

      setPreview(data);

      setMessage("Publishing preview created. Nothing has been published yet.");
    } catch (error) {
      setMessage(`Preview Error: ${error.message}`);
    } finally {
      setBusy(false);
    }
  }

  // ====================================================
  // APPLICATION UI
  // ====================================================

  return (
    <div className="shell">
      {/* SIDEBAR */}

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

      {/* MAIN CONTENT */}

      <main className="main">
        {/* HEADER */}

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

        {/* STATISTICS */}

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

            <strong>{asset ? "1" : "0"}</strong>

            <em>Local development</em>
          </div>

          <div className="stat">
            <span>Published posts</span>

            <strong>0</strong>

            <em>No live publishing yet</em>
          </div>
        </section>

        {/* WORKSPACE */}

        <section className="workspace">
          {/* LEFT PANEL */}

          <div className="panel composer">
            <div className="panel-head">
              <div>
                <p className="eyebrow">NEW CONTENT</p>

                <h2>Create a post</h2>
              </div>

              <span className="step">STEP 1 OF 3</span>
            </div>

            {/* UPLOAD / LINK TABS */}

            <div className="tabs">
              <button
                type="button"
                className={mode === "file" ? "selected" : ""}
                onClick={() => changeMode("file")}
                disabled={busy}
              >
                <UploadCloud size={17} />
                Upload video
              </button>

              <button
                type="button"
                className={mode === "link" ? "selected" : ""}
                onClick={() => changeMode("link")}
                disabled={busy}
              >
                <Link2 size={17} />
                Paste link
              </button>
            </div>

            {/* VIDEO UPLOAD */}

            {mode === "file" ? (
              <div className="dropzone">
                <input
                  type="file"
                  accept=".mp4,.mov,.m4v,.webm,video/mp4,video/quicktime,video/webm"
                  onChange={handleFileChange}
                  disabled={busy}
                />

                <div className="upload-icon">
                  <UploadCloud size={25} />
                </div>

                <b>{file ? file.name : "Choose a video to upload"}</b>

                <p>MP4, MOV, M4V or WEBM · Max 500 MB</p>

                <button
                  type="button"
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

                {asset && (
                  <p className="success">
                    <CheckCircle2 size={15} />
                    Video uploaded successfully
                  </p>
                )}
              </div>
            ) : (
              /* SOCIAL MEDIA LINK */

              <div className="linkbox">
                <label>Video URL</label>

                <div className="url-input">
                  <Link2 size={17} />

                  <input
                    type="url"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      setSource("");
                      setPreview(null);
                    }}
                    placeholder="Paste YouTube, Instagram or Facebook URL"
                    disabled={busy}
                  />
                </div>

                <button
                  type="button"
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
                  We validate the source first. Direct media import requires
                  platform permissions and authorization.
                </p>

                {source && (
                  <p className="success">
                    <CheckCircle2 size={15} />
                    {source.toUpperCase()} link recognized. Video import is
                    still pending.
                  </p>
                )}
              </div>
            )}

            {/* SOCIAL PLATFORMS */}

            <div className="section-title">
              <h3>Publishing platforms</h3>

              <span>Choose destinations</span>
            </div>

            <div className="platforms">
              {PLATFORMS.map((platform) => (
                <button
                  type="button"
                  key={platform.id}
                  className={`platform ${
                    platforms.includes(platform.id) ? "chosen" : ""
                  }`}
                  onClick={() => togglePlatform(platform.id)}
                  disabled={busy}
                >
                  <BrandIcon platform={platform.id} />

                  <span>
                    <b>{platform.name}</b>

                    <small>{platform.description}</small>
                  </span>

                  <i>{platforms.includes(platform.id) ? "✓" : ""}</i>
                </button>
              ))}
            </div>

            {/* POST DETAILS */}

            <div className="section-title">
              <h3>Post details</h3>

              <span>AI caption assistant</span>
            </div>

            <label htmlFor="video-title">Video title</label>

            <input
              id="video-title"
              className="field"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setPreview(null);
              }}
              placeholder="Enter a title"
              maxLength={200}
            />

            <label htmlFor="video-topic">What is this video about?</label>

            <textarea
              id="video-topic"
              className="field textarea"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Briefly describe the video. Example: A short cooking video showing how to make chicken biryani..."
              maxLength={2000}
            />

            <label htmlFor="video-caption">Caption / description</label>

            <textarea
              id="video-caption"
              className="field textarea"
              value={caption}
              onChange={(e) => {
                setCaption(e.target.value);
                setPreview(null);
              }}
              placeholder="Your AI-generated Bangla and English captions will appear here. You can edit them."
              maxLength={5000}
            />

            {/* AI CONTROLS */}

            <div className="ai-controls">
              <div className="language-control">
                <label htmlFor="caption-language">Caption language</label>

                <select
                  id="caption-language"
                  className="field"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  disabled={busy}
                >
                  <option value="both">Bangla + English</option>

                  <option value="bangla">Bangla only</option>

                  <option value="english">English only</option>
                </select>
              </div>

              <div className="language-control">
                <label htmlFor="caption-tone">Caption tone</label>

                <select
                  id="caption-tone"
                  className="field"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  disabled={busy}
                >
                  <option value="engaging">Engaging</option>

                  <option value="professional">Professional</option>

                  <option value="educational">Educational</option>

                  <option value="funny">Funny</option>

                  <option value="informative">Informative</option>

                  <option value="promotional">Promotional</option>
                </select>
              </div>

              <button
                type="button"
                className="primary ai-button"
                onClick={generateCaption}
                disabled={
                  busy ||
                  aiStatus.loading ||
                  !aiStatus.available ||
                  !aiStatus.installed
                }
              >
                {busy ? (
                  <LoaderCircle className="spin" size={16} />
                ) : (
                  <WandSparkles size={16} />
                )}
                Generate with Local AI
              </button>
            </div>

            {/* AI STATUS */}

            <div
              className={`ai-status ${
                aiStatus.available && aiStatus.installed ? "ready" : "not-ready"
              }`}
            >
              <span>
                {aiStatus.loading
                  ? "Checking Local AI..."
                  : aiStatus.available && aiStatus.installed
                    ? `Local AI ready · ${aiStatus.model}`
                    : aiStatus.message}
              </span>

              <button
                type="button"
                onClick={checkAIStatus}
                disabled={aiStatus.loading || busy}
              >
                {aiStatus.loading ? (
                  <LoaderCircle className="spin" size={15} />
                ) : (
                  <RefreshCw size={15} />
                )}
                Refresh
              </button>
            </div>

            {/* AI RESULT */}

            {aiResult && (
              <div className="ai-result">
                <b>AI suggestions</b>

                <p>
                  <strong>Suggested title:</strong>{" "}
                  {aiResult.suggested_title || "Not available"}
                </p>

                {aiResult.bangla_caption && (
                  <p>
                    <strong>Bangla:</strong> {aiResult.bangla_caption}
                  </p>
                )}

                {aiResult.english_caption && (
                  <p>
                    <strong>English:</strong> {aiResult.english_caption}
                  </p>
                )}

                <p>
                  <strong>Hashtags:</strong>{" "}
                  {(aiResult.hashtags || []).join(" ")}
                </p>

                {aiResult.platform_notes && (
                  <div>
                    <strong>Platform suggestions:</strong>

                    {platforms.map((platform) => {
                      const note = aiResult.platform_notes[platform];

                      if (!note) return null;

                      return (
                        <p key={platform}>
                          <strong>{platform.toUpperCase()}:</strong> {note}
                        </p>
                      );
                    })}
                  </div>
                )}

                <small>
                  Model: {aiResult.model}. Review all generated content before
                  publishing.
                </small>
              </div>
            )}

            {/* PUBLISHING PREVIEW */}

            <button
              type="button"
              className="primary full"
              onClick={makePreview}
              disabled={busy}
            >
              {busy ? (
                <LoaderCircle className="spin" size={16} />
              ) : (
                <Send size={16} />
              )}
              Generate publishing preview
            </button>

            {/* MESSAGE */}

            {message && (
              <div className="message">
                <AlertCircle size={17} />

                <span>{message}</span>
              </div>
            )}

            {/* PREVIEW RESULT */}

            {preview && (
              <div className="preview">
                <div className="success">
                  <CheckCircle2 size={18} />
                  Preview ready — approval required
                </div>

                <b>{preview.title || "Untitled video"}</b>

                <p>{preview.caption || "No caption provided."}</p>

                <small>
                  Selected: {preview.platforms.join(", ")} · Published: No
                </small>
              </div>
            )}
          </div>

          {/* RIGHT PANEL */}

          <div className="rightcol">
            {/* ACCOUNT SETUP */}

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

                  <small>Switch Personal to Professional</small>
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

            {/* AI INFORMATION */}

            <div className="panel tips">
              <div className="tip-icon">
                <Sparkles size={19} />
              </div>

              <h3>Local AI assistant</h3>

              <p>
                Generate Bangla and English captions and hashtags on your own
                computer using Ollama. No paid AI API is used.
              </p>

              <ul>
                <li>AI caption generation</li>

                <li>Bangla and English support</li>

                <li>Hashtag suggestions</li>

                <li>Platform-specific suggestions</li>

                <li>Approval before publishing</li>
              </ul>
            </div>

            {/* SECURITY */}

            <div className="security">
              <CheckCircle2 size={17} />

              <span>
                Your API tokens will stay on the backend. Never paste passwords
                or access tokens into this dashboard.
              </span>
            </div>
          </div>
        </section>

        {/* FOOTER */}

        <footer>
          SocialPilot AI · MVP v0.3.1 · Local AI caption assistant
        </footer>
      </main>
    </div>
  );
}

// ======================================================
// RENDER APPLICATION
// ======================================================

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
