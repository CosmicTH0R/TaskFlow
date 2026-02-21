import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';
import { profileAPI } from '../services/api';
import { ArrowLeft, User, Lock, Save, LayoutDashboard } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, loadUser } = useAuthStore();
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
      toast.success('Profile updated successfully!');
    } catch {
      toast.error('Failed to update profile');
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
      toast.success('Password changed successfully!');
    } catch (err: any) {
      setPasswordError(err.response?.data?.error || 'Failed to change password');
    }
    setChangingPassword(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="flex items-center gap-4 px-6 py-4 bg-card border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} id="back-btn" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex flex-1 items-center gap-3">
          <LayoutDashboard className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold">Profile Settings</h1>
        </div>
      </header>

      <main className="flex-1 p-6 md:p-8 flex justify-center items-start overflow-y-auto">
        <Card className="w-full max-w-lg bg-card/80 backdrop-blur-xl border-white/5 shadow-2xl glass-panel">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col items-center text-center mb-8">
              <Avatar className="w-24 h-24 mb-4 text-3xl font-bold shadow-lg border-2 border-primary/20">
                <AvatarFallback className="bg-primary/20 text-primary">
                  {user?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-2xl font-semibold mb-1">{user?.name}</h2>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4 mb-8">
              <h3 className="flex items-center gap-2 text-lg font-medium text-foreground mb-4">
                <User className="w-5 h-5 text-primary" /> Edit Profile
              </h3>
              <div className="space-y-2">
                <Label htmlFor="profile-name-input">Display Name</Label>
                <Input
                  id="profile-name-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="bg-white/5"
                />
              </div>
              <Button type="submit" disabled={saving} id="save-profile-btn" className="w-full sm:w-auto">
                <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>

            <Separator className="my-8 bg-white/10" />

            <form onSubmit={handleChangePassword} className="space-y-4">
              <h3 className="flex items-center gap-2 text-lg font-medium text-foreground mb-4">
                <Lock className="w-5 h-5 text-primary" /> Change Password
              </h3>
              
              {passwordError && (
                <div className="bg-destructive/10 border border-destructive/30 text-destructive px-3 py-2 rounded-md text-sm animate-shake">
                  {passwordError}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="current-password-input">Current Password</Label>
                <Input
                  id="current-password-input"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="bg-white/5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password-input">New Password</Label>
                <Input
                  id="new-password-input"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="bg-white/5"
                />
              </div>
              <Button type="submit" disabled={changingPassword} id="change-password-btn" className="w-full sm:w-auto">
                <Lock className="w-4 h-4 mr-2" /> {changingPassword ? 'Changing...' : 'Change Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
