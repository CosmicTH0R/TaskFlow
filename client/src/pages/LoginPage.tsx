import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';
import { LayoutDashboard, Mail, Lock, User, ArrowRight, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';

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

      <div className="relative z-10 w-full max-w-md p-5">
        <Card className="bg-card/80 backdrop-blur-xl border-white/5 shadow-2xl">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center gap-2 text-2xl font-extrabold text-primary mb-2">
              <LayoutDashboard className="w-8 h-8" />
              <span>TaskFlow</span>
            </div>
            <CardDescription className="text-muted-foreground">
              {isSignup ? 'Create your account' : 'Welcome back'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-destructive/10 border border-destructive/30 text-destructive px-3 py-2 rounded-md text-sm animate-shake">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email-input" className="sr-only">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    id="email-input"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-9 bg-white/5 border-white/10 focus-visible:ring-primary/50"
                  />
                </div>
              </div>

              {isSignup && (
                <div className="space-y-2">
                  <Label htmlFor="name-input" className="sr-only">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      id="name-input"
                      placeholder="Full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="pl-9 bg-white/5 border-white/10 focus-visible:ring-primary/50"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password-input" className="sr-only">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="password"
                    id="password-input"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pl-9 bg-white/5 border-white/10 focus-visible:ring-primary/50"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full font-semibold" disabled={isLoading} id="auth-submit">
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {isSignup ? 'Create Account' : 'Sign In'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 pt-2">
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
              onClick={() => { setIsSignup(!isSignup); clearError(); }}
              id="auth-toggle"
            >
              {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>

            {!isSignup && (
              <button
                type="button"
                className="flex items-center gap-1.5 text-xs text-primary bg-primary/10 border border-primary/20 px-3 py-2 rounded-md hover:bg-primary/20 transition-colors"
                onClick={fillDemo}
                id="demo-fill"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Use demo credentials
              </button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
