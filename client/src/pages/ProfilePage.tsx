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
import { motion } from 'framer-motion';
import { PageTransition, FadeIn } from '../components/PageTransition';

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
    <PageTransition>
      <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
        <motion.header
          className="flex items-center gap-4 px-6 py-3 bg-card/80 backdrop-blur-md border-b border-white/5 shrink-0"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} id="back-btn" className="text-muted-foreground hover:text-foreground btn-press">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex flex-1 items-center gap-3">
            <motion.div
              whileHover={{ rotate: 15, scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <LayoutDashboard className="w-5 h-5 text-primary" />
            </motion.div>
            <h1 className="text-lg font-bold">Profile Settings</h1>
          </div>
        </motion.header>

        <main className="flex-1 flex items-center justify-center p-4 md:p-6 overflow-hidden">
          <div className="w-full max-w-5xl flex flex-col md:flex-row gap-5 h-full max-h-[480px]">

            {/* Left: Profile Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card className="md:w-72 shrink-0 bg-card/80 backdrop-blur-xl border-white/5 shadow-2xl glass-panel flex flex-col items-center justify-center p-8 text-center h-full">
                <div className="relative mb-4">
                  <Avatar className="w-24 h-24 text-3xl font-bold shadow-xl border-4 border-primary/20 animate-glow-pulse">
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <motion.div
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-green-500 border-4 border-card"
                    title="Online"
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </div>
                <h2 className="text-xl font-semibold">{user?.name}</h2>
                <p className="text-muted-foreground text-sm mb-4">{user?.email}</p>
                <Separator className="w-full bg-white/10 my-3" />
                <p className="text-xs text-muted-foreground">Member since 2026</p>
              </Card>
            </motion.div>

            {/* Right: Forms side by side */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5 min-w-0">
              {/* Edit Profile */}
              <FadeIn delay={0.2} direction="up">
                <Card className="bg-card/80 backdrop-blur-xl border-white/5 shadow-2xl glass-panel h-full">
                  <CardContent className="p-6 flex flex-col h-full">
                    <h3 className="flex items-center gap-2 text-base font-semibold mb-5">
                      <motion.div
                        className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        <User className="w-4 h-4 text-primary" />
                      </motion.div>
                      Edit Profile
                    </h3>
                    <form onSubmit={handleUpdateProfile} className="flex flex-col flex-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="profile-name-input" className="text-xs uppercase tracking-wider text-muted-foreground">Display Name</Label>
                        <div className="input-focus-glow rounded-md transition-shadow duration-300">
                          <Input
                            id="profile-name-input"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="bg-white/5 border-white/10 focus-visible:ring-primary/50 transition-all duration-300"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="profile-email-input" className="text-xs uppercase tracking-wider text-muted-foreground">Email Address</Label>
                        <div className="input-focus-glow rounded-md transition-shadow duration-300">
                          <Input
                            id="profile-email-input"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="bg-white/5 border-white/10 focus-visible:ring-primary/50 transition-all duration-300"
                          />
                        </div>
                      </div>
                      <div className="mt-auto pt-4">
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button type="submit" disabled={saving} id="save-profile-btn" className="w-full btn-press">
                            <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save Changes'}
                          </Button>
                        </motion.div>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </FadeIn>

              {/* Change Password */}
              <FadeIn delay={0.3} direction="up">
                <Card className="bg-card/80 backdrop-blur-xl border-white/5 shadow-2xl glass-panel h-full">
                  <CardContent className="p-6 flex flex-col h-full">
                    <h3 className="flex items-center gap-2 text-base font-semibold mb-5">
                      <motion.div
                        className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        <Lock className="w-4 h-4 text-primary" />
                      </motion.div>
                      Change Password
                    </h3>
                    <form onSubmit={handleChangePassword} className="flex flex-col flex-1 gap-4">
                      {passwordError && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="bg-destructive/10 border border-destructive/30 text-destructive px-3 py-2 rounded-md text-sm animate-shake"
                        >
                          {passwordError}
                        </motion.div>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="current-password-input" className="text-xs uppercase tracking-wider text-muted-foreground">Current Password</Label>
                        <div className="input-focus-glow rounded-md transition-shadow duration-300">
                          <Input
                            id="current-password-input"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                            className="bg-white/5 border-white/10 focus-visible:ring-primary/50 transition-all duration-300"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-password-input" className="text-xs uppercase tracking-wider text-muted-foreground">New Password</Label>
                        <div className="input-focus-glow rounded-md transition-shadow duration-300">
                          <Input
                            id="new-password-input"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            minLength={6}
                            className="bg-white/5 border-white/10 focus-visible:ring-primary/50 transition-all duration-300"
                          />
                        </div>
                      </div>
                      <div className="mt-auto pt-4">
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button type="submit" disabled={changingPassword} id="change-password-btn" className="w-full btn-press">
                            <Lock className="w-4 h-4 mr-2" /> {changingPassword ? 'Changing...' : 'Change Password'}
                          </Button>
                        </motion.div>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </FadeIn>
            </div>

          </div>
        </main>
      </div>
    </PageTransition>
  );
}
