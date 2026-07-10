import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MapPin, User, ArrowRight, Heart, BedDouble, Bath } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { cldImg, IMG } from '../utils/cloudinary';

const ListingCard = ({ listing }) => {
  const {
    _id, title, description, municipality, ward, location, price, images,
    contactName, isNegotiable, propertyType, bedrooms, bathrooms, furnishing,
  } = listing;

  const { user, isSaved, toggleSave } = useContext(AuthContext);
  const routerLocation = useLocation();

  // Format price with thousands separator
  const formattedPrice = new Intl.NumberFormat('en-NP', {
    maximumFractionDigits: 0
  }).format(price);

  // Set default placeholder image if no images exist
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
  // Cloudinary images are absolute URLs; older /uploads paths get the backend prefix
  const resolveImg = (img) => (img && img.startsWith('http') ? img : `${backendUrl}${img}`);
  // Serve a small, auto-format card image instead of the full ~1200px original.
  const mainImage = images && images.length > 0
    ? cldImg(resolveImg(images[0]), IMG.card)
    : 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80'; // high quality placeholder room

  // Render price display dynamically
  const renderPriceBadge = () => {
    if (isNegotiable) {
      if (price > 0) {
        return `Rs. ${formattedPrice} (Neg.)`;
      }
      return 'Negotiable';
    }
    return `Rs. ${formattedPrice} /m`;
  };

  // Shorten the municipality name for the badge (drop the suffix)
  const shortMuni = (municipality || '')
    .replace(' Rural Municipality', '')
    .replace(' Municipality', '');

  const saved = isSaved ? isSaved(_id) : false;

  const handleSave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSave(_id);
  };

  return (
    <div className="listing-card">
      <div className="card-img-wrapper">
        <img src={mainImage} alt={title} className="card-img" onError={(e) => {
          e.target.onerror = null;
          e.target.src = 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80';
        }} />
        <span className="card-badge">{shortMuni ? `${shortMuni} • W${ward}` : `Ward ${ward}`}</span>
        <span className="card-price" style={{ fontSize: isNegotiable && price <= 0 ? '0.9rem' : '1.1rem', padding: '0.4rem 0.75rem' }}>
          {renderPriceBadge()}
        </span>

        {/* Save / favorite heart (only for logged-in users) */}
        {user && (
          <button
            type="button"
            className={`card-save-btn ${saved ? 'saved' : ''}`}
            onClick={handleSave}
            title={saved ? 'Remove from saved' : 'Save listing'}
            aria-label={saved ? 'Remove from saved' : 'Save listing'}
          >
            <Heart size={18} fill={saved ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>

      <div className="card-body">
        {/* Property type + quick specs */}
        <div className="card-tags">
          {propertyType && <span className="card-type-tag">{propertyType}</span>}
          {bedrooms > 0 && (
            <span className="card-spec"><BedDouble size={13} /> {bedrooms}</span>
          )}
          {bathrooms > 0 && (
            <span className="card-spec"><Bath size={13} /> {bathrooms}</span>
          )}
          {furnishing && <span className="card-spec">{furnishing}</span>}
        </div>

        <h3 className="card-title">{title}</h3>

        <div className="card-location">
          <MapPin size={14} />
          <span>{location}{municipality ? `, ${shortMuni}` : ''}</span>
        </div>

        <p className="card-description">{description}</p>

        <div className="card-footer">
          <div className="card-owner">
            <User size={14} color="var(--primary)" />
            <span>{contactName}</span>
          </div>

          <Link
            to={`/listings/${_id}`}
            state={{ from: `${routerLocation.pathname}${routerLocation.search}` }}
            className="btn btn-outline"
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', gap: '0.25rem' }}
          >
            Details
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ListingCard;
