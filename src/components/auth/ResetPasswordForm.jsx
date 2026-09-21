'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase/browser';
import Logo from '../common/Logo';

export default function ResetPasswordForm() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // The recovery link authenticates the browser client via the URL hash
    // as soon as it loads; give it a moment before letting the user submit.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setError('This password reset link is invalid or has expired. Please request a new one.');
      }
      setReady(true);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const { error: authError } = await supabase.auth.updateUser({ password });
      if (authError) throw authError;
      router.push('/');
      router.refresh();
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
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--amazon-dark)' }}>Set a New Password</h2>

        <div className="form-group">
          <label className="form-label">New Password</label>
          <input
            type="password"
            className="search-input"
            style={{ paddingLeft: '1rem' }}
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            autoFocus
            disabled={!ready}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Confirm New Password</label>
          <input
            type="password"
            className="search-input"
            style={{ paddingLeft: '1rem' }}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            disabled={!ready}
          />
        </div>

        {error && (
          <p role="alert" style={{ color: 'var(--danger-text)', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center' }}
          disabled={!ready || submitting}
        >
          {submitting ? 'Please wait…' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}
