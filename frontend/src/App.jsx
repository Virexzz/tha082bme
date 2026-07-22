import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import Home from './components/Home.jsx';
import About from './components/About.jsx';
import Contact from './components/Contact.jsx';
import Services from './components/Services.jsx';
import Auth from './components/Auth.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import GroupRegistration from './GroupRegistration';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState('landing'); // Modes: 'landing', 'auth', or 'admin'
  const [initialFormSide, setInitialFormSide] = useState(false); 
  const [user, setUser] = useState(null);

  // 1. SUBDOMAIN & PATH DETECTOR (Checked FIRST before any UI renders)
  const hostname = window.location.hostname;
  const currentPath = window.location.pathname;

  // Render GroupRegistration if user accesses via subdomain OR visits /register-group path
  if (
    hostname.startsWith('projects.') || 
    hostname.startsWith('groups.') || 
    currentPath === '/register-group' || 
    currentPath === '/groups'
  ) {
    return <GroupRegistration />;
  }

  const handleOpenAuth = (wantsRegister) => {
    setInitialFormSide(wantsRegister);
    setCurrentView('auth'); 
  };

  const handleAuthSuccess = (data) => {
    if (!data) {
      console.error("Auth success event payload missing data attributes.");
      return;
    }
    setIsLoggedIn(true);
    const verifiedUser = data?.user || data;
    
    console.log("Portal State Verification -> User Object:", verifiedUser);

    setUser(verifiedUser); 
    setCurrentView('landing');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setCurrentView('landing');
    localStorage.removeItem('token'); 
  };

  // HOOK LIFECYCLE ZONE: Token validation state persistence
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('https://tha082bme.onrender.com/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.ok ? res.json() : Promise.reject())
    .then(data => {
        setIsLoggedIn(true);
        const verifiedUser = data?.user || data;
        setUser(verifiedUser);
    })
    .catch(() => {
        localStorage.removeItem('token');
    });
  }, []);

  // URL Deep-Link Scanner Routing
  useEffect(() => {
    const pathToIdMap = {
      '/home': 'home',
      '/about': 'about',
      '/services': 'services',
      '/contact': 'contact',
      '/class-notices': 'services',
      '/assignment-notices': 'services',
      '/routines': 'services',
      '/class-notes': 'services',
      '/essentials': 'services'
    };

    const targetId = pathToIdMap[currentPath];

    if (targetId) {
      setCurrentView('landing'); 
      
      setTimeout(() => {
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 400);
    }
  }, [currentPath]);

  // ================= CONDITIONAL LAYOUT SWITCHES =================

  // 1. ADMIN WORKSPACE
  if (currentView === 'admin' && user?.is_admin) {
    return (
      <div className="standalone-auth-overlay">
        <button className="back-home-btn" onClick={() => setCurrentView('landing')}>
          ← Back to Campus Home
        </button>
        <AdminDashboard />
      </div>
    );
  }

  // 2. THE AUTH OVERLAY SCREEN
  if (currentView === 'auth') {
    return (
      <div className="standalone-auth-overlay">
        <button className="back-home-btn" onClick={() => setCurrentView('landing')}>
          ← Back to Campus Home
        </button>
        <div className="auth-page-centered-card">
          <Auth 
            onAuthSuccess={handleAuthSuccess} 
            startOnRegister={initialFormSide}
          />
        </div>
      </div>
    );
  }

  // 3. MAIN LANDING LANDSCAPE
  return (
    <div className="App">
      <Navbar 
        isLoggedIn={isLoggedIn} 
        user={user} 
        onLogout={handleLogout}
        onOpenAuth={handleOpenAuth} 
        onNavigateAdmin={() => setCurrentView('admin')} 
      />
      
      <div id="home">
        <Home />
      </div>
      
      <div id="about">
        <About />
      </div>
      
      <div id="services">
        {isLoggedIn ? (
          <Services />
        ) : (
          <div className="locked-services-banner">
            <div className="lock-banner-content">
              <h2>🔒 Services Section Restricted</h2>
              <p>Assignments, engineering notes, and schedules are protected. Please log in to view resources.</p>
              <button className="banner-login-btn" onClick={() => handleOpenAuth(false)}>
                Access Portal
              </button>
            </div>
          </div>
        )}
      </div>

      <div id="contact">
        <Contact />
      </div>
      <footer className="campus-footer-credit">
        <hr className="footer-divider" />
        <p className="credit-text">
          Designed without fatigue and <span className="pun-highlight">Made By Pratap Gautam</span> (THA082BME025)
        </p>
      </footer>
    </div>
  );
}

export default App;