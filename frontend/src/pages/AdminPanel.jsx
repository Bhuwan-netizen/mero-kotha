import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  LayoutDashboard, Home, Users, Trash2, Edit, Eye, AlertCircle,
  Search, ShieldCheck, RefreshCw,
} from 'lucide-react';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const resolveImg = (img) =>
  img ? (img.startsWith('http') ? img : `${backendUrl}${img}`)
      : 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=150&q=80';
const fmt = (n) => new Intl.NumberFormat('en-NP').format(n);
const priceLabel = (l) =>
  l.isNegotiable ? (l.price > 0 ? `Rs. ${fmt(l.price)} (Neg.)` : 'Negotiable') : `Rs. ${fmt(l.price)}/m`;

const StatCard = ({ icon, label, value }) => (
  <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: 'var(--shadow-sm)' }}>
    <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', width: 48, height: 48, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary-dark)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{label}</div>
    </div>
  </div>
);

const AdminPanel = () => {
  const { user, token, API_URL } = useContext(AuthContext);
  const [tab, setTab] = useState('overview');

  const [stats, setStats] = useState(null);
  const [listings, setListings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);

  const authHeaders = { Authorization: `Bearer ${token}` };

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sRes, lRes, uRes] = await Promise.all([
        fetch(`${API_URL}/admin/stats`, { headers: authHeaders }),
        fetch(`${API_URL}/admin/listings`, { headers: authHeaders }),
        fetch(`${API_URL}/admin/users`, { headers: authHeaders }),
      ]);
      const [s, l, u] = await Promise.all([sRes.json(), lRes.json(), uRes.json()]);
      if (s.success) setStats(s.data);
      if (l.success) setListings(l.data);
      if (u.success) setUsers(u.data);
      if (!s.success || !l.success || !u.success) {
        setError(s.message || l.message || u.message || 'Failed to load admin data');
      }
    } catch (err) {
      console.error(err);
      setError('Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const deleteListing = async (id) => {
    if (!window.confirm('Delete this listing permanently? This cannot be undone.')) return;
    setBusyId(id);
    try {
      const res = await fetch(`${API_URL}/listings/${id}`, { method: 'DELETE', headers: authHeaders });
      const data = await res.json();
      if (data.success) {
        setListings((prev) => prev.filter((l) => l._id !== id));
      } else {
        alert(data.message || 'Failed to delete listing');
      }
    } catch {
      alert('Server error while deleting listing');
    } finally {
      setBusyId(null);
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user AND all of their listings permanently? This cannot be undone.')) return;
    setBusyId(id);
    try {
      const res = await fetch(`${API_URL}/admin/users/${id}`, { method: 'DELETE', headers: authHeaders });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) => prev.filter((u) => u._id !== id));
        loadAll(); // refresh listings + stats since their listings are gone
      } else {
        alert(data.message || 'Failed to delete user');
      }
    } catch {
      alert('Server error while deleting user');
    } finally {
      setBusyId(null);
    }
  };

  const filteredListings = listings.filter((l) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      l.title?.toLowerCase().includes(q) ||
      l.location?.toLowerCase().includes(q) ||
      l.contactName?.toLowerCase().includes(q) ||
      l.contactPhone?.toLowerCase().includes(q) ||
      l.owner?.email?.toLowerCase().includes(q)
    );
  });

  const filteredUsers = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.phone?.toLowerCase().includes(q);
  });

  const tabBtn = (key, label, icon) => (
    <button
      onClick={() => setTab(key)}
      className={tab === key ? 'btn btn-primary' : 'btn btn-outline'}
      style={{ padding: '0.5rem 1.1rem', fontSize: '0.9rem' }}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="container" style={{ marginTop: '2.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', color: 'var(--primary-dark)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={26} /> Admin Panel
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Signed in as <strong>{user?.name}</strong> — full control over all listings and users.
          </p>
        </div>
        <button onClick={loadAll} className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {tabBtn('overview', 'Overview', <LayoutDashboard size={16} />)}
        {tabBtn('listings', `Listings (${listings.length})`, <Home size={16} />)}
        {tabBtn('users', `Users (${users.length})`, <Users size={16} />)}
      </div>

      {error && (
        <div style={{ padding: '1.25rem', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', borderRadius: 'var(--radius-md)', display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1.5rem' }}>
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '30vh', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ width: 40, height: 40, border: '4px solid var(--primary-light)', borderTop: '4px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading admin data...</p>
        </div>
      ) : (
        <>
          {/* OVERVIEW */}
          {tab === 'overview' && stats && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <StatCard icon={<Home size={22} />} label="Total Listings" value={fmt(stats.totalListings)} />
                <StatCard icon={<Users size={22} />} label="Registered Users" value={fmt(stats.totalUsers)} />
                <StatCard icon={<ShieldCheck size={22} />} label="Admins" value={fmt(stats.totalAdmins)} />
                <StatCard icon={<LayoutDashboard size={22} />} label="Negotiable Listings" value={fmt(stats.negotiableCount)} />
              </div>

              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
                <h3 style={{ color: 'var(--primary-dark)', marginBottom: '1rem' }}>Listings per Ward</h3>
                {stats.perWard.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No listings yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {stats.perWard.map((w) => {
                      const max = Math.max(...stats.perWard.map((x) => x.count));
                      const pct = max ? (w.count / max) * 100 : 0;
                      return (
                        <div key={w._id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ width: 70, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Ward {w._id}</span>
                          <div style={{ flexGrow: 1, background: 'var(--primary-light)', borderRadius: 6, height: 16, overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: 'var(--primary)' }}></div>
                          </div>
                          <span style={{ width: 30, textAlign: 'right', fontWeight: 700, color: 'var(--primary-dark)' }}>{w.count}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SEARCH BAR for listings/users tabs */}
          {(tab === 'listings' || tab === 'users') && (
            <div style={{ position: 'relative', marginBottom: '1.25rem', maxWidth: 420 }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '2.5rem' }}
                placeholder={tab === 'listings' ? 'Search title, location, owner...' : 'Search name, email, phone...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}

          {/* LISTINGS */}
          {tab === 'listings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filteredListings.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', padding: '2rem', textAlign: 'center' }}>No listings found.</p>
              ) : filteredListings.map((l) => (
                <div key={l._id} style={{ display: 'flex', gap: '1rem', background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.85rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <img src={resolveImg(l.images?.[0])} alt={l.title} style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 'var(--radius-sm)', background: '#F1F5F9' }}
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=150&q=80'; }} />
                  <div style={{ flexGrow: 1, minWidth: 200 }}>
                    <h3 style={{ fontSize: '1.05rem', color: 'var(--primary-dark)', marginBottom: '0.2rem' }}>{l.title}</h3>
                    <div style={{ display: 'flex', gap: '0.6rem', fontSize: '0.82rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                      <span>Ward {l.ward}</span><span>•</span>
                      <span>{l.location}</span><span>•</span>
                      <strong style={{ color: 'var(--primary)' }}>{priceLabel(l)}</strong>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Owner: {l.owner?.name || 'Unknown'} {l.owner?.email ? `(${l.owner.email})` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <Link to={`/listings/${l._id}`} className="btn btn-outline" style={{ padding: '0.45rem 0.8rem', fontSize: '0.85rem' }}>
                      <Eye size={15} /> View
                    </Link>
                    <Link to={`/edit-listing/${l._id}`} className="btn btn-outline" style={{ padding: '0.45rem 0.8rem', fontSize: '0.85rem', borderColor: 'var(--primary)', color: 'var(--primary)' }}>
                      <Edit size={15} /> Edit
                    </Link>
                    <button onClick={() => deleteListing(l._id)} className="btn btn-danger" style={{ padding: '0.45rem 0.8rem', fontSize: '0.85rem' }} disabled={busyId === l._id}>
                      <Trash2 size={15} /> {busyId === l._id ? '...' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* USERS */}
          {tab === 'users' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filteredUsers.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', padding: '2rem', textAlign: 'center' }}>No users found.</p>
              ) : filteredUsers.map((u) => (
                <div key={u._id} style={{ display: 'flex', gap: '1rem', background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ flexGrow: 1, minWidth: 220 }}>
                    <h3 style={{ fontSize: '1.05rem', color: 'var(--primary-dark)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {u.name}
                      {u.role === 'admin' && (
                        <span style={{ fontSize: '0.7rem', background: 'var(--primary)', color: 'white', padding: '0.1rem 0.5rem', borderRadius: 999, fontWeight: 700 }}>ADMIN</span>
                      )}
                    </h3>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                      <span>{u.email}</span><span>•</span>
                      <span>{u.phone || 'no phone'}</span><span>•</span>
                      <span>{u.listingCount} listing{u.listingCount === 1 ? '' : 's'}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteUser(u._id)}
                    className="btn btn-danger"
                    style={{ padding: '0.45rem 0.8rem', fontSize: '0.85rem' }}
                    disabled={busyId === u._id || u._id === user?._id}
                    title={u._id === user?._id ? 'You cannot delete your own account' : 'Delete user and their listings'}
                  >
                    <Trash2 size={15} /> {busyId === u._id ? '...' : 'Delete'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminPanel;
