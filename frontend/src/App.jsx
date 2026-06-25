import React, { useState, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import DonationModal from './components/DonationModal';
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

function App() {
  const [isDonationOpen, setIsDonationOpen] = useState(false);

  const openDonationModal = () => setIsDonationOpen(true);
  const closeDonationModal = () => setIsDonationOpen(false);

  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Navbar onOpenDonation={openDonationModal} />
          
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

          <Footer onOpenDonation={openDonationModal} />
          
          <DonationModal isOpen={isDonationOpen} onClose={closeDonationModal} />

          <PhoneGate />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
