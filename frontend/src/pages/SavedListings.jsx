import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ListingCard from '../components/ListingCard';
import { Heart } from 'lucide-react';

const SavedListings = () => {
  const { fetchSavedListings, savedIds } = useContext(AuthContext);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const data = await fetchSavedListings();
      if (active) {
        setListings(data);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the displayed list in sync when a card is un-saved on this page.
  const visible = listings.filter((l) => savedIds.includes(l._id));

  return (
    <div className="container" style={{ marginTop: '2.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', color: 'var(--primary-dark)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Heart size={24} fill="var(--primary)" color="var(--primary)" />
          Saved Listings
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Rooms and flats you've bookmarked. Tap the heart on any listing to add or remove it.
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '30vh', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            width: '40px', height: '40px',
            border: '4px solid var(--primary-light)', borderTop: '4px solid var(--primary)',
            borderRadius: '50%', animation: 'spin 1s linear infinite',
          }}></div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading your saved listings...</p>
        </div>
      ) : visible.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <Heart size={48} color="var(--primary)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <h3 style={{ marginBottom: '0.5rem' }}>No saved listings yet</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>
            Browse rooms across Jhapa and tap the heart icon to save the ones you like for later.
          </p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
            Browse Rooms
          </Link>
        </div>
      ) : (
        <div className="listings-grid">
          {visible.map((listing) => (
            <ListingCard key={listing._id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedListings;
