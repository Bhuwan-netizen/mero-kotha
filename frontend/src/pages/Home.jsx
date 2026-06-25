import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import ListingCard from '../components/ListingCard';
import { Search, MapPin, SlidersHorizontal, RefreshCw } from 'lucide-react';

const Home = () => {
  const { API_URL } = useContext(AuthContext);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWard, setSelectedWard] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Fetch listings from server
  const fetchListings = async () => {
    setLoading(true);
    setError(null);
    try {
      // Build query string
      const params = new URLSearchParams();
      if (selectedWard) params.append('ward', selectedWard);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (searchTerm) params.append('search', searchTerm);

      const res = await fetch(`${API_URL}/listings?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setListings(data.data);
      } else {
        setError(data.message || 'Failed to fetch rooms');
      }
    } catch (err) {
      console.error(err);
      setError('Could not connect to the server. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [selectedWard]); // Auto-refetch when ward changes, for others user clicks "Search" or we debounced, but a "Filter" button or trigger is good.

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchListings();
  };

  const handleReset = () => {
    setSearchTerm('');
    setSelectedWard('');
    setMinPrice('');
    setMaxPrice('');
    // We fetch again with empty parameters
    setLoading(true);
    fetch(`${API_URL}/listings`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setListings(data.data);
        setLoading(false);
      })
      .catch((err) => {
        setError('Connection error');
        setLoading(false);
      });
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <h1 className="hero-title">
            Find Your Next <span>Kotha</span> in Birtamode
          </h1>
          <p className="hero-subtitle">
            Explore verified rooms, flats, and houses for rent across Ward 1 to 10 in Birtamode, Jhapa, Nepal.
          </p>
          {loading && (
            <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary)', marginTop: '1rem' }}>
              Please wait while the items are loaded.
            </p>
          )}
        </div>
      </section>

      <div className="container">
        {/* Search & Filter Form */}
        <form onSubmit={handleSearchSubmit} className="filters-wrapper">
          <div className="filter-grid">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="search">Search Keywords</label>
              <div style={{ position: 'relative' }}>
                <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  id="search"
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="e.g. flat, room, Muktichowk, kitchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="ward">Select Ward</label>
              <select
                id="ward"
                className="form-control"
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
              >
                <option value="">All Wards (1 - 10)</option>
                {[...Array(10)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Ward {i + 1}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Price Range (NPR)</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="number"
                  placeholder="Min"
                  className="form-control"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
                <span style={{ color: 'var(--text-muted)' }}>-</span>
                <input
                  type="number"
                  placeholder="Max"
                  className="form-control"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" style={{ flexGrow: 1 }}>
                <SlidersHorizontal size={16} />
                Filter
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="btn btn-outline"
                title="Reset Filters"
                style={{ padding: '0.75rem' }}
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
        </form>

        {/* Listings Display */}
        <div className="listings-header">
          <h2 style={{ fontSize: '1.5rem', color: 'var(--primary-dark)' }}>
            Available Spaces
          </h2>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 500 }}>
            {listings.length} {listings.length === 1 ? 'space' : 'spaces'} found
          </span>
        </div>

        {error && (
          <div style={{ padding: '2rem', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', borderRadius: 'var(--radius-md)', textAlign: 'center', marginBottom: '2rem' }}>
            <p style={{ fontWeight: 600 }}>{error}</p>
            <button onClick={fetchListings} className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Try Again
            </button>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '30vh', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid var(--primary-light)',
              borderTop: '4px solid var(--primary)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Searching properties...</p>
          </div>
        ) : listings.length === 0 ? (
          <div style={{ textAlignment: 'center', padding: '4rem 2rem', background: 'white', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', textAlign: 'center' }}>
            <MapPin size={48} color="var(--primary)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <h3 style={{ marginBottom: '0.5rem' }}>No Rooms Found</h3>
            <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>
              We couldn't find any rooms matching your criteria. Try switching wards or resetting filters to see more.
            </p>
            <button onClick={handleReset} className="btn btn-secondary" style={{ marginTop: '1.5rem' }}>
              View All Listings
            </button>
          </div>
        ) : (
          <div className="listings-grid">
            {listings.map((listing) => (
              <ListingCard key={listing._id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;