import React, { useContext, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Home, Menu, X, PlusCircle, LogOut, User } from 'lucide-react';

const Navbar = ({ onOpenDonation }) => {
  const { user, logout } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="container nav-container">
        
        {/* Left side brand logo + mobile-only visible auth buttons */}
        <div className="nav-left-group">
          <Link to="/" className="nav-logo" onClick={() => setIsOpen(false)}>
            <Home size={28} strokeWidth={2.5} />
            mero <span>kotha</span>
          </Link>
          
          {!user && (
            <div className="nav-auth-buttons-left">
              <Link to="/login" className="nav-link nav-link-login" onClick={() => setIsOpen(false)}>
                Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-register-nav" onClick={() => setIsOpen(false)}>
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Desktop & Mobile Menu Links */}
        <div className={`nav-menu ${isOpen ? 'open' : ''}`}>
          <NavLink
            to="/"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setIsOpen(false)}
          >
            Browse Rooms
          </NavLink>

          <button
            onClick={() => {
              onOpenDonation();
              setIsOpen(false);
            }}
            className="nav-link"
            style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}
          >
            Donate & Support
          </button>

          {user && (
            <>
              <NavLink
                to="/dashboard"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setIsOpen(false)}
              >
                Dashboard
              </NavLink>

              <NavLink to="/create-listing" className="btn btn-primary" onClick={() => setIsOpen(false)}>
                <PlusCircle size={18} />
                Post a Room
              </NavLink>
              
              <div className="nav-user-mobile-only">
                <span className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-main)' }}>
                  <User size={16} />
                  {user.name.split(' ')[0]}
                </span>
                <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '0.5rem 1rem', width: '100%' }}>
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </>
          )}
        </div>

        {/* Right side visible actions (Desktop Auth / User settings + Mobile Burger) */}
        <div className="nav-actions-visible">
          {user ? (
            <div className="nav-user-desktop-only">
              <span className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-main)' }}>
                <User size={16} />
                {user.name.split(' ')[0]}
              </span>
              <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
                <LogOut size={16} />
                Logout
              </button>
            </div>
          ) : (
            <div className="nav-auth-buttons-right">
              <Link to="/login" className="nav-link nav-link-login" onClick={() => setIsOpen(false)}>
                Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-register-nav" onClick={() => setIsOpen(false)}>
                Register
              </Link>
            </div>
          )}

          {/* Burger menu for Mobile */}
          <div className="burger-menu" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={26} /> : <Menu size={26} />}
          </div>
        </div>
      </div>
    </nav>);
};

export default Navbar;