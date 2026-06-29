import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Phone } from 'lucide-react';

const Footer = ({ onOpenDonation }) => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <h3>mero <span>kotha</span></h3>
            <p>
              Your local rental partner across Jhapa, Nepal. Finding and listing rooms, flats, and houses has never been this simple and aesthetic.
            </p>
          </div>

          <div className="footer-links">
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="/">Browse Rooms</Link></li>
              <li><Link to="/login">Owner Login</Link></li>
              <li><Link to="/register">Owner Register</Link></li>
              <li>
                <a
                  href="tel:9815910188"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Phone size={14} />
                  {'डेभलपर / Developer: 9815910188'}
                </a>
              </li>
            </ul>
          </div>

          <div className="footer-links" style={{ gridColumn: 'span 1' }}>
            <h4>Support Project</h4>
            <div className="support-banner" onClick={onOpenDonation} style={{ cursor: 'pointer' }}>
              <div className="support-text">
                <h4>Support Mero Kotha</h4>
                <p>Keep this project free and help us maintain it. Donate via eSewa.</p>
              </div>
              <button className="btn btn-esewa" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                Donate
              </button>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
            © {new Date().getFullYear()} Mero Kotha. Made with <Heart size={14} color="var(--primary)" fill="var(--primary)" /> for Jhapa, Nepal.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
