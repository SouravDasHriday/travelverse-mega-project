import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const CATEGORIES = ['Adventure', 'Beach', 'City', 'Culture', 'Food', 'Nature', 'Backpacking'];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-lg border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🌍</span>
            <span className="font-display text-xl font-bold text-gradient">TravelVerse</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">Explore</Link>
            {user && (
              <>
                <Link to="/create-post" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">+ New Post</Link>
                <Link to="/my-posts" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">My Posts</Link>
                {user.role === 'admin' && (
                  <Link to="/admin" className="text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors">Admin</Link>
                )}
              </>
            )}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-400">
                  👋 <span className="text-white font-medium">{user.username}</span>
                </span>
                <button onClick={handleLogout} className="btn-secondary text-sm py-2 px-4">
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn-secondary text-sm py-2 px-4">Sign In</Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-4">Join Free</Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-slate-400 hover:text-white"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden py-4 border-t border-white/5 flex flex-col gap-3">
            <Link to="/" className="text-slate-300 text-sm" onClick={() => setMenuOpen(false)}>Explore</Link>
            {user ? (
              <>
                <Link to="/create-post" className="text-slate-300 text-sm" onClick={() => setMenuOpen(false)}>+ New Post</Link>
                <Link to="/my-posts" className="text-slate-300 text-sm" onClick={() => setMenuOpen(false)}>My Posts</Link>
                {user.role === 'admin' && (
                  <Link to="/admin" className="text-emerald-400 text-sm" onClick={() => setMenuOpen(false)}>Admin Panel</Link>
                )}
                <button onClick={handleLogout} className="btn-secondary text-sm py-2 w-full">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary text-sm py-2 text-center" onClick={() => setMenuOpen(false)}>Sign In</Link>
                <Link to="/register" className="btn-primary text-sm py-2 text-center" onClick={() => setMenuOpen(false)}>Join Free</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
