import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { profileAPI } from '../services/api';
import {
  ArrowLeft, User, Lock, Save, LayoutDashboard
} from 'lucide-react';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, loadUser } = useAuthStore();
  const addToast = useToastStore((s) => s.addToast);

  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await profileAPI.update({ name: name.trim() });
      await loadUser(); // Refresh user data
      addToast('Profile updated successfully!');
    } catch {
      addToast('Failed to update profile', 'error');
    }
    setSaving(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    setChangingPassword(true);
    setPasswordError('');
    try {
      await profileAPI.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      addToast('Password changed successfully!');
    } catch (err: any) {
      setPasswordError(err.response?.data?.error || 'Failed to change password');
    }
    setChangingPassword(false);
  };

  return (
    <div className="profile-page">
      <header className="dashboard-header">
        <div className="header-left">
          <button className="icon-btn" onClick={() => navigate('/')} id="back-btn">
            <ArrowLeft size={20} />
          </button>
          <LayoutDashboard size={28} className="header-logo" />
          <h1>Profile Settings</h1>
        </div>
      </header>

      <main className="profile-main">
        <div className="profile-card">
          <div className="profile-avatar">
            <div className="avatar avatar-xl">{user?.name?.charAt(0).toUpperCase()}</div>
            <h2>{user?.name}</h2>
            <p className="text-secondary">{user?.email}</p>
          </div>

          <form onSubmit={handleUpdateProfile} className="profile-form">
            <h3><User size={16} /> Edit Profile</h3>
            <div className="form-group">
              <label>Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                id="profile-name-input"
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving} id="save-profile-btn">
              <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>

          <form onSubmit={handleChangePassword} className="profile-form" style={{ borderTop: '1px solid var(--border, #1e293b)' }}>
            <h3><Lock size={16} /> Change Password</h3>
            {passwordError && <div className="auth-error">{passwordError}</div>}
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                id="current-password-input"
              />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                id="new-password-input"
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={changingPassword} id="change-password-btn">
              <Lock size={14} /> {changingPassword ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
