import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';
import { LayoutDashboard, Mail, Lock, User, ArrowRight, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
  const { login, signup, token, isLoading, error, clearError } = useAuthStore();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  if (token) return <Navigate to="/" />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isSignup) {
        await signup(email, name, password);
        toast.success('Account created successfully!');
      } else {
        await login(email, password);
        toast.success('Welcome back!');
      }
    } catch (err: any) {
      // Error is handled by the store but we can catch any remaining ones
    }
  };

  const fillDemo = () => {
    setEmail('demo@example.com');
    setPassword('password123');
    setIsSignup(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
      {/* Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute rounded-full blur-[80px] opacity-40 animate-float w-[400px] h-[400px] bg-[#6366f1] -top-[100px] -right-[100px]" style={{ animationDelay: '0s' }} />
        <div className="absolute rounded-full blur-[80px] opacity-40 animate-float w-[300px] h-[300px] bg-[#ec4899] -bottom-[50px] -left-[50px]" style={{ animationDelay: '-3s' }} />
        <div className="absolute rounded-full blur-[80px] opacity-40 animate-float w-[200px] h-[200px] bg-[#14b8a6] top-[50%] left-[50%]" style={{ animationDelay: '-5s' }} />
      </div>

      <motion.div
        className="relative z-10 w-full max-w-md p-5"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <Card className="bg-card/80 backdrop-blur-xl border-white/5 shadow-2xl overflow-hidden">
          <CardHeader className="text-center pb-6">
            <motion.div
              className="flex items-center justify-center gap-2 text-2xl font-extrabold text-primary mb-2"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
            >
              <motion.div
                whileHover={{ rotate: 15, scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <LayoutDashboard className="w-8 h-8" />
              </motion.div>
              <span>TaskFlow</span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <CardDescription className="text-muted-foreground">
                {isSignup ? 'Create your account' : 'Welcome back'}
              </CardDescription>
            </motion.div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-destructive/10 border border-destructive/30 text-destructive px-3 py-2 rounded-md text-sm animate-shake"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <Label htmlFor="email-input" className="sr-only">Email</Label>
                <div className="relative input-focus-glow rounded-md transition-shadow duration-300">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    id="email-input"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-9 bg-white/5 border-white/10 focus-visible:ring-primary/50 transition-all duration-300"
                  />
                </div>
              </motion.div>

              <AnimatePresence>
                {isSignup && (
                  <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Label htmlFor="name-input" className="sr-only">Full Name</Label>
                    <div className="relative input-focus-glow rounded-md transition-shadow duration-300">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="text"
                        id="name-input"
                        placeholder="Full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="pl-9 bg-white/5 border-white/10 focus-visible:ring-primary/50 transition-all duration-300"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <Label htmlFor="password-input" className="sr-only">Password</Label>
                <div className="relative input-focus-glow rounded-md transition-shadow duration-300">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="password"
                    id="password-input"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pl-9 bg-white/5 border-white/10 focus-visible:ring-primary/50 transition-all duration-300"
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55, duration: 0.4 }}
              >
                <Button
                  type="submit"
                  className="w-full font-semibold btn-press group relative overflow-hidden"
                  disabled={isLoading}
                  id="auth-submit"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <span className="relative flex items-center justify-center">
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        {isSignup ? 'Create Account' : 'Sign In'}
                        <motion.span
                          className="inline-flex ml-2"
                          whileHover={{ x: 4 }}
                          transition={{ type: 'spring', stiffness: 400 }}
                        >
                          <ArrowRight className="w-4 h-4" />
                        </motion.span>
                      </>
                    )}
                  </span>
                </Button>
              </motion.div>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 pt-2">
            <motion.button
              type="button"
              className="text-sm text-muted-foreground hover:text-primary transition-colors relative group"
              onClick={() => { setIsSignup(!isSignup); clearError(); }}
              id="auth-toggle"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              <span className="absolute -bottom-0.5 left-0 w-0 h-[1px] bg-primary group-hover:w-full transition-all duration-300" />
            </motion.button>

            <AnimatePresence>
              {!isSignup && (
                <motion.button
                  type="button"
                  className="flex items-center gap-1.5 text-xs text-primary bg-primary/10 border border-primary/20 px-3 py-2 rounded-md hover:bg-primary/20 transition-colors shimmer-effect btn-press"
                  onClick={fillDemo}
                  id="demo-fill"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Use demo credentials
                </motion.button>
              )}
            </AnimatePresence>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
