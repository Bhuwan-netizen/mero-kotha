import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import DonationModal from './components/DonationModal';
import PrivateRoute from './components/PrivateRoute';

// Import Pages
import Home from './pages/Home';
import ListingDetail from './pages/ListingDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateListing from './pages/CreateListing';
import EditListing from './pages/EditListing';

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
            </Routes>
          </main>

          <Footer onOpenDonation={openDonationModal} />
          
          <DonationModal isOpen={isDonationOpen} onClose={closeDonationModal} />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
