import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Phone, AlertTriangle } from 'lucide-react';

// Shown automatically when a logged-in user has no phone number on file
// (e.g. they just signed up with Google). Listings need a contact phone.
const PhonePromptModal = () => {
  const { updatePhone } = useContext(AuthContext);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!phone.trim()) {
      setError('Please enter your contact phone number');
      return;
    }

    setIsSubmitting(true);
    const result = await updatePhone(phone.trim());
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.message || 'Could not save phone number');
    }
    // On success the modal disappears automatically (user.phone is now set)
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ textAlign: 'center' }}>
          <Phone size={40} color="var(--primary)" style={{ marginBottom: '0.75rem' }} />
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
            One last step
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Add a contact phone number so renters can reach you about your listings.
          </p>
        </div>

        {error && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="prompt-phone">Contact Number (Phone)</label>
            <div style={{ position: 'relative' }}>
              <Phone size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="tel"
                id="prompt-phone"
                className="form-control"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="e.g. 98XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoFocus
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PhonePromptModal;
