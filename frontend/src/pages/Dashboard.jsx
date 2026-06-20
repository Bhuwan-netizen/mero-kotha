import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Plus, Trash2, Eye, Home, AlertCircle, Edit } from 'lucide-react';

const Dashboard = () => {
  const { user, token, API_URL } = useContext(AuthContext);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);

  const fetchMyListings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/listings/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (data.success) {
        setListings(data.data);
      } else {
        setError(data.message || 'Failed to retrieve listings');
      }
    } catch (err) {
      console.error(err);
      setError('Connection failed. Make sure server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMyListings();
    }
  }, [token]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      return;
    }

    setDeleteLoading(id);
    try {
      const res = await fetch(`${API_URL}/listings/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (data.success) {
        // Remove from local state
        setListings(listings.filter((l) => l._id !== id));
      } else {
        alert(data.message || 'Failed to delete listing');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to connect to the server');
    } finally {
      setDeleteLoading(null);
    }
  };

  return (
    <div className="container" style={{ marginTop: '2.5rem' }}>
      {/* Dashboard Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 style={{ fontSize: '2rem', color: 'var(--primary-dark)', marginBottom: '0.25rem' }}>
            Owner Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Welcome back, <strong>{user?.name}</strong>. Manage your listed rental spaces here.
          </p>
        </div>

        <Link to="/create-listing" className="btn btn-primary">
          <Plus size={18} />
          Create New Listing
        </Link>
      </div>

      {error && (
        <div style={{ padding: '1.5rem', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', borderRadius: 'var(--radius-md)', display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '2rem' }}>
          <AlertCircle size={20} />
          <p>{error}</p>
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
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading your rooms...</p>
        </div>
      ) : listings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <Home size={48} color="var(--primary)" style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
          <h3 style={{ marginBottom: '0.5rem' }}>No Rooms Listed Yet</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto', marginBottom: '1.5rem' }}>
            You haven't listed any rooms, flats, or commercial spaces in Birtamode. Click the button below to post your first listing!
          </p>
          <Link to="/create-listing" className="btn btn-primary">
            Post Your First Room
          </Link>
        </div>
      ) : (
        <div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--text-main)' }}>
            Your Listings ({listings.length})
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {listings.map((listing) => {
              const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
              const thumbImage = listing.images && listing.images.length > 0
                ? `${backendUrl}${listing.images[0]}`
                : 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=150&q=80';

              return (
                <div key={listing._id} style={{ display: 'flex', gap: '1.5rem', background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1rem', alignItems: 'center', flexWrap: 'wrap', transition: 'var(--transition)' }}>
                  <img
                    src={thumbImage}
                    alt={listing.title}
                    style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', backgroundColor: '#F1F5F9' }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=150&q=80';
                    }}
                  />

                  <div style={{ flexGrow: 1, minWidth: '200px' }}>
                    <h3 style={{ fontSize: '1.1rem', color: 'var(--primary-dark)', marginBottom: '0.25rem' }}>
                      {listing.title}
                    </h3>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      <span>Ward {listing.ward}</span>
                      <span>•</span>
                      <span>{listing.location}</span>
                      <span>•</span>
                      <strong style={{ color: 'var(--primary)' }}>
                        {listing.isNegotiable ? (
                          listing.price > 0 ? (
                            `Rs. ${new Intl.NumberFormat('en-NP').format(listing.price)} (Neg.)`
                          ) : (
                            'Negotiable'
                          )
                        ) : (
                          `Rs. ${new Intl.NumberFormat('en-NP').format(listing.price)}/m`
                        )}
                      </strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <Link to={`/listings/${listing._id}`} className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                      <Eye size={16} />
                      View
                    </Link>

                    <Link to={`/edit-listing/${listing._id}`} className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', borderColor: 'var(--primary)', color: 'var(--primary)' }}>
                      <Edit size={16} />
                      Edit
                    </Link>

                    <button
                      onClick={() => handleDelete(listing._id)}
                      className="btn btn-danger"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                      disabled={deleteLoading === listing._id}
                    >
                      <Trash2 size={16} />
                      {deleteLoading === listing._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
