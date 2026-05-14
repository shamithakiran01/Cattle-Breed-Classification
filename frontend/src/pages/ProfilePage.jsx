import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePredictionHistory } from '../hooks/usePredictionHistory';

function ProfilePage() {
  const { user, logout, loading } = useAuth();
  const { history, clearHistory } = usePredictionHistory();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="page" style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '2rem' }}>
      <h2 className="section-title">My Profile</h2>
      
      <div className="predict-layout" style={{ gridTemplateColumns: '1fr', gap: '2rem' }}>
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{user.username}</h3>
              <p style={{ color: 'var(--color-text-secondary)' }}>{user.email}</p>
            </div>
            <button onClick={handleLogout} className="btn-secondary" style={{ borderColor: '#ef4444', color: '#ef4444' }}>
              Logout
            </button>
          </div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem' }}>Recent Classifications</h3>
            {history.length > 0 && (
              <button onClick={clearHistory} className="btn-secondary" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
                Clear History
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '2rem 0' }}>
              You haven't classified any images yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {history.map((entry) => (
                <div key={entry.id} className="topk-item" style={{ display: 'grid', gridTemplateColumns: '60px 1fr auto', gap: '1rem', alignItems: 'center', padding: '0.75rem' }}>
                  <img src={entry.image} alt="Thumbnail" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} />
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{entry.predictedBreed}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                      {(entry.confidence * 100).toFixed(1)}% Confidence
                    </div>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', textAlign: 'right' }}>
                    {new Date(entry.timestamp).toLocaleDateString()}
                    <br />
                    {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
