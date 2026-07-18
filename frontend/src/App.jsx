import React, { useState, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PricingModal from './components/PricingModal';
import PhonePromptModal from './components/PhonePromptModal';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';

// Shows the phone-prompt modal whenever a logged-in user has no phone on file
// (e.g. just signed up with Google). Lives inside AuthProvider to read context.
const PhoneGate = () => {
  const { user, loading } = useContext(AuthContext);
  if (loading || !user || user.phone) return null;
  return <PhonePromptModal />;
};

// Import Pages
import Home from './pages/Home';
import ListingDetail from './pages/ListingDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateListing from './pages/CreateListing';
import EditListing from './pages/EditListing';
import AdminPanel from './pages/AdminPanel';
import SavedListings from './pages/SavedListings';

function App() {
  const [isPricingOpen, setIsPricingOpen] = useState(false);

  const openPricingModal = () => setIsPricingOpen(true);
  const closePricingModal = () => setIsPricingOpen(false);

  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Navbar onOpenPricing={openPricingModal} />

          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/listings/:id" element={<ListingDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Private Routes for Owners */}
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/saved"
                element={
                  <PrivateRoute>
                    <SavedListings />
                  </PrivateRoute>
                }
              />
              <Route
                path="/create-listing"
                element={
                  <PrivateRoute>
                    <CreateListing />
                  </PrivateRoute>
                }
              />
              <Route
                path="/edit-listing/:id"
                element={
                  <PrivateRoute>
                    <EditListing />
                  </PrivateRoute>
                }
              />

              {/* Admin-only Panel */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminPanel />
                  </AdminRoute>
                }
              />
            </Routes>
          </main>

          <Footer onOpenPricing={openPricingModal} />

          <PricingModal isOpen={isPricingOpen} onClose={closePricingModal} />

          <PhoneGate />

          <Analytics />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
