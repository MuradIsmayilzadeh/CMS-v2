import React from 'react';
import "./navbar.css"
export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-content">
        <a href="/" className="navbar-logo">CMS V2</a>
        <ul className="navbar-links">
          <li><a href="/adminlogin">Login</a></li>
        </ul>
      </div>
    </nav>
  );
}
