'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase/browser';
import Logo from '../common/Logo';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      if (mode === 'forgot') {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (authError) throw authError;
        setMessage('Check your email for a password reset link.');
        return;
      }

      const { error: authError } = mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
      if (authError) throw authError;
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = (next) => {
    setError('');
    setMessage('');
    setMode(next);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
      <Logo size={40} />

      <form className="modal" style={{ transform: 'none', width: '360px' }} onSubmit={handleSubmit}>
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--amazon-dark)' }}>
          {mode === 'signin' ? 'Log In' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
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

        {mode !== 'forgot' && (
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
        )}

        {mode === 'signin' && (
          <p style={{ textAlign: 'right', fontSize: '0.8rem', marginBottom: '1rem' }}>
            <button type="button" className="link-btn" onClick={() => switchMode('forgot')}>
              Forgot your password?
            </button>
          </p>
        )}

        {error && (
          <p role="alert" style={{ color: 'var(--danger-text)', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>
        )}

        {message && (
          <p style={{ color: 'var(--amazon-primary)', fontSize: '0.85rem', marginBottom: '1rem' }}>{message}</p>
        )}

        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: '1rem' }} disabled={submitting}>
          {submitting
            ? 'Please wait…'
            : mode === 'signin' ? 'Log In' : mode === 'signup' ? 'Sign Up' : 'Send Reset Link'}
        </button>

        <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {mode === 'forgot' ? (
            <button type="button" className="link-btn" onClick={() => switchMode('signin')}>
              Back to Log In
            </button>
          ) : (
            <>
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button type="button" className="link-btn" onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}>
                {mode === 'signin' ? 'Sign Up' : 'Log In'}
              </button>
            </>
          )}
        </p>
      </form>
    </div>
  );
}
