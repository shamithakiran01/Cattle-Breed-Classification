import { useState, useRef, useCallback, useEffect } from 'react';
import { predictFromFile, predictFromURL, predictFromBase64 } from '../services/api';
import { usePredictionHistory } from '../hooks/usePredictionHistory';
import { LANGUAGES, UI_TRANSLATIONS, USE_TRANSLATIONS, getBreedDescription, getTranslatedBreedName, getTranslatedRegion } from '../data/translations';

function PredictPage() {
    const [activeTab, setActiveTab] = useState('upload');
    const [imagePreview, setImagePreview] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [imageUrl, setImageUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const [cameraActive, setCameraActive] = useState(false);
    const [selectedLang, setSelectedLang] = useState('en');

    const fileInputRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    const { history, addPrediction } = usePredictionHistory();

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    const processFile = (file) => {
        if (!file.type.startsWith('image/')) { setError('Please select an image file'); return; }
        setSelectedFile(file);
        setError(null);
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target.result);
        reader.readAsDataURL(file);
    };

    const handleDrop = (e) => {
        e.preventDefault(); setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) processFile(file);
    };

    useEffect(() => {
        if (cameraActive && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
            videoRef.current.play().catch(e => console.error("Camera play error:", e));
        }
    }, [cameraActive]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
            });
            streamRef.current = stream;
            setCameraActive(true); 
            setError(null);
        } catch { 
            setError('Could not access camera. Please check permissions.'); 
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        setCameraActive(false);
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const canvas = canvasRef.current, video = videoRef.current;
        
        if (video.videoWidth === 0 || video.videoHeight === 0) {
            setError("Camera is still initializing. Please wait a second and try again.");
            return;
        }
        
        canvas.width = video.videoWidth; canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        setImagePreview(canvas.toDataURL('image/jpeg', 0.85));
        stopCamera();
    };

    const clearImage = () => {
        setImagePreview(null); setSelectedFile(null); setResult(null); setError(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handlePredict = useCallback(async () => {
        setLoading(true); setError(null); setResult(null);
        try {
            let response;
            if (activeTab === 'upload' && selectedFile) response = await predictFromFile(selectedFile);
            else if (activeTab === 'url' && imageUrl) response = await predictFromURL(imageUrl);
            else if (activeTab === 'camera' && imagePreview) response = await predictFromBase64(imagePreview);
            else { setError('Please provide an image first'); setLoading(false); return; }
            setResult(response);
            setSelectedLang('en');
            addPrediction(response, imagePreview);
        } catch (err) { setError(err.message || 'Prediction failed'); }
        finally { setLoading(false); }
    }, [activeTab, selectedFile, imageUrl, imagePreview, addPrediction]);

    const getConfidenceClass = (conf) => conf >= 0.75 ? 'high' : conf >= 0.5 ? 'medium' : 'low';
    const canPredict = (activeTab === 'upload' && selectedFile) || (activeTab === 'url' && imageUrl.trim()) || (activeTab === 'camera' && imagePreview);

    const t = UI_TRANSLATIONS[selectedLang] || UI_TRANSLATIONS.en;

    return (
        <div className="page">
            <h2 className="section-title">Predict Breed</h2>
            <p className="section-subtitle">Upload an image, use your camera, or paste a URL to identify the breed.</p>

            <div className="predict-layout">
                {/* Left: Input panel */}
                <div className="glass-card">
                    <div className="input-tabs">
                        <button className={`input-tab ${activeTab === 'upload' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('upload'); stopCamera(); }}>📁 Upload</button>
                        <button className={`input-tab ${activeTab === 'camera' ? 'active' : ''}`}
                            onClick={() => setActiveTab('camera')}>📷 Camera</button>
                        <button className={`input-tab ${activeTab === 'url' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('url'); stopCamera(); }}>🔗 URL</button>
                    </div>

                    {activeTab === 'upload' && (
                        <>
                            <div className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleDrop}>
                                <div className="icon">📤</div>
                                <p><strong>Click to upload</strong> or drag &amp; drop</p>
                                <p className="hint">JPG, PNG, WebP — max 10MB</p>
                            </div>
                            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFileSelect} />
                        </>
                    )}

                    {activeTab === 'camera' && (
                        <>
                            {!cameraActive && !imagePreview && (
                                <div className="upload-zone" onClick={startCamera}>
                                    <div className="icon">📷</div>
                                    <p><strong>Click to open camera</strong></p>
                                    <p className="hint">Allow camera access when prompted</p>
                                </div>
                            )}
                            {cameraActive && (
                                <div className="camera-container">
                                    <video ref={videoRef} playsInline muted />
                                    <div className="camera-controls">
                                        <button className="camera-capture-btn" onClick={capturePhoto} title="Capture Photo" />
                                        <button className="btn-secondary" onClick={stopCamera}>Cancel</button>
                                    </div>
                                </div>
                            )}
                            <canvas ref={canvasRef} hidden />
                        </>
                    )}

                    {activeTab === 'url' && (
                        <>
                            <label style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Image URL</label>
                            <div className="url-input-group">
                                <input type="url" placeholder="https://example.com/cow-image.jpg"
                                    value={imageUrl}
                                    onChange={(e) => { setImageUrl(e.target.value); setImagePreview(e.target.value); }} />
                            </div>
                        </>
                    )}

                    {imagePreview && (
                        <div className="image-preview">
                            <img src={imagePreview} alt="Preview" />
                            <button className="remove-btn" onClick={clearImage}>✕</button>
                        </div>
                    )}

                    {error && (
                        <div className="prediction-warning" style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)' }}>
                            ⚠️ {error}
                        </div>
                    )}

                    <button className="btn-primary predict-btn" onClick={handlePredict} disabled={!canPredict || loading}>
                        {loading ? '⏳ Analyzing...' : '🔍 Classify Breed'}
                    </button>

                    <div className="tips-box">
                        <h4>📸 Tips for Better Results</h4>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            <li style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>• Use a clear side-view photo of the animal</li>
                            <li style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>• Ensure good lighting and minimal background clutter</li>
                            <li style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>• Show the full body including head and horns</li>
                            <li style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>• Avoid photos with multiple animals</li>
                        </ul>
                    </div>
                </div>

                {/* Right: Results panel */}
                <div>
                    {loading && (
                        <div className="glass-card loading-spinner">
                            <div className="spinner" />
                            <p style={{ color: 'var(--color-text-secondary)' }}>Analyzing image...</p>
                        </div>
                    )}

                    {result && !loading && (
                        <div className="glass-card result-card">
                            {result.predicted_breed === 'Non-Cattle' ? (
                                <div className="prediction-warning" style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', marginBottom: 0 }}>
                                    <h3 style={{ color: '#ef4444', marginBottom: '10px' }}>⚠️ Not a Cattle Image</h3>
                                    <p>{result.warning}</p>
                                </div>
                            ) : (
                                <>
                                    {/* Header */}
                                    <div className="result-header">
                                        <h3 className="result-breed-name">{getTranslatedBreedName(result.predicted_breed, selectedLang)}</h3>
                                        <span className={`result-badge ${getConfidenceClass(result.confidence)}`}>
                                            {(result.confidence * 100).toFixed(1)}%
                                        </span>
                                    </div>

                                    {/* Language Switcher */}
                            <div className="lang-switcher-wrapper">
                                <span className="lang-switcher-label">🌐 {t.chooseLanguage}</span>
                                <div className="lang-switcher">
                                    {LANGUAGES.map(lang => (
                                        <button
                                            key={lang.code}
                                            className={`lang-btn ${selectedLang === lang.code ? 'active' : ''}`}
                                            onClick={() => setSelectedLang(lang.code)}
                                            title={lang.name}
                                        >
                                            <span className="lang-flag">{lang.flag}</span>
                                            <span className="lang-label">{lang.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Confidence bar */}
                            <div className="confidence-bar-container">
                                <div className="confidence-bar-label">
                                    <span>{t.confidence}</span>
                                    <span>{(result.confidence * 100).toFixed(1)}%</span>
                                </div>
                                <div className="confidence-bar">
                                    <div className="confidence-bar-fill" style={{ width: `${result.confidence * 100}%` }} />
                                </div>
                            </div>

                            {/* Top K */}
                            {result.top_k && result.top_k.length > 1 && (
                                <div className="topk-list">
                                    <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>
                                        {t.topPredictions}
                                    </h4>
                                    {result.top_k.map((item, idx) => (
                                        <div className="topk-item" key={idx}>
                                            <span className={`topk-rank ${idx === 0 ? 'first' : ''}`}>{idx + 1}</span>
                                            <span className="topk-name">{getTranslatedBreedName(item.breed, selectedLang)}</span>
                                            <span className="topk-conf">{(item.confidence * 100).toFixed(1)}%</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Breed info */}
                            {result.breed_info && (
                                <>
                                    <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                        {t.breedDetails}
                                    </h4>
                                    <div className="breed-info-grid">
                                        <div className="breed-info-item">
                                            <div className="breed-info-label">{t.region}</div>
                                            <div className="breed-info-value">{getTranslatedRegion(result.breed_info.region, selectedLang)}</div>
                                        </div>
                                        <div className="breed-info-item">
                                            <div className="breed-info-label">{t.type}</div>
                                            <div className="breed-info-value">{result.breed_info.animal_type}</div>
                                        </div>
                                        <div className="breed-info-item">
                                            <div className="breed-info-label">{t.milkYield}</div>
                                            <div className="breed-info-value">{result.breed_info.avg_milk_liters_per_day} {t.perDay}</div>
                                        </div>
                                        <div className="breed-info-item">
                                            <div className="breed-info-label">{t.lifespan}</div>
                                            <div className="breed-info-value">{result.breed_info.lifespan_years} {t.years}</div>
                                        </div>
                                        <div className="breed-info-item">
                                            <div className="breed-info-label">{t.primaryUse}</div>
                                            <div className="breed-info-value">
                                                {(USE_TRANSLATIONS[selectedLang] || USE_TRANSLATIONS.en)[result.breed_info.primary_use] || result.breed_info.primary_use}
                                            </div>
                                        </div>
                                        <div className="breed-info-item">
                                            <div className="breed-info-label">{t.inference}</div>
                                            <div className="breed-info-value">{result.inference_time_ms} ms</div>
                                        </div>
                                    </div>

                                    {/* Localised description */}
                                    {(() => {
                                        const localDesc = getBreedDescription(result.predicted_breed, selectedLang);
                                        const displayDesc = localDesc || result.breed_info.description;
                                        return displayDesc ? (
                                            <div className="breed-local-desc">
                                                {selectedLang !== 'en' && (
                                                    <div className="breed-local-badge">
                                                        {LANGUAGES.find(l => l.code === selectedLang)?.flag}{' '}
                                                        {LANGUAGES.find(l => l.code === selectedLang)?.name}
                                                    </div>
                                                )}
                                                <p>{displayDesc}</p>
                                            </div>
                                        ) : null;
                                    })()}
                                </>
                            )}

                                    {/* Warning */}
                                    {result.warning && (
                                        <div className="prediction-warning">⚠️ {result.warning}</div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* History */}
                    {!result && !loading && history.length > 0 && (
                        <div className="glass-card">
                            <h4 style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>Recent Predictions</h4>
                            {history.slice(0, 5).map((entry) => (
                                <div key={entry.id} className="topk-item">
                                    <span className="topk-name">{entry.predictedBreed}</span>
                                    <span className="topk-conf">
                                        {(entry.confidence * 100).toFixed(1)}% · {new Date(entry.timestamp).toLocaleDateString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default PredictPage;
