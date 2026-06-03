import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';

function AdminDashboard() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('Class Notice'); 
    const [file, setFile] = useState(null);
    const [statusMsg, setStatusMsg] = useState({ text: '', isError: false });
    const [isLoading, setIsLoading] = useState(false);
    
    // Management state to hold all existing posts
    const [existingPosts, setExistingPosts] = useState([]);

    // Fetch existing posts automatically so the admin can manage them
    const fetchPosts = async () => {
        try {
            const response = await fetch('http:/tha082bme.onrender.com/api/announcements');
            const data = await response.json();
            if (response.ok) setExistingPosts(data);
        } catch (err) {
            console.error("Could not fetch management log stream:", err);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handlePostAnnouncement = async (e) => {
        e.preventDefault();
        setStatusMsg({ text: '', isError: false });
        setIsLoading(true);

        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        formData.append('category', category);
        formData.append('token', localStorage.getItem('token'));
        if (file) {
            formData.append('file', file);
        }

        try {
            const response = await fetch('http:/tha082bme.onrender.com/api/announcements', {
                method: 'POST',
                body: formData 
            });

            const data = await response.json();

            if (response.ok) {
                setStatusMsg({ text: `🚀 ${category} published successfully!`, isError: false });
                setTitle('');
                setContent('');
                setFile(null);
                document.getElementById('file-field').value = '';
                fetchPosts(); // 🌟 Refresh the list immediately on a new upload!
            } else {
                setStatusMsg({ text: `❌ Error: ${data.message}`, isError: true });
            }
        } catch (err) {
            setStatusMsg({ text: '❌ System offline.', isError: true });
        } finally {
            setIsLoading(false);
        }
    };

    // 🌟 NEW: Handle direct server removal request
    const handleDeletePost = async (postId) => {
        if (!window.confirm("Are you sure you want to permanently delete this resource card?")) return;

        try {
            const response = await fetch(`http:/tha082bme.onrender.com/api/announcements/${postId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (response.ok) {
                setStatusMsg({ text: "🗑️ Announcement scrubbed from resource feed successfully.", isError: false });
                fetchPosts(); // 🌟 Refresh the list immediately!
            } else {
                setStatusMsg({ text: `❌ Delete failed: ${data.message}`, isError: true });
            }
        } catch (err) {
            setStatusMsg({ text: '❌ Network failure during deletion.', isError: true });
        }
    };

    return (
        <div className="admin-page-wrapper">
            <div className="admin-header-zone-global">
                <h2 className="admin-title">Admin Operations Console</h2>
                <p className="admin-subtitle">Publish new resources or wipe out obsolete announcements from the central student hub.</p>
                {statusMsg.text && (
                    <div className={`status-banner ${statusMsg.isError ? 'error-banner' : 'success-banner'}`}>
                        {statusMsg.text}
                    </div>
                )}
            </div>

            <div className="admin-split-layout">
                {/* LEFT SIDE: CREATION FORM */}
                <div className="admin-glass-card">
                    <h3 className="section-panel-title">Publish Channel Dispatch</h3>
                    <form className="admin-form" onSubmit={handlePostAnnouncement}>
                        <div className="admin-input-group">
                            <label>Post Category</label>
                            <select value={category} onChange={(e) => setCategory(e.target.value)} disabled={isLoading}>
                                <option value="Class Notice">📢 Class Notice</option>
                                <option value="Assignment Notice">📝 Assignment Notice</option>
                                <option value="Routine">📅 Routine Change</option>
                                <option value="Class Notes">📚 Class Notes (PDF/Image)</option>
                                <option value="Essentials">🔑 Essentials (Syllabus/Large Files)</option>
                            </select>
                        </div>

                        <div className="admin-input-group">
                            <label>Title</label>
                            <input 
                                type="text" 
                                placeholder="Title header..." 
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required 
                                disabled={isLoading}
                            />
                        </div>

                        <div className="admin-input-group">
                            <label>Detailed Explanation</label>
                            <textarea 
                                placeholder="Write descriptions or notes information..." 
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                required 
                                rows="4"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="admin-input-group">
                            <label>Attach Resource File (Optional PDF/Image)</label>
                            <input 
                                id="file-field"
                                type="file" 
                                accept=".pdf, .png, .jpg, .jpeg"
                                onChange={(e) => setFile(e.target.files[0])}
                                disabled={isLoading}
                            />
                        </div>

                        <button type="submit" className="admin-submit-btn" disabled={isLoading}>
                            {isLoading ? 'Uploading...' : 'Publish Content'}
                        </button>
                    </form>
                </div>

                {/* RIGHT SIDE: LIVE MANAGEMENT LOG */}
                <div className="admin-glass-card management-log-panel">
                    <h3 className="section-panel-title">Live Channel Control Feed</h3>
                    <div className="management-scroll-container">
                        {existingPosts.length === 0 ? (
                            <p className="no-posts-admin-text">No active dispatches are live on the server stream.</p>
                        ) : (
                            existingPosts.map((post) => (
                                <div key={post.id} className="admin-manage-card">
                                    <div className="manage-card-info">
                                        <span className="manage-tag">{post.category}</span>
                                        <h4>{post.title}</h4>
                                        <p>{post.content.substring(0, 60)}{post.content.length > 60 ? '...' : ''}</p>
                                    </div>
                                    <button 
                                        className="admin-delete-inline-btn"
                                        onClick={() => handleDeletePost(post.id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;