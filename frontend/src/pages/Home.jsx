import React, { useState, useEffect, useContext, useRef } from 'react';
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

  // Search/filter state is seeded from the URL's query string so that
  // navigating away (e.g. to a listing's detail page) and then pressing
  // Back restores the exact same search results instead of a blank
  // homepage. Every fetch keeps the URL in sync (see fetchListings) so the
  // browser history entry always reflects what's currently on screen.
  const [searchParams, setSearchParams] = useSearchParams();

  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedMunicipality, setSelectedMunicipality] = useState(searchParams.get('municipality') || '');
  const [selectedWard, setSelectedWard] = useState(searchParams.get('ward') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [propertyType, setPropertyType] = useState(searchParams.get('propertyType') || '');
  const [furnishing, setFurnishing] = useState(searchParams.get('furnishing') || '');
  const [preferredTenant, setPreferredTenant] = useState(searchParams.get('preferredTenant') || '');
  const [amenities, setAmenities] = useState(
    searchParams.get('amenities') ? searchParams.get('amenities').split(',') : []
  );

  // Skips the "reset to page 1" auto-refetch on initial mount, since the
  // dedicated mount effect below already fetches using the page/filters
  // restored from the URL.
  const isFirstFilterRender = useRef(true);

  // Ward options depend on the selected municipality ([] when "All wards")
  const wardOptions = selectedMunicipality ? getWardOptions(selectedMunicipality) : [];

  // Fetch listings from server. `pageToFetch` defaults to the current page,
  // but callers (filter changes, search submit) pass 1 explicitly so a new
  // search always starts from the first page of results.
  const fetchListings = async (pageToFetch = page) => {
    setLoading(true);
    setError(null);
    try {
      // Build query string
      const params = new URLSearchParams();
      if (selectedMunicipality) params.append('municipality', selectedMunicipality);
      if (selectedWard) params.append('ward', selectedWard);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (searchTerm) params.append('search', searchTerm);
      if (propertyType) params.append('propertyType', propertyType);
      if (furnishing) params.append('furnishing', furnishing);
      if (preferredTenant) params.append('preferredTenant', preferredTenant);
      if (amenities.length > 0) params.append('amenities', amenities.join(','));
      params.append('page', pageToFetch);
      params.append('limit', PAGE_SIZE);

      // Mirror the query in the address bar (without adding a new history
      // entry per filter tweak) so the browser's Back button returns here
      // with these exact results instead of a fresh, filter-less homepage.
      setSearchParams(params, { replace: true });

      const res = await fetch(`${API_URL}/listings?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setListings(data.data);
        setPage(data.pagination?.page || pageToFetch);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.totalCount ?? data.count ?? data.data.length);
        // Scroll back to the top of the results when changing page
        window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // Initial load: fetch using whatever page/filters were restored from the
  // URL (e.g. after coming Back from a listing's detail page). Runs once.
  useEffect(() => {
    fetchListings(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refetch (from page 1) when a dropdown-style filter changes.
  // Skipped on the very first render since the mount effect above already
  // handled the initial fetch - otherwise this would immediately reset
  // page back to 1 and clobber a restored page from the URL.
  useEffect(() => {
    if (isFirstFilterRender.current) {
      isFirstFilterRender.current = false;
      return;
    }
    fetchListings(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMunicipality, selectedWard, propertyType, furnishing, preferredTenant]);

  const goToPage = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;
    fetchListings(nextPage);
  };

  const handleMunicipalityChange = (e) => {
    setSelectedMunicipality(e.target.value);
    setSelectedWard(''); // reset ward when municipality changes
  };

  const toggleAmenity = (item) => {
    setAmenities((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchListings(1);
  };

  const handleReset = () => {
    setSearchTerm('');
    setSelectedMunicipality('');
    setSelectedWard('');
    setMinPrice('');
    setMaxPrice('');
    setPropertyType('');
    setFurnishing('');
    setPreferredTenant('');
    setAmenities([]);
    // We fetch again with empty parameters (page 1)
    setLoading(true);
    setSearchParams({ page: '1', limit: String(PAGE_SIZE) }, { replace: true });
    fetch(`${API_URL}/listings?page=1&limit=${PAGE_SIZE}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setListings(data.data);
          setPage(1);
          setTotalPages(data.pagination?.totalPages || 1);
          setTotalCount(data.pagination?.totalCount ?? data.count ?? data.data.length);
        }
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
                onChange={(e) => setSelectedWard(e.target.value)}
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
                    onChange={(e) => setPropertyType(e.target.value)}
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
                    onChange={(e) => setFurnishing(e.target.value)}
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
                    onChange={(e) => setPreferredTenant(e.target.value)}
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