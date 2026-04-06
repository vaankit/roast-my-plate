import React, { useState, useRef, useCallback } from 'react';
import { Upload, Flame, Share2, Download, RotateCcw, Sparkles, Zap } from 'lucide-react';
import { toPng } from 'html-to-image';
import './index.css';

const PERSONAS = [
  { id: 'default', label: '🔥 Savage Critic', desc: 'No mercy. Pure destruction.' },
  { id: 'gordon', label: '👨‍🍳 Gordon Ramsay', desc: "IT'S RAW!" },
  { id: 'grandma', label: '👵 Passive-Aggressive Grandma', desc: 'Oh honey... bless your heart.' },
  { id: 'nigel', label: '🎩 Uncle Nigel', desc: 'Dreadfully ghastly, darling.' },
  { id: 'gen_z', label: '💀 Gen Z TikToker', desc: 'bestie no 😭' },
  { id: 'shakespeare', label: '🎭 Shakespeare', desc: 'Forsooth, what tragedy is this?' },
  { id: 'hype_man', label: '🎉 Hype Man', desc: 'YOOOO THIS IS FIRE!' },
];

function App() {
  const [file, setFile] = useState(null);
  const [previewURL, setPreviewURL] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [activePersona, setActivePersona] = useState('default');
  const [personaLoading, setPersonaLoading] = useState(false);

  const exportRef = useRef(null);

  const sassyTexts = [
    "Warming up the roast chambers...",
    "Consulting the council of disappointed chefs...",
    "Preparing emotional damage...",
    "Analyzing this so-called 'food'...",
    "Your meal is being judged. Harshly.",
    "Summoning culinary destruction...",
  ];
  const [sassyIndex, setSassyIndex] = useState(0);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (selectedFile) => {
    if (!selectedFile.type.startsWith('image/')) {
      alert('Nice try. That\'s not food. That\'s not even an image.');
      return;
    }
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewURL(reader.result);
    };
    reader.readAsDataURL(selectedFile);
    setResult(null);
    setActivePersona('default');
  };

  const performRoast = async (persona = 'default') => {
    if (!file) return;

    const isPersonaSwitch = result !== null;
    if (isPersonaSwitch) {
      setPersonaLoading(true);
    } else {
      setLoading(true);
    }
    
    const interval = setInterval(() => {
      setSassyIndex(prev => (prev + 1) % sassyTexts.length);
    }, 2000);

    const formData = new FormData();
    formData.append('image', file);
    formData.append('persona', persona);

    try {
      const endpoint = import.meta.env.DEV ? 'http://localhost:3001/api/roast' : '/api/roast';
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      
      if (data.success) {
        setResult(data.data);
        setActivePersona(persona);
      } else {
        alert("The roasting machine broke: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("The roast server ghosted us. Try again in a sec.");
    } finally {
      clearInterval(interval);
      setLoading(false);
      setPersonaLoading(false);
    }
  };

  const handleRoast = () => performRoast('default');

  const handlePersonaSwitch = (personaId) => {
    if (personaId === activePersona) return;
    performRoast(personaId);
  };

  const resetAll = () => {
    setFile(null);
    setPreviewURL(null);
    setResult(null);
    setActivePersona('default');
  };

  const handleDownloadImage = async () => {
    if (exportRef.current === null) return;
    try {
      const dataUrl = await toPng(exportRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = 'roast-my-plate.png';
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export image', err);
      alert("Screenshot machine broke. Classic.");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Roast My Plate 🔥',
          text: `My meal got absolutely wrecked: "${result.text}" \nDamage Level: ${result.score}/10. Your food is next → `,
          url: window.location.href,
        });
      } catch (err) {
        console.error("Native share failed", err);
      }
    } else {
      navigator.clipboard.writeText(
        `My meal got roasted: "${result.text}" — Score: ${result.score}/10. Try it: ${window.location.href}`
      );
      alert("Copied to clipboard. Go spread the destruction.");
    }
  };

  const personaLabel = PERSONAS.find(p => p.id === activePersona)?.label || '🔥 Savage Critic';

  return (
    <div className="app-container">
      {/* Animated background grid */}
      <div className="bg-grid" />
      <div className="bg-glow bg-glow-1" />
      <div className="bg-glow bg-glow-2" />

      <header>
        <div className="logo-mark">
          <Flame className="logo-flame" />
        </div>
        <h1>ROAST MY PLATE</h1>
        <p className="subtitle">
          Upload your <span className="text-accent">culinary disaster</span>. Get emotionally destroyed. Share the trauma.
        </p>
        <div className="tagline">
          <Zap size={14} /> No feelings were considered in the making of this app.
        </div>
      </header>

      {!loading && !result && (
        <main>
          {!file ? (
            <label 
              className={`upload-card ${dragActive ? 'drag-active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
                style={{ display: 'none' }} 
                id="file-upload"
              />
              <div className="upload-icon-wrap">
                <Upload className="upload-icon" />
              </div>
              <h2>Drop your "masterpiece" here</h2>
              <p className="upload-sub">Or click to select from your camera roll of regrets</p>
              <div className="upload-formats">JPG, PNG, WEBP — we accept all forms of disappointment</div>
            </label>
          ) : (
            <div className="preview-container">
              <div className="preview-image-wrap">
                <img src={previewURL} alt="Your questionable food" className="preview-image" />
                <div className="preview-badge">EVIDENCE</div>
              </div>
              <p className="preview-warning">⚠️ By clicking Roast, you agree that your feelings are not our responsibility.</p>
              <div className="preview-actions">
                <button className="btn btn-ghost" onClick={resetAll}>
                  <RotateCcw size={18} /> Chicken Out
                </button>
                <button className="btn btn-primary btn-glow" onClick={handleRoast}>
                  <Flame size={18} /> ROAST THIS
                </button>
              </div>
            </div>
          )}
        </main>
      )}

      {loading && (
        <div className="loader-container">
          <div className="loader-ring">
            <div className="loader-ring-inner" />
          </div>
          <p className="sassy-text">{sassyTexts[sassyIndex]}</p>
          <div className="loader-subtext">This might hurt. Emotionally.</div>
        </div>
      )}

      {result && (
        <main className="result-main">
          <div className="result-card">
            
            {/* Exportable area */}
            <div className="export-wrap" ref={exportRef}>
              <div className="result-header">
                <div className="result-persona-tag">{personaLabel}</div>
                {result.score !== null && (
                  <div className="roast-score">
                    <span className="score-number">{result.score}</span>
                    <span className="score-label">/10</span>
                  </div>
                )}
              </div>
              
              <img 
                src={previewURL} 
                alt="Roasted food" 
                className="result-image" 
              />
              
              <div className="roast-text">
                <Sparkles size={16} className="quote-icon" />
                {result.text}
              </div>

              <div className="branding">
                <Flame size={12} />
                <span>ROAST MY PLATE</span>
              </div>
            </div>

            {/* Persona Capsules */}
            <div className="persona-section">
              <div className="persona-label">Switch Roaster Persona</div>
              <div className="persona-grid">
                {PERSONAS.map(p => (
                  <button 
                    key={p.id}
                    className={`persona-capsule ${activePersona === p.id ? 'active' : ''} ${personaLoading ? 'disabled' : ''}`}
                    onClick={() => handlePersonaSwitch(p.id)}
                    disabled={personaLoading}
                    title={p.desc}
                  >
                    <span className="persona-capsule-label">{p.label}</span>
                    <span className="persona-capsule-desc">{p.desc}</span>
                  </button>
                ))}
              </div>
              {personaLoading && (
                <div className="persona-loading">
                  <div className="persona-loading-dot" />
                  <span>Channeling new energy...</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="actions">
              <button className="btn btn-ghost" onClick={resetAll}>
                <RotateCcw size={18} /> New Victim
              </button>
              <button className="btn btn-outline" onClick={handleShare}>
                <Share2 size={18} /> Share Pain
              </button>
              <button className="btn btn-primary" onClick={handleDownloadImage}>
                <Download size={18} /> Get Card
              </button>
            </div>
          </div>
        </main>
      )}

      <footer>
        <p>Built with zero empathy and questionable taste.</p>
      </footer>
    </div>
  );
}

export default App;
