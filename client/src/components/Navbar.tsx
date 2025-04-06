import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Navbar: React.FC = () => {
    return (
      <nav className="navbar">
        <div className="navbar-container">          
          <div className="nav-menu">
            <Link to="/" className="nav-link">
              Home
            </Link>
          </div>
        </div>
      </nav>
    );
  };

export default Navbar;