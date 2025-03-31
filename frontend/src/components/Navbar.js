import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const toggleNavbar = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    toast.info('Logged out successfully!');
    navigate('/login');
  };

  const isLoggedIn = !!localStorage.getItem('token');

  const getUserFromToken = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch {
      return null;
    }
  };

  const user = isLoggedIn ? getUserFromToken() : null;

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-3">
      <NavLink className="navbar-brand" to="/">Restaurant</NavLink>
      <button
        className="navbar-toggler"
        type="button"
        onClick={toggleNavbar}
        aria-controls="navbarNav"
        aria-expanded={isOpen}
        aria-label="Toggle navigation"
      >
        <span className="navbar-toggler-icon"></span>
      </button>

      <div className={`collapse navbar-collapse ${isOpen ? 'show' : ''}`} id="navbarNav">
        <ul className="navbar-nav ms-auto">
          {!isLoggedIn && (
            <>
              <li className="nav-item">
                <NavLink className="nav-link" to="/signup">Sign Up</NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/login">Login</NavLink>
              </li>
            </>
          )}

          {isLoggedIn && (
            <>
              {user && (
                <li className="nav-item d-flex align-items-center text-light me-3">
                  <span style={{ fontSize: '0.9rem' }}>
                    Logged in as <strong>User #{user.user_id}</strong>
                  </span>
                </li>
              )}
              <li className="nav-item">
                <NavLink className="nav-link" to="/orders">Orders</NavLink>
              </li>
              <li className="nav-item">
                <button className="btn btn-sm btn-outline-light ms-3" onClick={handleLogout}>
                  Logout
                </button>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="/about">About</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="/menu">Menu</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="/payment">💳 Payment</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="/feedback">Feedback</a>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
