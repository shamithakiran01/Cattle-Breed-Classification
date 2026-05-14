import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PredictPage from './pages/PredictPage';
import BreedExplorerPage from './pages/BreedExplorerPage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <nav className="navbar">
          <div className="navbar-inner">
            <NavLink to="/" className="navbar-brand">
              <span>PashuPehchaan</span>
            </NavLink>
            <ul className="nav-links">
              <li><NavLink to="/" end>Home</NavLink></li>
              <li><NavLink to="/predict">Predict</NavLink></li>
              <li><NavLink to="/breeds">Breeds</NavLink></li>
              <li><NavLink to="/about">About</NavLink></li>
              <AuthNavLinks />
            </ul>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/predict" element={<PredictPage />} />
          <Route path="/breeds" element={<BreedExplorerPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>

        <footer className="footer">
          <p>PashuPehchaan &copy; {new Date().getFullYear()}</p>
        </footer>
      </Router>
    </AuthProvider>
  );
}

function AuthNavLinks() {
  const { user } = useAuth();
  
  if (user) {
    return (
      <li><NavLink to="/profile" className="auth-link">Profile</NavLink></li>
    );
  }
  
  return (
    <li><NavLink to="/login" className="auth-link">Login</NavLink></li>
  );
}

export default App;
