import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ListingCard from '../components/ListingCard';
import { Search, MapPin, SlidersHorizontal, RefreshCw, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  MUNICIPALITY_NAMES,
  getWardOptions,
  PROPERTY_TYPES,
  FURNISHING_OPTIONS,
  TENANT_OPTIONS,
  AMENITIES,
} from '../constants/jhapa';

const PAGE_SIZE = 20;

const Home = () => {
  const { API_URL } = useContext(AuthContext);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  // Bumped by the "Try Again" button to force the fetch effect below to
  // re-run without changing any actual filter.
  const [retryToken, setRetryToken] = useState(0);

  // The URL's query string is the single source of truth for every
  // filter/search value and the current page. Nothing filter-related lives
  // in its own separate useState - it's all read straight from
  // searchParams on every render. That's deliberate: React Router updates
  // searchParams both when we call setSearchParams() AND when the user hits
  // the browser's Back/Forward buttons (popstate), so the one fetch effect
  // below (keyed on searchParams) reacts to both the same way. Previously,
  // filters lived in separate useState that only got written TO the URL
  // and never read back FROM it after the initial mount - so pressing Back
  // changed the address bar but the page kept showing whatever was already
  // on screen. Deriving everything from searchParams fixes that.
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get('page')) || 1;
  const selectedMunicipality = searchParams.get('municipality') || '';
  const selectedWard = searchParams.get('ward') || '';
  const propertyType = searchParams.get('propertyType') || '';
  const furnishing = searchParams.get('furnishing') || '';
  const preferredTenant = searchParams.get('preferredTenant') || '';
  const amenities = searchParams.get('amenities') ? searchParams.get('amenities').split(',') : [];

  // Free-text/number fields need their own "draft" state so the URL (and
  // browser history) isn't touched on every keystroke - only once the
  // search form is submitted. They're re-synced from the URL whenever it
  // changes externally (e.g. the user pressing Back), so the boxes don't
  // show stale text after navigating.
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');

  useEffect(() => {
    setSearchTerm(searchParams.get('search') || '');
    setMinPrice(searchParams.get('minPrice') || '');
    setMaxPrice(searchParams.get('maxPrice') || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Ward options depend on the selected municipality ([] when "All wards")
  const wardOptions = selectedMunicipality ? getWardOptions(selectedMunicipality) : [];

  // The one and only place that talks to the API. Runs whenever the URL's
  // query changes for any reason - a new search, a filter tweak, a page
  // change, or the browser's Back/Forward buttons - so what's on screen
  // always matches the address bar.
  useEffect(() => {
    const controller = new AbortController();

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams(searchParams);
        if (!params.get('page')) params.set('page', '1');
        if (!params.get('limit')) params.set('limit', String(PAGE_SIZE));

        const res = await fetch(`${API_URL}/listings?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = await res.json();

        if (data.success) {
          setListings(data.data);
          setTotalPages(data.pagination?.totalPages || 1);
          setTotalCount(data.pagination?.totalCount ?? data.count ?? data.data.length);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          setError(data.message || 'Failed to fetch rooms');
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error(err);
          setError('Could not connect to the server. Make sure the backend is running.');
        }
      } finally {
        setLoading(false);
      }
    };

    run();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, API_URL, retryToken]);

  // Builds a new query string from the current one plus `updates`, and
  // writes it into the URL/history. Empty values remove that key so the
  // URL stays clean.
  //
  // `push` controls how the update lands in browser history:
  //  - true (default): PUSH a new entry, so this becomes a real
  //    "checkpoint" - pressing Back undoes just this one search/filter
  //    change and lands back on Mero Kotha's previous results, instead of
  //    leaving the site entirely.
  //  - false: REPLACE the current entry. Used only for pagination, so
  //    flipping through result pages doesn't pile up history entries.
  const updateParams = (updates, { push = true, resetPage = true } = {}) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      const isEmpty =
        value === '' || value === null || value === undefined || (Array.isArray(value) && value.length === 0);
      if (isEmpty) {
        next.delete(key);
      } else {
        next.set(key, Array.isArray(value) ? value.join(',') : String(value));
      }
    });
    if (resetPage && !('page' in updates)) {
      next.set('page', '1');
    }
    next.set('limit', String(PAGE_SIZE));
    setSearchParams(next, { replace: !push });
  };

  const goToPage = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;
    updateParams({ page: nextPage }, { push: false, resetPage: false });
  };

  const handleMunicipalityChange = (e) => {
    updateParams({ municipality: e.target.value, ward: '' }); // reset ward when municipality changes
  };

  const handleWardChange = (e) => {
    updateParams({ ward: e.target.value });
  };

  const handlePropertyTypeChange = (e) => updateParams({ propertyType: e.target.value });
  const handleFurnishingChange = (e) => updateParams({ furnishing: e.target.value });
  const handlePreferredTenantChange = (e) => updateParams({ preferredTenant: e.target.value });

  const toggleAmenity = (item) => {
    const next = amenities.includes(item) ? amenities.filter((a) => a !== item) : [...amenities, item];
    updateParams({ amenities: next });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateParams({ search: searchTerm, minPrice, maxPrice });
  };

  const handleReset = () => {
    setSearchTerm('');
    setMinPrice('');
    setMaxPrice('');
    setSearchParams({ page: '1', limit: String(PAGE_SIZE) }, { replace: false });
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <h1 className="hero-title">
            Find Your Next <span>Kotha</span> in Jhapa
          </h1>
          <p className="hero-subtitle">
            Explore rooms, flats, and houses for rent across all municipalities of Jhapa district, Nepal.
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
              <label htmlFor="municipality">Municipality</label>
              <select
                id="municipality"
                className="form-control"
                value={selectedMunicipality}
                onChange={handleMunicipalityChange}
              >
                <option value="">All of Jhapa</option>
                {MUNICIPALITY_NAMES.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="ward">Ward</label>
              <select
                id="ward"
                className="form-control"
                value={selectedWard}
                onChange={handleWardChange}
                disabled={!selectedMunicipality}
              >
                <option value="">{selectedMunicipality ? 'All wards' : 'Select municipality first'}</option>
                {wardOptions.map((w) => (
                  <option key={w} value={w}>
                    Ward {w}
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

          {/* Toggle for advanced filters */}
          <button
            type="button"
            className="more-filters-toggle"
            onClick={() => setShowMoreFilters((s) => !s)}
          >
            <SlidersHorizontal size={14} />
            {showMoreFilters ? 'Hide advanced filters' : 'More filters'}
            <ChevronDown
              size={15}
              style={{ transform: showMoreFilters ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
            />
          </button>

          {showMoreFilters && (
            <div className="advanced-filters">
              <div className="filter-grid">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="propertyType">Property Type</label>
                  <select
                    id="propertyType"
                    className="form-control"
                    value={propertyType}
                    onChange={handlePropertyTypeChange}
                  >
                    <option value="">Any type</option>
                    {PROPERTY_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="furnishing">Furnishing</label>
                  <select
                    id="furnishing"
                    className="form-control"
                    value={furnishing}
                    onChange={handleFurnishingChange}
                  >
                    <option value="">Any</option>
                    {FURNISHING_OPTIONS.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="preferredTenant">Preferred Tenant</label>
                  <select
                    id="preferredTenant"
                    className="form-control"
                    value={preferredTenant}
                    onChange={handlePreferredTenantChange}
                  >
                    <option value="">Any</option>
                    {TENANT_OPTIONS.filter((t) => t !== 'Any').map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0, marginTop: '1rem' }}>
                <label>Amenities</label>
                <div className="amenities-grid">
                  {AMENITIES.map((item) => (
                    <label key={item} className={`amenity-chip ${amenities.includes(item) ? 'selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={amenities.includes(item)}
                        onChange={() => toggleAmenity(item)}
                        style={{ display: 'none' }}
                      />
                      {item}
                    </label>
                  ))}
                </div>
                <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                  Apply amenity filters
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Listings Display */}
        <div className="listings-header">
          <h2 style={{ fontSize: '1.5rem', color: 'var(--primary-dark)' }}>
            Available Spaces
          </h2>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 500 }}>
            {totalCount} {totalCount === 1 ? 'space' : 'spaces'} found
          </span>
        </div>

        {error && (
          <div style={{ padding: '2rem', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', borderRadius: 'var(--radius-md)', textAlign: 'center', marginBottom: '2rem' }}>
            <p style={{ fontWeight: 600 }}>{error}</p>
            <button onClick={() => setRetryToken((n) => n + 1)} className="btn btn-primary" style={{ marginTop: '1rem' }}>
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
          <>
            <div className="listings-grid">
              {listings.map((listing) => (
                <ListingCard key={listing._id} listing={listing} />
              ))}
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', margin: '2.5rem 0' }}>
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                  className="btn btn-outline"
                  style={{ padding: '0.6rem 1.1rem' }}
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages}
                  className="btn btn-primary"
                  style={{ padding: '0.6rem 1.1rem' }}
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
