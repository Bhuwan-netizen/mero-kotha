import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  // IDs of listings the current user has saved (for quick heart-toggle lookups)
  const [savedIds, setSavedIds] = useState([]);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/auth/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (data.success) {
          setUser({
            _id: data._id,
            name: data.name,
            email: data.email,
            phone: data.phone,
            role: data.role,
            token,
          });
        } else {
          // Token expired or invalid
          logout();
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data);
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (err) {
      return { success: false, message: 'Server error, please try again later' };
    }
  };

  const register = async (name, email, phone, password, adminCode) => {
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, phone, password, adminCode: adminCode || undefined }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data);
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Registration failed' };
      }
    } catch (err) {
      return { success: false, message: 'Server error, please try again later' };
    }
  };

  // Sign in / sign up with a Google ID token (credential)
  const googleLogin = async (credential) => {
    try {
      const res = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data);
        return { success: true, needsPhone: data.needsPhone };
      } else {
        return { success: false, message: data.message || 'Google sign-in failed' };
      }
    } catch (err) {
      return { success: false, message: 'Server error, please try again later' };
    }
  };

  // Save / update the logged-in user's phone number
  const updatePhone = async (phone) => {
    try {
      const res = await fetch(`${API_URL}/auth/phone`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (data.success) {
        setUser((prev) => ({ ...prev, phone: data.phone }));
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Could not save phone number' };
      }
    } catch (err) {
      return { success: false, message: 'Server error, please try again later' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setSavedIds([]);
  };

  // ---- Saved / favorite listings ----------------------------------------

  // Load the list of saved listing IDs whenever the user logs in.
  const refreshSavedIds = async (authToken = token) => {
    if (!authToken) {
      setSavedIds([]);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/listings/saved`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.success) {
        setSavedIds(data.data.map((l) => l._id));
      }
    } catch (err) {
      console.error('Error loading saved listings:', err);
    }
  };

  useEffect(() => {
    refreshSavedIds(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const isSaved = (listingId) => savedIds.includes(listingId);

  // Toggle a listing's saved state. Returns the new saved boolean.
  const toggleSave = async (listingId) => {
    if (!token) return { success: false, message: 'Please log in to save listings' };

    const currentlySaved = savedIds.includes(listingId);
    const method = currentlySaved ? 'DELETE' : 'POST';

    // Optimistic UI update
    setSavedIds((prev) =>
      currentlySaved ? prev.filter((id) => id !== listingId) : [...prev, listingId]
    );

    try {
      const res = await fetch(`${API_URL}/listings/${listingId}/save`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) {
        // Revert on failure
        setSavedIds((prev) =>
          currentlySaved ? [...prev, listingId] : prev.filter((id) => id !== listingId)
        );
        return { success: false, message: data.message };
      }
      return { success: true, saved: !currentlySaved };
    } catch (err) {
      setSavedIds((prev) =>
        currentlySaved ? [...prev, listingId] : prev.filter((id) => id !== listingId)
      );
      return { success: false, message: 'Server error, please try again later' };
    }
  };

  // Fetch the full saved listing objects (for the Saved page).
  const fetchSavedListings = async () => {
    if (!token) return [];
    try {
      const res = await fetch(`${API_URL}/listings/saved`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSavedIds(data.data.map((l) => l._id));
        return data.data;
      }
      return [];
    } catch (err) {
      console.error('Error fetching saved listings:', err);
      return [];
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        googleLogin,
        updatePhone,
        logout,
        API_URL,
        savedIds,
        isSaved,
        toggleSave,
        fetchSavedListings,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
