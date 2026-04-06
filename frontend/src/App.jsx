import React, { useState, useRef, useCallback } from 'react';
import { Upload, Flame, Share2, Download, RotateCcw, Image as ImageIcon } from 'lucide-react';
import { toPng } from 'html-to-image';
import './index.css';

function App() {
  const [file, setFile] = useState(null);
  const [previewURL, setPreviewURL] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const exportRef = useRef(null);

  const sassyTexts = [
    "Sharpening the knives...",
    "Consulting Gordon Ramsay's ghost...",
    "Preparing emotional damage...",
    "Analyzing this so-called 'food'..."
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
      alert('Please upload a valid image file!');
      return;
    }
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewURL(reader.result);
    };
    reader.readAsDataURL(selectedFile);
    setResult(null);
  };

  const handleRoast = async () => {
    if (!file) return;

    setLoading(true);
    // Cycle sassy text playfully while loading
    const interval = setInterval(() => {
      setSassyIndex(prev => (prev + 1) % sassyTexts.length);
    }, 2500);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const endpoint = import.meta.env.DEV ? 'http://localhost:3001/api/roast' : '/api/roast';
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      
      if (data.success) {
        setResult(data.data);
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to connect to the roaster backend. Is the server running?");
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const resetAll = () => {
    setFile(null);
    setPreviewURL(null);
    setResult(null);
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
      alert("Failed to create shareable image.");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Roast My Plate',
          text: `My meal got absolutely roasted: "${result.text}" \nScore: ${result.score}/10. Try it yourself!`,
          url: window.location.href,
        });
      } catch (err) {
        console.error("Native share failed", err);
      }
    } else {
      // Fallback
      alert("Native sharing is not supported on your browser. Please use the Download option instead!");
    }
  };

  return (
    <div className="app-container">
      <header>
        <h1>Roast My Plate <Flame color="#ff3366" size={40} style={{ display: 'inline', verticalAlign: 'bottom', animation: 'pulse 2s infinite' }} /></h1>
        <p className="subtitle">Upload your meal. Get emotionally destroyed. Share with friends.</p>
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
              />
              <Upload className="upload-icon" />
              <h2>Drag & Drop your masterpiece</h2>
              <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>Or click to browse your files</p>
            </label>
          ) : (
            <div className="preview-container">
              <img src={previewURL} alt="Your food" className="preview-image" />
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn btn-secondary" onClick={resetAll}>
                  <RotateCcw size={20} /> Choose Another
                </button>
                <button className="btn" onClick={handleRoast}>
                  <Flame size={20} /> Roast Me!
                </button>
              </div>
            </div>
          )}
        </main>
      )}

      {loading && (
        <div className="loader-container">
          <div className="loader"></div>
          <p className="sassy-text">{sassyTexts[sassyIndex]}</p>
        </div>
      )}

      {result && (
        <main>
          <div className="result-card">
            
            {/* The exact container we convert to an image download */}
            <div className="export-wrap" ref={exportRef}>
              {result.score !== null && (
                <div className="roast-score">
                  {result.score}<span style={{fontSize: '1rem', color: 'var(--accent-color)'}}>/10</span>
                </div>
              )}
              
              <img src={previewURL} alt="Roasted food" className="preview-image" style={{maxHeight: '300px', width: '100%', objectFit: 'cover', marginTop: result.score !== null ? '1rem' : '0'}} />
              
              <div className="roast-text">
                "{result.text}"
              </div>

              <div className="branding">
                <Flame size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle', color: 'var(--accent-color)' }} />
                ROAST MY PLATE
              </div>
            </div>

            {/* Action Buttons (Not included in export) */}
            <div className="actions">
              <button className="btn btn-secondary" onClick={resetAll}>
                 <RotateCcw size={20} /> Try Again
              </button>
              <button className="btn btn-secondary" onClick={handleShare} title="Share Text">
                 <Share2 size={20} /> Share
              </button>
              <button className="btn" onClick={handleDownloadImage} title="Download Card">
                 <Download size={20} /> Get Card
              </button>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}

export default App;
