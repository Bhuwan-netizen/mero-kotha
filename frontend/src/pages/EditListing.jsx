import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Upload, X, AlertCircle, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import {
  MUNICIPALITY_NAMES,
  getWardOptions,
  PROPERTY_TYPES,
  FURNISHING_OPTIONS,
  TENANT_OPTIONS,
  AMENITIES,
} from '../constants/jhapa';
import { cldImg, IMG } from '../utils/cloudinary';

const EditListing = () => {
  const { id } = useParams();
  const { token, API_URL } = useContext(AuthContext);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [municipality, setMunicipality] = useState(MUNICIPALITY_NAMES[1]);
  const [ward, setWard] = useState('1');
  const [location, setLocation] = useState('');
  const [propertyType, setPropertyType] = useState(PROPERTY_TYPES[0]);
  const [furnishing, setFurnishing] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [amenities, setAmenities] = useState([]);
  const [preferredTenant, setPreferredTenant] = useState('Any');
  const [price, setPrice] = useState('');
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [existingImages, setExistingImages] = useState([]);

  const wardOptions = getWardOptions(municipality);

  const handleMunicipalityChange = (e) => {
    setMunicipality(e.target.value);
    setWard('1');
  };

  const toggleAmenity = (item) => {
    setAmenities((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  // Image Upload State
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  // UI State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch listing data on mount
  useEffect(() => {
    const fetchListing = async () => {
      try {
        const res = await fetch(`${API_URL}/listings/${id}`);
        const data = await res.json();

        if (data.success) {
          const l = data.data;
          setTitle(l.title);
          setDescription(l.description);
          setMunicipality(l.municipality || MUNICIPALITY_NAMES[1]);
          setWard(String(l.ward));
          setLocation(l.location);
          setPropertyType(l.propertyType || PROPERTY_TYPES[0]);
          setFurnishing(l.furnishing || '');
          setBedrooms(l.bedrooms ? String(l.bedrooms) : '');
          setBathrooms(l.bathrooms ? String(l.bathrooms) : '');
          setAmenities(l.amenities || []);
          setPreferredTenant(l.preferredTenant || 'Any');
          setPrice(l.price === 0 ? '' : String(l.price));
          setIsNegotiable(l.isNegotiable || false);
          setContactName(l.contactName);
          setContactPhone(l.contactPhone);
          setExistingImages(l.images || []);
        } else {
          setError(data.message || 'Failed to fetch listing data.');
        }
      } catch (err) {
        console.error(err);
        setError('Failed to connect to the server.');
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id, API_URL]);

  // Handle new image selection
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Check limit
    if (selectedImages.length + files.length > 2) {
      setError('You can upload up to 2 images only.');
      return;
    }

    setError('');
    const validFiles = [];
    const newPreviews = [...imagePreviews];

    for (let file of files) {
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Each image file size must be less than 5MB.');
        return;
      }
      
      validFiles.push(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result);
        setImagePreviews([...newPreviews]);
      };
      reader.readAsDataURL(file);
    }

    setSelectedImages([...selectedImages, ...validFiles]);
  };

  const removeImage = (index) => {
    const updatedImages = selectedImages.filter((_, i) => i !== index);
    const updatedPreviews = imagePreviews.filter((_, i) => i !== index);
    setSelectedImages(updatedImages);
    setImagePreviews(updatedPreviews);
    setError('');
  };

  const triggerFileSelect = () => {
    if (selectedImages.length >= 2) {
      setError('You have reached the maximum limit of 2 images.');
      return;
    }
    fileInputRef.current.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Field validation
    if (!title || !description || !municipality || !location || !propertyType || (!isNegotiable && !price) || !contactName || !contactPhone) {
      setError('Please fill in all required fields.');
      return;
    }

    if (price) {
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum <= 0) {
        setError('Please enter a valid price.');
        return;
      }
    }

    const wardNum = parseInt(ward);
    if (isNaN(wardNum) || wardNum < 1 || wardNum > wardOptions.length) {
      setError(`Ward number must be between 1 and ${wardOptions.length} for ${municipality}.`);
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('municipality', municipality);
    formData.append('ward', ward);
    formData.append('location', location);
    formData.append('propertyType', propertyType);
    formData.append('furnishing', furnishing);
    formData.append('bedrooms', bedrooms || '0');
    formData.append('bathrooms', bathrooms || '0');
    formData.append('amenities', JSON.stringify(amenities));
    formData.append('preferredTenant', preferredTenant);
    formData.append('price', isNegotiable && !price ? '0' : price);
    formData.append('isNegotiable', isNegotiable);
    formData.append('contactName', contactName);
    formData.append('contactPhone', contactPhone);

    // Append new images if selected
    selectedImages.forEach((image) => {
      formData.append('images', image);
    });

    try {
      const res = await fetch(`${API_URL}/listings/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        navigate('/dashboard', {
          state: data.data?.status === 'pending'
            ? { flash: 'Your changes were saved. This listing will be re-checked by an admin before it goes public again.' }
            : undefined,
        });
      } else {
        setError(data.message || 'Failed to update listing.');
      }
    } catch (err) {
      console.error(err);
      setError('Could not connect to the server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid var(--primary-light)',
          borderTop: '4px solid var(--primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ color: 'var(--text-muted)' }}>Loading listing details...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ marginTop: '2.5rem', maxWidth: '750px' }}>
      <button onClick={() => navigate('/dashboard')} className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <ArrowLeft size={16} />
        Back to Dashboard
      </button>

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', color: 'var(--primary-dark)', marginBottom: '0.25rem' }}>
          Edit Property Listing
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Update the details of your room, flat, or house advertisement.
        </p>
      </div>

      {error && (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', boxShadow: 'var(--shadow-lg)' }}>
        
        {/* Title */}
        <div className="form-group">
          <label htmlFor="title">Listing Title *</label>
          <input
            type="text"
            id="title"
            className="form-control"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        {/* Municipality + Ward */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
          <div className="form-group">
            <label htmlFor="municipality">Municipality / Rural Municipality *</label>
            <select
              id="municipality"
              className="form-control"
              value={municipality}
              onChange={handleMunicipalityChange}
              required
            >
              {MUNICIPALITY_NAMES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="ward">Ward *</label>
            <select
              id="ward"
              className="form-control"
              value={ward}
              onChange={(e) => setWard(e.target.value)}
              required
            >
              {wardOptions.map((w) => (
                <option key={w} value={w}>
                  Ward {w}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Property type + Price */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="form-group">
            <label htmlFor="propertyType">Property Type *</label>
            <select
              id="propertyType"
              className="form-control"
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              required
            >
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Price */}
          <div className="form-group">
            <label htmlFor="price">Rent Price (NPR per Month) {!isNegotiable && '*'}</label>
            <input
              type="number"
              id="price"
              className="form-control"
              placeholder={isNegotiable ? "Negotiable (Optional base price)" : "e.g. 8000"}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required={!isNegotiable}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <input
                type="checkbox"
                id="isNegotiable"
                checked={isNegotiable}
                onChange={(e) => setIsNegotiable(e.target.checked)}
                style={{ width: 'auto', cursor: 'pointer', margin: 0 }}
              />
              <label htmlFor="isNegotiable" style={{ margin: 0, fontWeight: 500, cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Price is Negotiable
              </label>
            </div>
          </div>
        </div>

        {/* Tole / Area */}
        <div className="form-group">
          <label htmlFor="location">Tole / Area / Landmark *</label>
          <input
            type="text"
            id="location"
            className="form-control"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
        </div>

        {/* Room details: furnishing, tenant */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="form-group">
            <label htmlFor="furnishing">Furnishing</label>
            <select
              id="furnishing"
              className="form-control"
              value={furnishing}
              onChange={(e) => setFurnishing(e.target.value)}
            >
              <option value="">Not specified</option>
              {FURNISHING_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="preferredTenant">Preferred Tenant</label>
            <select
              id="preferredTenant"
              className="form-control"
              value={preferredTenant}
              onChange={(e) => setPreferredTenant(e.target.value)}
            >
              {TENANT_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="form-group">
            <label htmlFor="bedrooms">Bedrooms</label>
            <input
              type="number"
              id="bedrooms"
              min="0"
              className="form-control"
              value={bedrooms}
              onChange={(e) => setBedrooms(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="bathrooms">Bathrooms</label>
            <input
              type="number"
              id="bathrooms"
              min="0"
              className="form-control"
              value={bathrooms}
              onChange={(e) => setBathrooms(e.target.value)}
            />
          </div>
        </div>

        {/* Amenities */}
        <div className="form-group">
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
        </div>

        {/* Description */}
        <div className="form-group">
          <label htmlFor="description">Property Description *</label>
          <textarea
            id="description"
            className="form-control"
            rows="5"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          ></textarea>
        </div>

        {/* Existing Images Display */}
        {existingImages.length > 0 && selectedImages.length === 0 && (
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Current Photos</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              {existingImages.map((imgUrl, index) => {
                const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
                const src = cldImg(imgUrl && imgUrl.startsWith('http') ? imgUrl : `${backendUrl}${imgUrl}`, IMG.edit);
                return (
                  <div key={index} className="preview-container">
                    <img src={src} alt={`Current ${index + 1}`} className="preview-img" onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=300&q=80';
                    }} />
                  </div>
                );
              })}
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              💡 Selecting new photos in the field below will replace these current ones.
            </p>
          </div>
        )}

        {/* New Images Upload */}
        <div className="form-group">
          <label>Upload New Photos (Optional - Overwrites current photos)</label>
          
          <div className="upload-zone" onClick={triggerFileSelect}>
            <Upload size={32} color="var(--primary)" style={{ margin: '0 auto 0.5rem', opacity: 0.8 }} />
            <p style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.95rem' }}>
              Select new photos to replace current ones
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
              Maximum 2 images only. Size must be under 5MB each.
            </p>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              multiple
              accept="image/*"
              onChange={handleImageChange}
              disabled={selectedImages.length >= 2}
            />
          </div>

          {imagePreviews.length > 0 && (
            <div className="upload-previews">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="preview-container">
                  <img src={preview} alt={`New Preview ${index + 1}`} className="preview-img" />
                  <button type="button" className="remove-btn" onClick={() => removeImage(index)}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <hr style={{ margin: '2rem 0', border: '0', borderTop: '1px solid var(--border)' }} />

        {/* Contact Info Section */}
        <h3 style={{ fontSize: '1.15rem', color: 'var(--primary-dark)', marginBottom: '1.15rem' }}>Contact Details</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Contact Person */}
          <div className="form-group">
            <label htmlFor="contactName">Contact Name *</label>
            <input
              type="text"
              id="contactName"
              className="form-control"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              required
            />
          </div>

          {/* Contact Phone */}
          <div className="form-group">
            <label htmlFor="contactPhone">Contact Phone Number *</label>
            <input
              type="tel"
              id="contactPhone"
              className="form-control"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Form Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => navigate('/dashboard')} className="btn btn-outline">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default EditListing;
