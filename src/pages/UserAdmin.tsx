
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import PageHeader from '@/components/layout/PageHeader';
import PageWrapper from '@/components/layout/PageWrapper';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, Calendar, Shield, LogOut, Camera, Trash2 } from 'lucide-react';

interface UserAdminData {
  id: string;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
  last_login: string | null;
  is_active: boolean;
  profile_image_url: string | null;
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
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      setUserData(data as UserAdminData);
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userData) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setIsUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `profile-${userData.id}-${Date.now()}.${fileExt}`;

      // Delete old image if exists
      if (userData.profile_image_url) {
        const oldPath = userData.profile_image_url.split('/profile-images/')[1];
        if (oldPath) {
          await supabase.storage.from('profile-images').remove([oldPath]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('user_admin')
        .update({ profile_image_url: urlData.publicUrl, updated_at: new Date().toISOString() })
        .eq('id', userData.id);

      if (updateError) throw updateError;

      toast.success('Profile image updated');
      await fetchUserData();
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteImage = async () => {
    if (!userData?.profile_image_url) return;

    setIsUploadingImage(true);
    try {
      const oldPath = userData.profile_image_url.split('/profile-images/')[1];
      if (oldPath) {
        await supabase.storage.from('profile-images').remove([oldPath]);
      }

      const { error } = await supabase
        .from('user_admin')
        .update({ profile_image_url: null, updated_at: new Date().toISOString() })
        .eq('id', userData.id);

      if (error) throw error;

      toast.success('Profile image removed');
      await fetchUserData();
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to remove image');
    } finally {
      setIsUploadingImage(false);
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
      <PageWrapper title="User Admin">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </PageWrapper>
    );
  }

  if (!userData) {
    return (
      <PageWrapper title="User Admin">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-lg text-destructive">Failed to load user data</div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="User Admin" subtitle="Manage your account settings and information">
      <PageHeader title="User Admin" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Profile Image Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Profile Image
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Avatar className="h-24 w-24 border-2 border-border">
                <AvatarImage src={userData.profile_image_url || undefined} alt={userData.username} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {userData.username?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground text-center sm:text-left">
                  Upload a profile picture. Max size 5MB. JPG, PNG or WebP.
                </p>
                <div className="flex gap-2 justify-center sm:justify-start">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <Button
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                  >
                    <Camera size={16} className="mr-1" />
                    {isUploadingImage ? 'Uploading...' : userData.profile_image_url ? 'Change' : 'Upload'}
                  </Button>
                  {userData.profile_image_url && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleDeleteImage}
                      disabled={isUploadingImage}
                    >
                      <Trash2 size={16} className="mr-1" />
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
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
                    <User className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{userData.username}</span>
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
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-md overflow-hidden">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{userData.email}</span>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                <Calendar className="h-4 w-4 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-medium">Created</div>
                  <div className="text-sm text-muted-foreground truncate">
                    {new Date(userData.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                <Calendar className="h-4 w-4 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-medium">Last Updated</div>
                  <div className="text-sm text-muted-foreground truncate">
                    {new Date(userData.updated_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
              <Shield className="h-4 w-4 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium">Account Status</div>
                <div className={`text-sm ${userData.is_active ? 'text-green-600' : 'text-red-600'}`}>
                  {userData.is_active ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>

            {userData.last_login && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                <Calendar className="h-4 w-4 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-medium">Last Login</div>
                  <div className="text-sm text-muted-foreground truncate">
                    {new Date(userData.last_login).toLocaleString()}
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <Button 
                variant="destructive" 
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
};

export default UserAdmin;
