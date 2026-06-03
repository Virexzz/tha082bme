import React, { useState, useEffect } from 'react';
import './Auth.css';

function Auth({ onAuthSuccess, startOnRegister }) {
    const [isFlipped, setIsFlipped] = useState(false);
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        setIsFlipped(startOnRegister);
        setErrorMessage(''); // Clear errors when switching views
    }, [startOnRegister]);

    const handleToggle = (e) => {
        e.preventDefault();
        setIsFlipped(!isFlipped);
        setErrorMessage('');
        // Clear inputs on flip for a polished user experience
        setEmail('');
        setName('');
        setPassword('');
    };

    const validateThapathaliEmail = (inputEmail) => {
        // Regex pattern strictly validating roll numbers 001 to 048
        const formatRegex = /^[a-zA-Z]+(\.[a-zA-Z]+)*\.082bme(0[0-3][0-9]|04[0-8])@tcioe\.edu\.np$/i;
        return formatRegex.test(inputEmail);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');

        if (isFlipped) {
            if (!validateThapathaliEmail(email)) {
                setErrorMessage('Invalid Format! Must be: name.082bme###@tcioe.edu.np (Roll: 001 to 048)');
                return;
            }
        }

        try {
            const endpoint = isFlipped ? '/api/auth/register' : '/api/auth/login';
            const body = isFlipped
                ? { name, email, password }
                : { email, password };

            const res = await fetch(`http://localhost:5000${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await res.json();

            if (!res.ok) {
                setErrorMessage(data.message || 'Something went wrong.');
                return;
            }

            // Store token in localStorage for future authenticated requests
            localStorage.setItem('token', data.token);

            if (onAuthSuccess) onAuthSuccess(data);

        } catch (err) {
            setErrorMessage('Network error. Is the backend running?');
        }
    };

    return (
        <div className={`auth-container ${isFlipped ? 'flipped' : ''}`}>
            
            {/* ================= LOGIN SIDE ================= */}
            <div className="auth-card card-front">
                <h2 className="auth-title">Welcome Back</h2>
                <p className="auth-subtitle">Log into your Mechanical 2082 account.</p>
                
                {/* 🌟 FIXED: Display backend validation errors on the login page too! */}
                {errorMessage && !isFlipped && <div className="auth-error-banner">{errorMessage}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    {/* 🌟 FIXED: Linked values and onChange states */}
                    <div className="input-group">
                        <input 
                            type="email" 
                            placeholder="Campus Email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required 
                        />
                    </div>
                    <div className="input-group">
                        <input 
                            type="password" 
                            placeholder="Password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required 
                        />
                    </div>
                    <button type="submit" className="auth-btn">Login</button>
                </form>
                
                <p className="toggle-text">
                    Don't have an account?{' '}
                    <a href="#register" onClick={handleToggle}>Register here</a>
                </p>
            </div>

            {/* ================= REGISTER SIDE ================= */}
            <div className="auth-card card-back">
                <h2 className="auth-title">Create Account</h2>
                <p className="auth-subtitle">Register to access notes and routines.</p>
                
                {errorMessage && isFlipped && <div className="auth-error-banner">{errorMessage}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="input-group">
                        <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div className="input-group">
                        <input type="email" placeholder="name.082bme###@tcioe.edu.np" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="input-group">
                        <input type="password" placeholder="Create Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    
                    <button type="submit" className="auth-btn">Sign Up</button>
                </form>
                
                <p className="toggle-text">
                    Already have an account?{' '}
                    <a href="#login" onClick={handleToggle}>Login here</a>
                </p>
            </div>

        </div>
    );
}

export default Auth;