import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, User, ArrowRight } from 'lucide-react';

const ListingCard = ({ listing }) => {
  const { _id, title, description, ward, location, price, images, contactName, isNegotiable } = listing;
  
  // Format price with thousands separator
  const formattedPrice = new Intl.NumberFormat('en-NP', {
    maximumFractionDigits: 0
  }).format(price);

  // Set default placeholder image if no images exist
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
  // Cloudinary images are absolute URLs; older /uploads paths get the backend prefix
  const resolveImg = (img) => (img && img.startsWith('http') ? img : `${backendUrl}${img}`);
  const mainImage = images && images.length > 0
    ? resolveImg(images[0])
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

  return (
    <div className="listing-card">
      <div className="card-img-wrapper">
        <img src={mainImage} alt={title} className="card-img" onError={(e) => {
          e.target.onerror = null;
          e.target.src = 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80';
        }} />
        <span className="card-badge">Ward {ward}</span>
        <span className="card-price" style={{ fontSize: isNegotiable && price <= 0 ? '0.9rem' : '1.1rem', padding: '0.4rem 0.75rem' }}>
          {renderPriceBadge()}
        </span>
      </div>

      <div className="card-body">
        <h3 className="card-title">{title}</h3>
        
        <div className="card-location">
          <MapPin size={14} />
          <span>{location}</span>
        </div>

        <p className="card-description">{description}</p>

        <div className="card-footer">
          <div className="card-owner">
            <User size={14} color="var(--primary)" />
            <span>{contactName}</span>
          </div>

          <Link to={`/listings/${_id}`} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', gap: '0.25rem' }}>
            Details
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ListingCard;
