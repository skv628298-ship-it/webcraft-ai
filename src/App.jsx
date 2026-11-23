
import { useState } from "react";
import "./App.css";

const templates = [
  { name: "Business", icon: "🏢", title: "Business Website" },
  { name: "Portfolio", icon: "💼", title: "Portfolio Website" },
  { name: "College", icon: "🎓", title: "College Website" },
  { name: "Restaurant", icon: "🍽️", title: "Restaurant Website" },
];

function App() {
  const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  const [prompt, setPrompt] = useState("");
  const [workspace, setWorkspace] = useState(false);
  const [selected, setSelected] = useState("Business");
  const [previewMode, setPreviewMode] = useState("desktop");
  const [siteTitle, setSiteTitle] = useState("Build Something Amazing");
  const [generatedHtml, setGeneratedHtml] = useState("");

  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editInstruction, setEditInstruction] = useState("");
  const [error, setError] = useState("");

  // GENERATE WEBSITE
  async function generateWebsite() {
    if (!prompt.trim()) {
      setError("Please describe your website first.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Website generation failed.");
      }

      if (!data.html) {
        throw new Error("Gemini returned an empty website.");
      }

      setGeneratedHtml(data.html);
      setWorkspace(true);
    } catch (err) {
      console.error("Generation error:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  // EDIT WEBSITE WITH AI
  async function editWebsite() {
    if (!editInstruction.trim()) {
      setError("Please describe the changes you want.");
      return;
    }

    if (!generatedHtml) {
      setError("Generate a website before editing.");
      return;
    }

    try {
      setIsEditing(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/edit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            html: generatedHtml,
            instruction: editInstruction,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Website editing failed.");
      }

      if (!data.html) {
        throw new Error("Gemini returned an empty edited website.");
      }

      setGeneratedHtml(data.html);
      setEditInstruction("");
      setError("");
    } catch (err) {
      console.error("Editing error:", err);
      setError(err.message || "Could not edit the website.");
    } finally {
      setIsEditing(false);
    }
  }

  // TEMPLATE SELECTION
  function chooseTemplate(template) {
    setSelected(template.name);
    setSiteTitle(template.title);
  }

  // DOWNLOAD WEBSITE
  function downloadWebsite() {
    if (!generatedHtml) return;

    const blob = new Blob([generatedHtml], {
      type: "text/html",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "webcraft-website.html";
    link.click();

    URL.revokeObjectURL(url);
  }

  // SIGN IN PLACEHOLDER
  function handleSignIn() {
    alert("Sign In feature coming soon!");
  }

  // WEBSITE EDITOR
  if (workspace) {
    return (
      <div className="workspace">

        <header className="editor-header">

          <button
            className="back-btn"
            onClick={() => {
              setWorkspace(false);
              setError("");
            }}
          >
            ← Back
          </button>

          <h2 className="editor-logo">
            ✦ WebCraft <span>AI</span>
          </h2>

          <div className="editor-actions">

            <button
              className={
                previewMode === "desktop" ? "active-mode" : ""
              }
              onClick={() => setPreviewMode("desktop")}
            >
              🖥 Desktop
            </button>

            <button
              className={
                previewMode === "mobile" ? "active-mode" : ""
              }
              onClick={() => setPreviewMode("mobile")}
            >
              📱 Mobile
            </button>

          </div>
        </header>

        <div className="editor-layout">

          {/* EDITOR SIDEBAR */}
          <aside className="editor-sidebar">

            <h2>Website Studio</h2>

            <p className="sidebar-subtitle">
              Create and customize your website.
            </p>

            <label>YOUR WEBSITE IDEA</label>

            <textarea
              className="editor-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your website..."
            />

            <h3>Choose a template</h3>

            <div className="template-options">
              {templates.map((template) => (
                <button
                  key={template.name}
                  className={
                    selected === template.name
                      ? "template-option selected"
                      : "template-option"
                  }
                  onClick={() => chooseTemplate(template)}
                >
                  <span>{template.icon}</span>
                  {template.name}

                  {selected === template.name && (
                    <span>✓</span>
                  )}
                </button>
              ))}
            </div>

            <label>WEBSITE HEADING</label>

            <input
              className="title-input"
              value={siteTitle}
              onChange={(e) => setSiteTitle(e.target.value)}
              placeholder="Enter website heading"
            />

            <div className="ai-edit-section">

              <label>EDIT YOUR WEBSITE WITH AI</label>

              <textarea
                className="editor-prompt"
                value={editInstruction}
                onChange={(e) => setEditInstruction(e.target.value)}
                placeholder="Example: Change the background to black and add a contact section..."
                maxLength={3000}
              />

              <button
                className="update-preview"
                onClick={editWebsite}
                disabled={isEditing || loading}
              >
                {isEditing
                  ? "AI is editing..."
                  : "✦ Edit with AI"}
              </button>

            </div>

            {error && (
              <p className="error-message">{error}</p>
            )}

            <p className="editor-note">
              ✦ Customize your website with WebCraft AI.
            </p>

          </aside>

          {/* WEBSITE PREVIEW */}
          <main className="preview-area">

            <div className="preview-toolbar">

              <div>
                <span className="live-dot"></span>
                Website Preview
              </div>

              <div>
                <span>
                  {previewMode === "desktop"
                    ? "Desktop view"
                    : "Mobile view"}
                </span>

                <button
                  onClick={downloadWebsite}
                  disabled={isEditing}
                >
                  ↓ Download
                </button>
              </div>

            </div>

            {isEditing && (
              <div className="editing-status">
                ✦ AI is updating your website...
                <p>Applying your requested changes.</p>
              </div>
            )}

            <div className={`preview-frame ${previewMode}`}>

              <iframe
                title="Generated Website Preview"
                srcDoc={generatedHtml}
                sandbox="allow-scripts"
                className="generated-preview"
              />

            </div>

          </main>

        </div>

      </div>
    );
  }

  // MAIN HOMEPAGE
  return (
    <div className="app">

      {/* NAVIGATION BAR */}
      <nav className="navbar">

        <a href="#home" className="logo">
          ✦ WebCraft <span>AI</span>
        </a>

        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#features">Features</a>
          <a href="#templates">Templates</a>

          <button
            className="login-btn"
            onClick={handleSignIn}
          >
            Sign In
          </button>
        </div>

      </nav>

      {/* HERO SECTION */}
      <main className="hero" id="home">

        <div className="tag">
          ✦ AI POWERED WEBSITE BUILDER
        </div>

        <h1>
          Build Your Dream Website
          <br />
          <span>With Artificial Intelligence.</span>
        </h1>

        <p>
          Turn your ideas into beautiful websites.
          No coding skills required. Just describe your vision.
        </p>

        <div className="generator">

          <label>
            ✦ Describe your dream website
          </label>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Example: Create a modern portfolio website..."
          />

          {error && (
            <p className="error-message">{error}</p>
          )}

          <div className="generator-bottom">

            <span>✧ AI Website Generation</span>

            <button
              onClick={generateWebsite}
              disabled={loading}
            >
              {loading
                ? "Generating..."
                : "Generate Website →"}
            </button>

          </div>

        </div>

        {/* QUICK PROMPT EXAMPLES */}
        <div className="examples">

          <span>Try these ideas:</span>

          {[
            "Create a restaurant website",
            "Build my personal portfolio",
            "Create a college website",
            "Build an online shopping website",
          ].map((item) => (
            <button
              key={item}
              onClick={() => {
                setPrompt(item);
                setError("");
              }}
            >
              {item}
            </button>
          ))}

        </div>

      </main>

      {/* FEATURES SECTION */}
      <section className="features" id="features">

        <h2>Everything you need to create</h2>

        <p>
          Simple tools. Powerful AI. Beautiful websites.
        </p>

        <div className="feature-grid">

          <div className="feature-card">
            <h3>✦ AI Generation</h3>
            <p>
              Generate websites using simple descriptions.
            </p>
          </div>

          <div className="feature-card">
            <h3>▣ Templates</h3>
            <p>
              Choose from professional website templates.
            </p>
          </div>

          <div className="feature-card">
            <h3>✎ Easy Editing</h3>
            <p>
              Customize websites using AI instructions.
            </p>
          </div>

          <div className="feature-card">
            <h3>◎ Responsive</h3>
            <p>
              Websites that work on mobile and desktop.
            </p>
          </div>

        </div>

      </section>

      {/* TEMPLATES SECTION */}
      <section className="templates" id="templates">

        <h2>Start creating today</h2>

        <div className="template-grid">

          <div>🌐 Business Website</div>
          <div>🎓 College Website</div>
          <div>💼 Portfolio Website</div>
          <div>🛍️ Shopping Website</div>

        </div>

      </section>

      {/* FOOTER */}
      <footer>

        <h3>✦ WebCraft AI</h3>

        <p>
          Build something amazing. © 2026 WebCraft AI.
        </p>

      </footer>

    </div>
  );
}

export default App;
