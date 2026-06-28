import React, { useState, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Upload, X, AlertCircle, Sparkles } from 'lucide-react';

const CreateListing = () => {
  const { user, token, API_URL } = useContext(AuthContext);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ward, setWard] = useState('1');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('');
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [contactName, setContactName] = useState(user?.name || '');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');

  // Image Upload State
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  // UI State
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle image selections
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Check if adding these would exceed the 2 images limit
    if (selectedImages.length + files.length > 2) {
      setError('You can upload up to 2 images only.');
      return;
    }

    setError('');
    
    // Validate file sizes (max 5MB) and type
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
      
      // Create reader preview
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result);
        setImagePreviews([...newPreviews]);
      };
      reader.readAsDataURL(file);
    }

    setSelectedImages([...selectedImages, ...validFiles]);
  };

  // Remove selected image
  const removeImage = (index) => {
    const updatedImages = selectedImages.filter((_, i) => i !== index);
    const updatedPreviews = imagePreviews.filter((_, i) => i !== index);
    setSelectedImages(updatedImages);
    setImagePreviews(updatedPreviews);
    setError('');
  };

  // Trigger file click
  const triggerFileSelect = () => {
    if (selectedImages.length >= 2) {
      setError('You have reached the maximum limit of 2 images.');
      return;
    }
    fileInputRef.current.click();
  };

  // Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Field validation
    if (!title || !description || !location || (!isNegotiable && !price) || !contactName || !contactPhone) {
      setError('Please fill in all required fields.');
      return;
    }

    // At least one property photo is required
    if (selectedImages.length === 0) {
      setError('Please upload at least one property photo.');
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
    if (isNaN(wardNum) || wardNum < 1 || wardNum > 10) {
      setError('Ward number must be between 1 and 10.');
      return;
    }

    setIsSubmitting(true);

    // Build FormData payload
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('ward', ward);
    formData.append('location', location);
    formData.append('price', isNegotiable && !price ? '0' : price);
    formData.append('isNegotiable', isNegotiable);
    formData.append('contactName', contactName);
    formData.append('contactPhone', contactPhone);

    // Append images
    selectedImages.forEach((image) => {
      formData.append('images', image);
    });

    try {
      const res = await fetch(`${API_URL}/listings`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          // Note: Content-Type header must NOT be manually set for FormData upload;
          // the browser will automatically define it with the correct boundary parameter.
        },
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        navigate('/dashboard');
      } else {
        setError(data.message || 'Failed to create listing.');
      }
    } catch (err) {
      console.error(err);
      setError('Could not connect to the server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ marginTop: '2.5rem', maxWidth: '750px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', color: 'var(--primary-dark)', marginBottom: '0.25rem' }}>
          Post a Rental Space
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Fill in the details below to list your room, flat, or house in Birtamode.
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
            placeholder="e.g. 2 Room Flat near Muktichowk with Running Water"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Ward Number */}
          <div className="form-group">
            <label htmlFor="ward">Ward Number (Birtamode Municipality) *</label>
            <select
              id="ward"
              className="form-control"
              value={ward}
              onChange={(e) => setWard(e.target.value)}
              required
            >
              {[...Array(10)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  Ward {i + 1}
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

        {/* Location Address */}
        <div className="form-group">
          <label htmlFor="location">Detailed Location Address *</label>
          <input
            type="text"
            id="location"
            className="form-control"
            placeholder="e.g. Shanishchare Road, near Devkota Chowk"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
        </div>

        {/* Description */}
        <div className="form-group">
          <label htmlFor="description">Property Description *</label>
          <textarea
            id="description"
            className="form-control"
            rows="5"
            placeholder="Describe the rooms, facilities (water, electricity, parking, internet), neighborhood, and any specific requirements for tenants (e.g. family only, students)..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          ></textarea>
        </div>

        {/* Images Upload */}
        <div className="form-group">
          <label>Property Images (at least 1, up to 2 images) *</label>
          
          <div className="upload-zone" onClick={triggerFileSelect}>
            <Upload size={32} color="var(--primary)" style={{ margin: '0 auto 0.5rem', opacity: 0.8 }} />
            <p style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.95rem' }}>
              Click to select property photos
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
                  <img src={preview} alt={`Preview ${index + 1}`} className="preview-img" />
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
        <h3 style={{ fontSize: '1.15rem', color: 'var(--primary-dark)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Sparkles size={16} /> Contact Details
        </h3>

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
            {isSubmitting ? 'Posting Listing...' : 'Post Listing'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default CreateListing;
