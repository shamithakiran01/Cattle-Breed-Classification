import { Link } from 'react-router-dom';

function HomePage() {
    return (
        <div className="page" style={{ padding: '0', maxWidth: '100%' }}>
            {/* Commercial Hero Section */}
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
                <section className="hero-commercial">
                    <div className="hero-commercial-content">
                        <h1>
                            Identify Your <span className="accent">Cattle Breed</span> Instantly
                        </h1>
                        <p>
                            AI-powered breed classification for 26 indigenous Indian cattle and buffalo breeds.
                            Enhance your dairy farm management with accurate, instant identification and detailed metadata.
                        </p>
                        <Link to="/predict">
                            <button className="hero-cta">
                                🔍 Start Classifying
                            </button>
                        </Link>
                    </div>
                    <div className="hero-commercial-image">
                        <img src="/hero_cattle.png" alt="Healthy Indian Cow in a farm" />
                    </div>
                </section>
            </div>

            {/* Features Section */}
            <section className="features-section">
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div className="features-header">
                        <h2 className="section-title">Built for Modern Agriculture</h2>
                        <p className="section-subtitle">Powerful tools designed for farmers, researchers, and dairy businesses.</p>
                    </div>
                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon-wrapper">📸</div>
                            <h3>Multiple Input Modes</h3>
                            <p>Upload images, capture directly from your camera, or paste a URL. Works seamlessly on any device with a browser.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon-wrapper">🐃</div>
                            <h3>Comprehensive Database</h3>
                            <p>Accurately classifies 26 major indigenous cow and buffalo breeds from across India with verified agricultural metadata.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon-wrapper">📋</div>
                            <h3>Actionable Insights</h3>
                            <p>Get detailed metadata including region of origin, average milk yield, lifespan, primary use, and physical characteristics.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon-wrapper">🌐</div>
                            <h3>Multi-Language Support</h3>
                            <p>View breed information and classifications in English, Hindi, Telugu, Tamil, Kannada, and Marathi.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon-wrapper">⚡</div>
                            <h3>Lightning Fast</h3>
                            <p>Sub-second predictions with clear confidence scores. Know exactly when you can trust the machine learning result.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon-wrapper">🧠</div>
                            <h3>Advanced AI</h3>
                            <p>Powered by cutting-edge Vision Transformers and deep learning models to ensure maximum accuracy in all conditions.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default HomePage;
