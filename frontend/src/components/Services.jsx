import React, { useState, useEffect } from 'react';
import './Services.css';

function Services() {
    const [announcements, setAnnouncements] = useState([]);
    const [activeChannel, setActiveChannel] = useState('All Channels');
    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    // List of target channels matching database profiles exactly
    const channels = [
        { id: 'All Channels', label: '📱 All Updates', color: '#64748B', path: '/' },
        { id: 'Class Notice', label: '📢 General Notices', color: '#0076FF', path: '/class-notices' },
        { id: 'Assignment Notice', label: '📝 Assignments', color: '#FF9500', path: '/assignment-notices' },
        { id: 'Routine', label: '📅 Routines / Schedule', color: '#34C759', path: '/routines' },
        { id: 'Class Notes', label: '📚 Lecture Notes', color: '#8900FF', path: '/class-notes' },
        { id: 'Essentials', label: '🔑 Core Essentials', color: '#FF2D55', path: '/essentials' }
    ];

    // 🌟 1. Read URL path on initialization mount
    useEffect(() => {
        const currentPath = window.location.pathname;
        const matchedChannel = channels.find(c => c.path === currentPath);
        if (matchedChannel) {
            setActiveChannel(matchedChannel.id);
        }

        // Fetch updates from central server API
        fetch('https://tha082bme.onrender.com/api/announcements')
            .then((res) => {
                if (!res.ok) throw new Error('Failed to retrieve campus resource feed.');
                return res.json();
            })
            .then((data) => {
                setAnnouncements(data);
                setIsLoading(false);
            })
            .catch((err) => {
                setErrorMsg(err.message);
                setIsLoading(false);
            });
    }, []);

    // 🌟 2. Handle interactive Tab updates + Push matching clean URLs
    const handleChannelSwitch = (channelId, pathString) => {
        setActiveChannel(channelId);
        // Shifts URL in browser top bar instantly without refreshing or unmounting React states
        window.history.pushState({}, '', pathString);
    };

    // Filter announcements based on active route state selection
    const filteredAnnouncements = activeChannel === 'All Channels'
        ? announcements
        : announcements.filter(item => item.category === activeChannel);

    return (
        <section className="services-section" id="services">
            <div className="services-container">
                
                {/* Channel Sidebar Controller */}
                <div className="channels-sidebar">
                    <h3 className="sidebar-title">Resource Hub</h3>
                    <p className="sidebar-subtitle">Select a stream channel to filter resources.</p>
                    <div className="channel-tabs-list">
                        {channels.map((chan) => (
                            <button
                                key={chan.id}
                                className={`channel-tab-item ${activeChannel === chan.id ? 'active' : ''}`}
                                onClick={() => handleChannelSwitch(chan.id, chan.path)}
                            >
                                <span className="tab-label">{chan.label}</span>
                                <span className="tab-badge-count">
                                    {chan.id === 'All Channels' 
                                        ? announcements.length 
                                        : announcements.filter(a => a.category === chan.id).length}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Stream Feed */}
                <div className="feed-display-zone">
                    <h2 className="feed-header-title">{activeChannel} Stream</h2>
                    
                    {isLoading && (
                        <div className="feed-status-placeholder">
                            <div className="loading-spinner"></div>
                            <p>Connecting to Thapathali resource matrix...</p>
                        </div>
                    )}

                    {errorMsg && (
                        <div className="feed-error-placeholder">
                            <p>⚠️ {errorMsg}</p>
                        </div>
                    )}

                    {!isLoading && !errorMsg && filteredAnnouncements.length === 0 && (
                        <div className="feed-empty-placeholder">
                            <p>📭 No items have been dispatched to this channel yet.</p>
                        </div>
                    )}

                    {!isLoading && !errorMsg && filteredAnnouncements.map((item) => (
                        <div key={item.id} className="announcement-card-item">
                            <div className="card-top-row">
                                <span 
                                    className="card-category-tag" 
                                    style={{ 
                                        backgroundColor: `${channels.find(c => c.id === item.category)?.color}15`,
                                        color: channels.find(c => c.id === item.category)?.color
                                    }}
                                >
                                    {item.category}
                                </span>
                                <span className="card-timestamp">
                                    {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                            </div>

                            <h3 className="card-post-title">{item.title}</h3>
                            <p className="card-post-content">{item.content}</p>

                            {item.file_url && (
                                <div className="card-attachment-wrapper">
                                    <a 
                                        href={`https://tha082bme.onrender.com${item.file_url}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="card-download-btn"
                                    >
                                        📥 Download Attached Reference File
                                    </a>
                                </div>
                            )}

                            <div className="card-footer-attribution">
                                Verified Post By: <strong>{item.posted_by || 'Department Admin'}</strong>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </section>
    );
}

export default Services;