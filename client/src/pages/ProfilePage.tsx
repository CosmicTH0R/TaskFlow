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
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setSaving(true);
    try {
      await profileAPI.update({ name: name.trim(), email: email.trim() });
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
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
      <header className="flex items-center gap-4 px-6 py-3 bg-card/80 backdrop-blur-md border-b border-white/5 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} id="back-btn" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex flex-1 items-center gap-3">
          <LayoutDashboard className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold">Profile Settings</h1>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 md:p-6 overflow-hidden">
        <div className="w-full max-w-5xl flex flex-col md:flex-row gap-5 h-full max-h-[480px]">

          {/* Left: Profile Card */}
          <Card className="md:w-72 shrink-0 bg-card/80 backdrop-blur-xl border-white/5 shadow-2xl glass-panel flex flex-col items-center justify-center p-8 text-center">
            <div className="relative mb-4">
              <Avatar className="w-24 h-24 text-3xl font-bold shadow-xl border-4 border-primary/20">
                <AvatarFallback className="bg-primary/20 text-primary">
                  {user?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-green-500 border-4 border-card" title="Online" />
            </div>
            <h2 className="text-xl font-semibold">{user?.name}</h2>
            <p className="text-muted-foreground text-sm mb-4">{user?.email}</p>
            <Separator className="w-full bg-white/10 my-3" />
            <p className="text-xs text-muted-foreground">Member since 2026</p>
          </Card>

          {/* Right: Forms side by side */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5 min-w-0">
            {/* Edit Profile */}
            <Card className="bg-card/80 backdrop-blur-xl border-white/5 shadow-2xl glass-panel">
              <CardContent className="p-6 flex flex-col h-full">
                <h3 className="flex items-center gap-2 text-base font-semibold mb-5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  Edit Profile
                </h3>
                <form onSubmit={handleUpdateProfile} className="flex flex-col flex-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="profile-name-input" className="text-xs uppercase tracking-wider text-muted-foreground">Display Name</Label>
                    <Input
                      id="profile-name-input"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="bg-white/5 border-white/10 focus-visible:ring-primary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-email-input" className="text-xs uppercase tracking-wider text-muted-foreground">Email Address</Label>
                    <Input
                      id="profile-email-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-white/5 border-white/10 focus-visible:ring-primary/50"
                    />
                  </div>
                  <div className="mt-auto pt-4">
                    <Button type="submit" disabled={saving} id="save-profile-btn" className="w-full">
                      <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Change Password */}
            <Card className="bg-card/80 backdrop-blur-xl border-white/5 shadow-2xl glass-panel">
              <CardContent className="p-6 flex flex-col h-full">
                <h3 className="flex items-center gap-2 text-base font-semibold mb-5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-primary" />
                  </div>
                  Change Password
                </h3>
                <form onSubmit={handleChangePassword} className="flex flex-col flex-1 gap-4">
                  {passwordError && (
                    <div className="bg-destructive/10 border border-destructive/30 text-destructive px-3 py-2 rounded-md text-sm animate-shake">
                      {passwordError}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="current-password-input" className="text-xs uppercase tracking-wider text-muted-foreground">Current Password</Label>
                    <Input
                      id="current-password-input"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      className="bg-white/5 border-white/10 focus-visible:ring-primary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password-input" className="text-xs uppercase tracking-wider text-muted-foreground">New Password</Label>
                    <Input
                      id="new-password-input"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      className="bg-white/5 border-white/10 focus-visible:ring-primary/50"
                    />
                  </div>
                  <div className="mt-auto pt-4">
                    <Button type="submit" disabled={changingPassword} id="change-password-btn" className="w-full">
                      <Lock className="w-4 h-4 mr-2" /> {changingPassword ? 'Changing...' : 'Change Password'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
    </div>
  );
}
