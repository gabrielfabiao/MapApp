import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from '../common/Logo';

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { error: authError } = mode === 'signin'
        ? await signIn(email, password)
        : await signUp(email, password);
      if (authError) throw authError;
      navigate('/');
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
      <Logo size={40} />

      <form className="modal" style={{ transform: 'none', width: '360px' }} onSubmit={handleSubmit}>
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--amazon-dark)' }}>
          {mode === 'signin' ? 'Log In' : 'Create Account'}
        </h2>

        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            type="email"
            className="search-input"
            style={{ paddingLeft: '1rem' }}
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="search-input"
            style={{ paddingLeft: '1rem' }}
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>

        {error && (
          <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>
        )}

        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: '1rem' }} disabled={submitting}>
          {submitting ? 'Please wait…' : mode === 'signin' ? 'Log In' : 'Sign Up'}
        </button>

        <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <span
            style={{ color: 'var(--amazon-primary)', fontWeight: 700, cursor: 'pointer' }}
            onClick={() => { setError(''); setMode(mode === 'signin' ? 'signup' : 'signin'); }}
          >
            {mode === 'signin' ? 'Sign Up' : 'Log In'}
          </span>
        </p>
      </form>
    </div>
  );
}
