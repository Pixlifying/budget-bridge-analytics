
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import PageWrapper from '@/components/layout/PageWrapper';
import { Loader2, Eye, EyeOff, User, Shield, Mail } from 'lucide-react';

const UserAdmin = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  const { user, signOut, updatePassword, resetPassword } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      } else if (data) {
        setUsername(data.username || '');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await updatePassword(newPassword);
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Password updated successfully",
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      toast({
        title: "Error",
        description: "Username cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: username.trim(), updated_at: new Date().toISOString() })
        .eq('id', user?.id);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Username updated successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update username",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    try {
      const { error } = await resetPassword(resetEmail);
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Password reset email sent! Check your inbox.",
        });
        setResetEmail('');
        setShowResetForm(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send reset email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Success",
        description: "Signed out successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  return (
    <PageWrapper title="User Administration" icon={<User size={24} />}>
      <div className="max-w-4xl space-y-6">
        {/* User Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail size={20} />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input value={user?.email || ''} disabled className="bg-muted" />
              </div>
              <form onSubmit={handleUpdateUsername} className="space-y-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                  />
                </div>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Username
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        {/* Password Management Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield size={20} />
              Password Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </div>
              </div>

              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Forgot Password Card */}
        <Card>
          <CardHeader>
            <CardTitle>Forgot Password</CardTitle>
          </CardHeader>
          <CardContent>
            {!showResetForm ? (
              <Button
                onClick={() => setShowResetForm(true)}
                variant="outline"
              >
                Send Password Reset Email
              </Button>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <Label htmlFor="resetEmail">Email Address</Label>
                  <Input
                    id="resetEmail"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Reset Email
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowResetForm(false);
                      setResetEmail('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Sign Out Card */}
        <Card>
          <CardHeader>
            <CardTitle>Session Management</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={handleSignOut} variant="destructive">
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
};

export default UserAdmin;
