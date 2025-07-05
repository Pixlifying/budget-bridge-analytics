
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import PageHeader from '@/components/layout/PageHeader';
import PageWrapper from '@/components/layout/PageWrapper';
import { User, Mail, Calendar, Shield, LogOut } from 'lucide-react';

interface UserAdminData {
  id: string;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
  last_login: string | null;
  is_active: boolean;
}

const UserAdmin = () => {
  const [userData, setUserData] = useState<UserAdminData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data, error } = await supabase
        .from('user_admin')
        .select('*')
        .single();

      if (error) {
        console.error('Error fetching user data:', error);
        toast.error('Failed to load user data');
        return;
      }

      setUserData(data);
      setFormData({
        username: data.username,
        email: data.email
      });
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!userData) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('user_admin')
        .update({
          username: formData.username,
          email: formData.email,
          updated_at: new Date().toISOString()
        })
        .eq('id', userData.id);

      if (error) {
        console.error('Error updating user data:', error);
        toast.error('Failed to update user data');
        return;
      }

      // Update localStorage with new credentials
      localStorage.setItem('site_username', formData.username);
      localStorage.setItem('site_email', formData.email);

      toast.success('User data updated successfully');
      await fetchUserData();
      setIsEditing(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to update user data');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('site_authenticated');
    toast.success('Logged out successfully');
    window.location.reload();
  };

  const handleCancel = () => {
    if (userData) {
      setFormData({
        username: userData.username,
        email: userData.email
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center min-h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </PageWrapper>
    );
  }

  if (!userData) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center min-h-64">
          <div className="text-lg text-red-600">Failed to load user data</div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <PageHeader
        title="User Admin"
        description="Manage your account settings and information"
      />

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Account Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="username">Username</Label>
                {isEditing ? (
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Enter username"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                    <User className="h-4 w-4" />
                    <span>{userData.username}</span>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                {isEditing ? (
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                    <Mail className="h-4 w-4" />
                    <span>{userData.email}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              {isEditing ? (
                <>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  Edit Information
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Account Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Account Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                <Calendar className="h-4 w-4" />
                <div>
                  <div className="text-sm font-medium">Created</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(userData.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                <Calendar className="h-4 w-4" />
                <div>
                  <div className="text-sm font-medium">Last Updated</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(userData.updated_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
              <Shield className="h-4 w-4" />
              <div>
                <div className="text-sm font-medium">Account Status</div>
                <div className={`text-sm ${userData.is_active ? 'text-green-600' : 'text-red-600'}`}>
                  {userData.is_active ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>

            {userData.last_login && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                <Calendar className="h-4 w-4" />
                <div>
                  <div className="text-sm font-medium">Last Login</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(userData.last_login).toLocaleString()}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Account Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              variant="destructive" 
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
};

export default UserAdmin;
