import React from 'react';
import './Navbar.css';

function Navbar({ isLoggedIn, user, onLogout, onOpenAuth, onNavigateAdmin }) {
    
    // Smoothly push path to URL bar and scroll to target layout element
    const handleNavigation = (e, pathSlug, targetId) => {
        e.preventDefault();
        
        // Update URL bar to clean pathway format
        window.history.pushState({}, '', pathSlug);
        
        // Safely trigger smooth movement down the viewport
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="Navbar">
            <div className="NavLeft">
                <ul>
                    <li>
                        <a href="/home" onClick={(e) => handleNavigation(e, '/home', 'home')}>Home</a>
                    </li>
                    <li>
                        <a href="/about" onClick={(e) => handleNavigation(e, '/about', 'about')}>About</a>
                    </li>
                    <li>
                        <a href="/services" onClick={(e) => handleNavigation(e, '/services', 'services')}>Services</a>
                    </li>
                    <li>
                        <a href="/contact" onClick={(e) => handleNavigation(e, '/contact', 'contact')}>Contact</a>
                    </li>
                </ul>
            </div>
            <div className="NavRight">
                <ul>
                    {!isLoggedIn ? (
                        <>
                            <li id="Login">
                                <a href="/login" onClick={(e) => { e.preventDefault(); onOpenAuth(false); }}>Login</a>
                            </li>
                            <li> 
                                <button className="nav-register-btn" onClick={() => onOpenAuth(true)}>Register</button>
                            </li>
                        </>
                    ) : (
                        <>
                            {user?.is_admin && (
                                <li>
                                    <button className="nav-admin-btn" onClick={onNavigateAdmin}>
                                        ⚙️ Admin Dashboard
                                    </button>
                                </li>
                            )}
                            <li>
                                <button className="nav-logout-btn" onClick={onLogout}>Logout</button>
                            </li>
                        </>
                    )}
                </ul>
            </div>
        </div>
    );
}

export default Navbar;