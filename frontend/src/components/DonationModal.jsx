import React from 'react';
import { X, Smartphone, CheckCircle, Info } from 'lucide-react';
import esewaQr from '../assets/esewa-qr.png';

const DonationModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        <div style={{ textAlign: 'center' }}>
          <div className="esewa-logo-modal">eSewa</div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
            Support the Developer
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Mero Kotha is a free community service. Your support helps pay for server hosting and updates!
          </p>

          <div className="esewa-details">
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              eSewa ID / Phone Number
            </p>
            <div className="esewa-number">9815910188</div>
            <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '0.25rem' }}>
              Name: Bhuwan Sangroula
            </p>
          </div>

          <div className="qr-placeholder" style={{ padding: '1rem' }}>
            <img
              src={esewaQr}
              alt="eSewa QR code for Bhuwan Sangroula, 9815910188"
              style={{ width: '180px', height: '180px', objectFit: 'contain', borderRadius: 'var(--radius-sm)', marginBottom: '0.5rem' }}
            />
            <span style={{ fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Smartphone size={16} color="var(--esewa)" />
              Scan via eSewa App
            </span>
            <span style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>eSewa Send Money Option</span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', textAlign: 'left', background: 'var(--esewa-light)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(96, 187, 70, 0.15)', fontSize: '0.8rem' }}>
            <Info size={24} color="var(--esewa)" style={{ flexShrink: 0 }} />
            <p style={{ color: 'var(--text-main)' }}>
              Open your <strong>eSewa</strong> app, select <strong>Send Money</strong>, enter the number above, choose the amount, write <strong>"Mero Kotha Support"</strong> in purpose, and submit!
            </p>
          </div>

          <button className="btn btn-esewa" onClick={onClose} style={{ marginTop: '1.5rem', width: '100%' }}>
            Done / Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DonationModal;
