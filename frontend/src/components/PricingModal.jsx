import React, { useState, useEffect, useContext } from 'react';
import { X, Home, Search, BadgePercent, Phone } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

// Formats a numeric price; 0 / unset shows as "Contact us" until the admin
// sets a price from the Admin Panel.
const formatPrice = (value) =>
  value > 0 ? `Rs. ${Number(value).toLocaleString('en-IN')}` : 'Contact us';

const PricingModal = ({ isOpen, onClose }) => {
  const { API_URL } = useContext(AuthContext);
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch(`${API_URL}/pricing`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setPricing(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen, API_URL]);

  if (!isOpen) return null;

  const planRow = (label, value) => (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.6rem 0',
        borderBottom: '1px solid var(--border, #eee)',
      }}
    >
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{value}</span>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.35rem', color: 'var(--text-main)' }}>
            Our Service Pricing
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Simple plans for owners and customers across Jhapa.
          </p>
        </div>

        {loading || !pricing ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem 0' }}>
            Loading pricing...
          </p>
        ) : (
          <>
            {/* Property owner plans */}
            <div style={{ marginBottom: '1.25rem', textAlign: 'left' }}>
              <h3
                style={{
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  color: 'var(--primary-dark)',
                  marginBottom: '0.25rem',
                }}
              >
                <Home size={16} /> For Property Owners (listing service)
              </h3>
              {planRow('Weekly plan', formatPrice(pricing.ownerWeekly))}
              {planRow('Bi-weekly plan', formatPrice(pricing.ownerBiWeekly))}
              {planRow('Monthly plan', formatPrice(pricing.ownerMonthly))}
              {pricing.ownerOffer && (
                <p
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    marginTop: '0.5rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'var(--primary)',
                  }}
                >
                  <BadgePercent size={15} /> {pricing.ownerOffer}
                </p>
              )}
            </div>

            {/* Customer pricing */}
            <div style={{ marginBottom: '1.25rem', textAlign: 'left' }}>
              <h3
                style={{
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  color: 'var(--primary-dark)',
                  marginBottom: '0.25rem',
                }}
              >
                <Search size={16} /> For Customers (viewing / property info)
              </h3>
              {planRow('Per viewing / info', formatPrice(pricing.customerViewingPrice))}
              {pricing.customerOffer && (
                <p
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    marginTop: '0.5rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'var(--primary)',
                  }}
                >
                  <BadgePercent size={15} /> {pricing.customerOffer}
                </p>
              )}
            </div>

            <a
              href="tel:9815910188"
              className="btn btn-primary"
              style={{ width: '100%', textDecoration: 'none', justifyContent: 'center' }}
            >
              <Phone size={16} /> Call us: 9815910188
            </a>
          </>
        )}
      </div>
    </div>
  );
};

export default PricingModal;
