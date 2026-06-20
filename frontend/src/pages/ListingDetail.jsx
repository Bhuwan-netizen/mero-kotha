import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { MapPin, Calendar, User, Phone, ArrowLeft, Heart, Smartphone } from 'lucide-react';

const ListingDetail = () => {
  const { id } = useParams();
  const { API_URL } = useContext(AuthContext);
  const navigate = useNavigate();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    const fetchListingDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/listings/${id}`);
        const data = await res.json();

        if (data.success) {
          setListing(data.data);
        } else {
          setError(data.message || 'Property not found');
        }
      } catch (err) {
        console.error(err);
        setError('Failed to connect to the server');
      } finally {
        setLoading(false);
      }
    };

    fetchListingDetail();
  }, [id, API_URL]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '5px solid var(--primary-light)',
          borderTop: '5px solid var(--primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Fetching space details...</p>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="container" style={{ marginTop: '4rem', textAlign: 'center' }}>
        <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '2rem', borderRadius: 'var(--radius-md)', maxWidth: '500px', margin: '0 auto' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Error Loading Details</h3>
          <p>{error || 'The listing you are looking for does not exist.'}</p>
          <button onClick={() => navigate('/')} className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const { title, description, ward, location, price, images, contactName, contactPhone, createdAt, isNegotiable } = listing;

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
  const hasImages = images && images.length > 0;
  
  // Format price
  const formattedPrice = new Intl.NumberFormat('en-NP').format(price);
  
  // Format date
  const formattedDate = new Date(createdAt).toLocaleDateString('en-NP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="container" style={{ marginTop: '2rem' }}>
      
      {/* Back button link */}
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '1.5rem' }}>
        <ArrowLeft size={16} />
        Back to listings
      </Link>

      <h1 style={{ fontSize: '2.2rem', color: 'var(--primary-dark)', marginBottom: '0.5rem', lineHeight: 1.2 }}>
        {title}
      </h1>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <span className="ward-badge-pill">Ward {ward}</span>
        <span>•</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <MapPin size={14} />
          {location}, Birtamode
        </span>
        <span>•</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <Calendar size={14} />
          Listed on {formattedDate}
        </span>
      </div>

      {/* Detail Grid */}
      <div className="detail-grid">
        
        {/* Left Column: Image Gallery & Description */}
        <div className="detail-gallery">
          
          {/* Main Display Image */}
          <div className="main-image-container">
            <img
              src={hasImages ? `${backendUrl}${images[activeImageIndex]}` : 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=80'}
              alt={title}
              className="main-image"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=80';
              }}
            />
          </div>

          {/* Thumbnail Gallery (shows up if user uploaded multiple images) */}
          {hasImages && images.length > 1 && (
            <div className="thumbnail-row">
              {images.map((imgUrl, index) => (
                <div
                  key={index}
                  className={`thumbnail-container ${index === activeImageIndex ? 'active' : ''}`}
                  onClick={() => setActiveImageIndex(index)}
                >
                  <img
                    src={`${backendUrl}${imgUrl}`}
                    alt={`${title} Thumbnail ${index + 1}`}
                    className="thumbnail-img"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Room Description details */}
          <div className="detail-desc" style={{ marginTop: '2rem', background: 'white', padding: '2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <h3 style={{ borderBottom: '2px solid var(--primary-light)', paddingBottom: '0.5rem', color: 'var(--primary-dark)' }}>
              Description & Amenities
            </h3>
            <p style={{ marginTop: '1rem', whiteSpace: 'pre-line', fontSize: '1.05rem', color: 'var(--text-main)' }}>
              {description}
            </p>
          </div>

        </div>

        {/* Right Column: Price & Contact Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="detail-info">
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>
              Monthly Rent
            </p>
            <div className="detail-price" style={{ fontSize: isNegotiable && price <= 0 ? '1.8rem' : '2.2rem' }}>
              {isNegotiable ? (
                price > 0 ? (
                  <>Rs. {formattedPrice} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>(Negotiable)</span></>
                ) : (
                  'Negotiable'
                )
              ) : (
                <>Rs. {formattedPrice} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>/ month</span></>
              )}
            </div>

            <div className="detail-meta">
              <div className="meta-item">
                <MapPin size={18} />
                <span>Birtamode, Ward {ward}</span>
              </div>
              <div className="meta-item">
                <User size={18} />
                <span>Verified Owner</span>
              </div>
            </div>

            <div className="detail-contact">
              <h3 style={{ color: 'var(--primary-dark)', marginBottom: '1rem' }}>Interested? Contact Owner</h3>
              <div className="contact-card">
                <div className="contact-row" style={{ fontSize: '1.1rem', color: 'var(--primary-dark)', marginBottom: '1rem' }}>
                  <User size={18} />
                  <span>{contactName}</span>
                </div>

                <div className="contact-row" style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>
                  <Smartphone size={20} />
                  <a href={`tel:${contactPhone}`} style={{ color: 'var(--primary)', fontWeight: 700 }}>
                    {contactPhone}
                  </a>
                </div>

                <a href={`tel:${contactPhone}`} className="btn btn-primary" style={{ width: '100%', textDecoration: 'none' }}>
                  <Phone size={16} />
                  Call Owner Now
                </a>
              </div>
            </div>
          </div>

          {/* Quick Info Box */}
          <div style={{ background: '#F8FAF6', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)', padding: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <h4 style={{ color: 'var(--text-main)', marginBottom: '0.5rem', fontWeight: 600 }}>Safety Tips for Renters</h4>
            <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <li>Always visit the rental room/flat in person before making any payments.</li>
              <li>Confirm water supply, electricity meters, and waste management with the owner.</li>
              <li>Ask about lease agreements or advance payments clearly.</li>
            </ul>
          </div>

        </div>

      </div>

    </div>
  );
};

export default ListingDetail;
