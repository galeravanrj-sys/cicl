import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../utils/apiBase';

const ResetPassword = () => {
  const [token, setToken] = useState('');
  const [valid, setValid] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token') || '';
    setToken(t);
    if (!t) {
      setError('Missing reset token. Check your email link.');
      return;
    }
    (async () => {
      try {
        setError('');
        const res = await axios.get(`${API_BASE}/auth/reset-password/validate`, { params: { token: t } });
        if (res.data?.valid) setValid(true);
      } catch (err) {
        setError(err.response?.data?.message || 'Invalid or expired token.');
      }
    })();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!token) {
      setError('Missing token.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setIsSubmitting(true);
      await axios.post(`${API_BASE}/auth/reset-password`, { token, newPassword });
      setMessage('Password reset successful. You can now log in.');
      setValid(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 420, marginTop: 40 }}>
      <h2>Reset Password</h2>
      {message && <div className="alert alert-success" role="alert">{message}</div>}
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {valid ? (
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">New Password</label>
            <input
              type="password"
              className="form-control"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              className="form-control"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      ) : (
        !message && (
          <p className="text-muted">If your token is valid, the form will appear.</p>
        )
      )}
    </div>
  );
};

export default ResetPassword;