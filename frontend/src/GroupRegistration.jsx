import React, { useState } from 'react';

// 🔗 Replace with your actual Google Apps Script Web App URL
const GOOGLE_SCRIPT_URL = "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL";

export default function GroupRegistration() {
  const [groupName, setGroupName] = useState('');
  const [leaderName, setLeaderName] = useState('');
  const [leaderEmail, setLeaderEmail] = useState('');
  const [members, setMembers] = useState(['']); // Starts with 1 member slot
  const [status, setStatus] = useState({ loading: false, success: null, error: null });

  // Handle dynamic member row inputs
  const handleMemberChange = (index, value) => {
    const updated = [...members];
    updated[index] = value;
    setMembers(updated);
  };

  const addMemberSlot = () => setMembers([...members, '']);
  const removeMemberSlot = (index) => {
    if (members.length > 1) {
      setMembers(members.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, success: null, error: null });

    const payload = {
      groupName,
      leaderName,
      leaderEmail,
      members: members.filter(m => m.trim() !== '') // Remove blank entries
    };

    try {
      // 'no-cors' mode is required when calling Google Apps Scripts directly from browser
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      setStatus({ 
        loading: false, 
        success: 'Group registered successfully! Check your Google Sheet to verify.', 
        error: null 
      });

      // Reset form fields
      setGroupName('');
      setLeaderName('');
      setLeaderEmail('');
      setMembers(['']);

    } catch (err) {
      setStatus({ 
        loading: false, 
        success: null, 
        error: 'Failed to submit group data. Please try again.' 
      });
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Project Group Registration</h2>
      <p style={styles.subtitle}>Department of Mechanical Engineering (082 BME)</p>

      {status.success && <div style={styles.alertSuccess}>{status.success}</div>}
      {status.error && <div style={styles.alertError}>{status.error}</div>}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.group}>
          <label style={styles.label}>Group / Team Name</label>
          <input 
            type="text" 
            required 
            placeholder="e.g., Team AeroMech" 
            value={groupName} 
            onChange={(e) => setGroupName(e.target.value)} 
            style={styles.input}
          />
        </div>

        <div style={styles.group}>
          <label style={styles.label}>Group Leader Name</label>
          <input 
            type="text" 
            required 
            placeholder="e.g., Aayush Adhikari" 
            value={leaderName} 
            onChange={(e) => setLeaderName(e.target.value)} 
            style={styles.input}
          />
        </div>

        <div style={styles.group}>
          <label style={styles.label}>Leader Campus Email</label>
          <input 
            type="email" 
            required 
            placeholder="name.082bme001@tcioe.edu.np" 
            value={leaderEmail} 
            onChange={(e) => setLeaderEmail(e.target.value)} 
            style={styles.input}
          />
        </div>

        <div style={styles.group}>
          <label style={styles.label}>Team Members</label>
          {members.map((member, idx) => (
            <div key={idx} style={styles.memberRow}>
              <input 
                type="text" 
                placeholder={`Member ${idx + 1} Name`} 
                value={member} 
                onChange={(e) => handleMemberChange(idx, e.target.value)} 
                style={styles.input}
                required
              />
              {members.length > 1 && (
                <button 
                  type="button" 
                  onClick={() => removeMemberSlot(idx)} 
                  style={styles.removeBtn}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addMemberSlot} style={styles.addBtn}>
            + Add Another Member
          </button>
        </div>

        <button type="submit" disabled={status.loading} style={styles.submitBtn}>
          {status.loading ? 'Registering Group...' : 'Submit Group Registration'}
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: { maxWidth: '520px', margin: '40px auto', padding: '30px', background: '#FFFFFF', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0', fontFamily: 'sans-serif' },
  title: { margin: '0 0 6px 0', fontSize: '22px', fontWeight: '800', color: '#0F172A' },
  subtitle: { margin: '0 0 24px 0', fontSize: '13px', color: '#64748B' },
  form: { display: 'flex', flexDirection: 'column', gap: '18px' },
  group: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '700', color: '#334155' },
  input: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none' },
  memberRow: { display: 'flex', gap: '8px', marginBottom: '8px' },
  addBtn: { background: 'none', border: 'none', color: '#0076FF', fontSize: '13px', fontWeight: '700', cursor: 'pointer', textAlign: 'left', padding: '0' },
  removeBtn: { background: '#FEE2E2', border: 'none', color: '#EF4444', borderRadius: '8px', padding: '0 12px', cursor: 'pointer', fontWeight: '700' },
  submitBtn: { background: '#0076FF', color: '#FFF', border: 'none', padding: '12px', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', marginTop: '10px' },
  alertSuccess: { padding: '12px', background: '#DCFCE7', color: '#166534', borderRadius: '8px', fontSize: '13px', marginBottom: '15px' },
  alertError: { padding: '12px', background: '#FEE2E2', color: '#991B1B', borderRadius: '8px', fontSize: '13px', marginBottom: '15px' }
};