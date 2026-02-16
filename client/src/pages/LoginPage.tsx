import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { LayoutDashboard, Mail, Lock, User, ArrowRight, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const { login, signup, token, isLoading, error, clearError } = useAuthStore();
  const addToast = useToastStore((s) => s.addToast);
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  if (token) return <Navigate to="/" />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignup) {
      await signup(email, name, password);
      addToast('Account created successfully!', 'success');
    } else {
      await login(email, password);
      addToast('Welcome back!', 'success');
    }
  };

  const fillDemo = () => {
    setEmail('demo@example.com');
    setPassword('password123');
    setIsSignup(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />
      </div>
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <LayoutDashboard size={32} />
              <span>TaskFlow</span>
            </div>
            <p className="auth-subtitle">
              {isSignup ? 'Create your account' : 'Welcome back'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="auth-error">{error}</div>}

            <div className="input-group">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                id="email-input"
              />
            </div>

            {isSignup && (
              <div className="input-group">
                <User size={18} className="input-icon" />
                <input
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  id="name-input"
                />
              </div>
            )}

            <div className="input-group">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                id="password-input"
              />
            </div>

            <button type="submit" className="auth-btn" disabled={isLoading} id="auth-submit">
              {isLoading ? (
                <div className="spinner-sm" />
              ) : (
                <>
                  {isSignup ? 'Create Account' : 'Sign In'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <button
              className="auth-toggle"
              onClick={() => { setIsSignup(!isSignup); clearError(); }}
              id="auth-toggle"
            >
              {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>

            {!isSignup && (
              <button className="demo-btn" onClick={fillDemo} id="demo-fill">
                <Sparkles size={14} />
                Use demo credentials
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
