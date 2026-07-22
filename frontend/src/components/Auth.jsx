import React, { useState, useEffect } from 'react';
import './Auth.css';

function Auth({ onAuthSuccess, startOnRegister }) {
    const [isFlipped, setIsFlipped] = useState(false);
    const [role, setRole] = useState('student'); 
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [otpCode, setOtpCode] = useState(''); // 🌟 Tracks input verification token
    const [isOtpSent, setIsOtpSent] = useState(false); // 🌟 Toggles OTP code entry view
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        setIsFlipped(startOnRegister);
        clearForm();
    }, [startOnRegister]);

    const clearForm = () => {
        setErrorMessage('');
        setSuccessMessage('');
        setEmail('');
        setName('');
        setPassword('');
        setOtpCode('');
        setIsOtpSent(false);
    };

    const handleToggle = (e) => {
        e.preventDefault();
        setIsFlipped(!isFlipped);
        clearForm();
    };

    // Frontend validation rules before hitting backend OTP route
    const validateEmailFormat = (inputEmail) => {
        if (role === 'student') {
            const studentRegex = /^[a-zA-Z]+(\.[a-zA-Z]+)*\.082bme(0[0-3][0-9]|04[0-8])@tcioe\.edu\.np$/i;
            return studentRegex.test(inputEmail);
        } else {
            const teacherRegex = /^[a-zA-Z0-9._%+-]+@tcioe\.edu\.np$/i;
            return teacherRegex.test(inputEmail);
        }
    };

    // 🌟 Step 1: Send verification token to campus address
    const handleRequestOtp = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        if (!validateEmailFormat(email)) {
            const standardError = role === 'student' 
                ? 'Invalid Student Format! Must be: name.082bme###@tcioe.edu.np (Roll: 001 to 048)'
                : 'Invalid Teacher Format! Must be an official institutional handle ending with @tcioe.edu.np';
            setErrorMessage(standardError);
            return;
        }

        try {
            const res = await fetch(`https://tha082bme.onrender.com/api/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, role })
            });
            const data = await res.json();

            if (!res.ok) {
                setErrorMessage(data.message || 'Verification initialization failed.');
                return;
            }

            setIsOtpSent(true);
            setSuccessMessage(data.message);
        } catch (err) {
            setErrorMessage('Network error connecting to verification system.');
        }
    };

    // 🌟 Step 2: Finalize signup registration with OTP verification match
    const handleFinalizeRegister = async (e) => {
        e.preventDefault();
        setErrorMessage('');

        try {
            const res = await fetch(`https://tha082bme.onrender.com/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role, otpCode })
            });
            const data = await res.json();

            if (!res.ok) {
                setErrorMessage(data.message || 'Registration failed.');
                return;
            }

            localStorage.setItem('token', data.token);
            if (onAuthSuccess) onAuthSuccess(data);
        } catch (err) {
            setErrorMessage('Network error during registration.');
        }
    };

    // Standard Login Logic
    const handleLogin = async (e) => {
        e.preventDefault();
        setErrorMessage('');

        try {
            const res = await fetch(`https://tha082bme.onrender.com/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();

            if (!res.ok) {
                setErrorMessage(data.message || 'Invalid Credentials.');
                return;
            }

            localStorage.setItem('token', data.token);
            if (onAuthSuccess) onAuthSuccess(data);
        } catch (err) {
            setErrorMessage('Network error during login authentication.');
        }
    };

    const renderRoleSelector = () => (
        <div className="role-selector-container" style={{ display: 'flex', background: 'rgba(241, 245, 249, 0.9)', padding: '4px', borderRadius: '12px', marginBottom: '20px' }}>
            <button
                type="button"
                className={`role-toggle-btn ${role === 'student' ? 'active' : ''}`}
                disabled={isOtpSent} 
                onClick={() => { setRole('student'); setErrorMessage(''); }}
                style={{
                    flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: isOtpSent ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '0.85rem',
                    background: role === 'student' ? '#FFFFFF' : 'transparent',
                    color: role === 'student' ? '#0076FF' : '#64748B',
                    boxShadow: role === 'student' ? '0px 4px 10px rgba(0, 0, 0, 0.06)' : 'none',
                    transition: 'all 0.25s ease',
                    opacity: isOtpSent && role !== 'student' ? 0.5 : 1
                }}
            >
                🎓 Student
            </button>
            <button
                type="button"
                className={`role-toggle-btn ${role === 'teacher' ? 'active' : ''}`}
                disabled={isOtpSent}
                onClick={() => { setRole('teacher'); setErrorMessage(''); }}
                style={{
                    flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: isOtpSent ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '0.85rem',
                    background: role === 'teacher' ? '#FFFFFF' : 'transparent',
                    color: role === 'teacher' ? '#34C759' : '#64748B',
                    boxShadow: role === 'teacher' ? '0px 4px 10px rgba(0, 0, 0, 0.06)' : 'none',
                    transition: 'all 0.25s ease',
                    opacity: isOtpSent && role !== 'teacher' ? 0.5 : 1
                }}
            >
                👨‍🏫 Teacher
            </button>
        </div>
    );

    return (
        <div className={`auth-container ${isFlipped ? 'flipped' : ''}`}>
            
            {/* ================= LOGIN SIDE ================= */}
            <div className="auth-card card-front">
                <h2 className="auth-title">Welcome Back</h2>
                <p className="auth-subtitle">Log into your Mechanical 2082 account.</p>
                
                {renderRoleSelector()}
                {errorMessage && !isFlipped && <div className="auth-error-banner">{errorMessage}</div>}

                <form className="auth-form" onSubmit={handleLogin}>
                    <div className="input-group">
                        <input 
                            type="email" 
                            placeholder={role === 'student' ? "Campus Student Email" : "Official Teacher Email"} 
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
                <p className="auth-subtitle">Register to verify and activate your portal node.</p>
                
                {renderRoleSelector()}

                {errorMessage && isFlipped && <div className="auth-error-banner">{errorMessage}</div>}
                {successMessage && isFlipped && <div className="auth-success-banner" style={{ background: '#34C75915', color: '#34C759', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '15px', textAlign: 'center' }}>{successMessage}</div>}

                {/* 🌟 Conditional Views: Form Setup vs OTP Input Verification Box */}
                {!isOtpSent ? (
                    <form className="auth-form" onSubmit={handleRequestOtp}>
                        <div className="input-group">
                            <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
                        </div>
                        <div className="input-group">
                            <input 
                                type="email" 
                                placeholder={role === 'student' ? "name.082bme###@tcioe.edu.np" : "name@tcioe.edu.np"} 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                required 
                            />
                        </div>
                        <div className="input-group">
                            <input type="password" placeholder="Create Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>
                        <button type="submit" className="auth-btn" style={{ background: '#0076FF' }}>Send Verification Code</button>
                    </form>
                ) : (
                    <form className="auth-form" onSubmit={handleFinalizeRegister}>
                        <p style={{ fontSize: '0.85rem', color: '#64748B', textAlign: 'center', marginBottom: '10px' }}>
                            Enter the 6-digit verification code forwarded to <strong>{email}</strong>
                        </p>
                        <div className="input-group">
                            <input 
                                type="text" 
                                placeholder="Enter 6-Digit OTP" 
                                maxLength="6"
                                value={otpCode} 
                                onChange={(e) => setOtpCode(e.target.value)} 
                                style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '1.2rem', fontWeight: 'bold' }}
                                required 
                            />
                        </div>
                        <button type="submit" className="auth-btn" style={{ background: '#34C759' }}>Verify & Sign Up</button>
                        <button type="button" onClick={() => setIsOtpSent(false)} style={{ background: 'transparent', color: '#64748B', border: 'none', width: '100%', marginTop: '10px', cursor: 'pointer', fontSize: '0.8rem' }}>
                            ← Change Email / Back
                        </button>
                    </form>
                )}
                
                <p className="toggle-text">
                    Already have an account?{' '}
                    <a href="#login" onClick={handleToggle}>Login here</a>
                </p>
            </div>

        </div>
    );
}

export default Auth;