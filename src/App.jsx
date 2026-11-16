import { useState } from "react";
import "./App.css";

const templates = [
  { name: "Business", icon: "🏢", title: "Business Website" },
  { name: "Portfolio", icon: "💼", title: "Portfolio Website" },
  { name: "College", icon: "🎓", title: "College Website" },
  { name: "Restaurant", icon: "🍽️", title: "Restaurant Website" },
];

function App() {
  const [prompt, setPrompt] = useState("");
  const [workspace, setWorkspace] = useState(false);
  const [selected, setSelected] = useState("Business");
  const [previewMode, setPreviewMode] = useState("desktop");
  const [siteTitle, setSiteTitle] = useState("Build Something Amazing");
  const [generatedHtml, setGeneratedHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function generateWebsite() {
  if (!prompt.trim()) {
    alert("Please describe your website.");
    return;
  }

  try {
    setLoading(true);
    setError("");

    const response = await fetch(
      "http://localhost:5000/api/generate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Generation failed");
    }

    setGeneratedHtml(data.html);
    setWorkspace(true);

  } catch (err) {
    console.error(err);
    setError(err.message);
    alert(err.message);
  } finally {
    setLoading(false);
  }
}

  function chooseTemplate(template) {
    setSelected(template.name);
    setSiteTitle(template.title);
  }

  if (workspace) {
    return (
      <div className="workspace">
        <header className="editor-header">
          <button className="back-btn" onClick={() => setWorkspace(false)}>
            ← Back
          </button>

          <h2 className="editor-logo">
            ✦ WebCraft <span>AI</span>
          </h2>

          <div className="editor-actions">
            <button
              className={previewMode === "desktop" ? "active-mode" : ""}
              onClick={() => setPreviewMode("desktop")}
            >
              🖥 Desktop
            </button>
            <button
              className={previewMode === "mobile" ? "active-mode" : ""}
              onClick={() => setPreviewMode("mobile")}
            >
              📱 Mobile
            </button>
          </div>
        </header>

        <div className="editor-layout">
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
                    selected === template.name ? "template-option selected" : "template-option"
                  }
                  onClick={() => chooseTemplate(template)}
                >
                  <span>{template.icon}</span>
                  {template.name}
                  {selected === template.name && <span>✓</span>}
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

            <button
              className="update-preview"
              onClick={() => alert("Your preview has been updated!")}
            >
              Update Preview →
            </button>

            <p className="editor-note">
              ✦ AI generation will be connected in Phase 3.
            </p>
          </aside>

        <main className="preview-area">
            <div className="preview-toolbar">
              <div>
                <span className="live-dot"></span>
                Website Preview
              </div>
              <span>{previewMode === "desktop" ? "Desktop view" : "Mobile view"}</span>
            </div>

            <div className={`preview-frame ${previewMode}`}>
              {generatedHtml ? (
  <iframe
    title="Generated Website Preview"
    srcDoc={generatedHtml}
    sandbox="allow-scripts"
    className="generated-preview"
  />
) : (
  <div className="sample-site">
    <h2>Your Website Preview</h2>
    <p>Your generated website will appear here.</p>
  </div>
)}
                </div>

                <section className="sample-hero">
                  <span className="sample-tag">WELCOME TO OUR WEBSITE</span>
                  <h1>{siteTitle || "Your Website Heading"}</h1>
                  <p>
                    Discover something extraordinary.
                    We turn great ideas into amazing experiences.
                  </p>
                  <button>Get Started →</button>
                </section>

                <section className="sample-content">
                  <h2>What We Offer</h2>
                  <p>Everything you need to get started.</p>

                  <div className="sample-cards">
                    <article>
                      <span>✦</span>
                      <h3>Creative Design</h3>
                      <p>Beautiful experiences made for you.</p>
                    </article>
                    <article>
                      <span>⚡</span>
                      <h3>Quality Service</h3>
                      <p>Simple solutions for your needs.</p>
                    </article>
                    <article>
                      <span>◎</span>
                      <h3>Great Support</h3>
                      <p>We are here to help you grow.</p>
                    </article>
                  </div>
                </section>

                <footer className="sample-footer">
                  © 2026 {selected} Studio. All rights reserved.
                </footer>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <nav className="navbar">
        <h2 className="logo">✦ WebCraft <span>AI</span></h2>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#templates">Templates</a>
          <button className="login-btn">Sign In</button>
        </div>
      </nav>

      <main className="hero">
        <div className="tag">✦ AI POWERED WEBSITE BUILDER</div>

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
          <label>✦ Describe your dream website</label>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Example: Create a modern portfolio website..."
          />

          <div className="generator-bottom">
            <span>✧ AI Website Generation</span>
            <button onClick={generateWebsite}>
              Generate Website →
            </button>
          </div>
        </div>

        <div className="examples">
          <span>Try these ideas:</span>
          {[
            "Create a restaurant website",
            "Build my personal portfolio",
            "Create a college website",
            "Build an online shopping website",
          ].map((item) => (
            <button key={item} onClick={() => setPrompt(item)}>
              {item}
            </button>
          ))}
        </div>
      </main>

      <section className="features" id="features">
        <h2>Everything you need to create</h2>
        <p>Simple tools. Powerful AI. Beautiful websites.</p>

        <div className="feature-grid">
          <div className="feature-card">
            <h3>✦ AI Generation</h3>
            <p>Generate websites using simple descriptions.</p>
          </div>
          <div className="feature-card">
            <h3>▣ Templates</h3>
            <p>Choose from professional website templates.</p>
          </div>
          <div className="feature-card">
            <h3>✎ Easy Editing</h3>
            <p>Customize colors, text and layouts.</p>
          </div>
          <div className="feature-card">
            <h3>◎ Responsive</h3>
            <p>Websites that work on mobile and desktop.</p>
          </div>
        </div>
      </section>

      <section className="templates" id="templates">
        <h2>Start creating today</h2>
        <div className="template-grid">
          <div>🌐 Business Website</div>
          <div>🎓 College Website</div>
          <div>💼 Portfolio Website</div>
          <div>🛍️ Shopping Website</div>
        </div>
      </section>

      <footer>
        <h3>✦ WebCraft AI</h3>
        <p>Build something amazing. © 2026 WebCraft AI.</p>
      </footer>
    </div>
  );
}

export default App;