import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import {
  User,
  Shield,
  Save,
  Lock,
  Camera,
  Upload,
  Trash2,
  Image,
  Sparkles,
  Check,
  RefreshCw,
} from 'lucide-react';

const PRESET_AVATARS = [
  {
    id: 'dr_alex',
    label: 'Chief Scientist',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'sarah_pharma',
    label: 'Pharmacologist',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'doc_miller',
    label: 'Lab Director',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'scientist_female',
    label: 'Biochemist',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'researcher_male',
    label: 'Formulation Lead',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'clinical_lead',
    label: 'Clinical Lead',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'avatar_modern',
    label: 'Tech Specialist',
    url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'avatar_vector',
    label: 'Bio Vector',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ScientistFelix',
  },
];

export const SettingsView = () => {
  const { user, token, updateProfile, changePassword, uploadAvatar, logout } = useAuth();
  const { toast } = useToast();

  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    username: user?.username || '',
    email: user?.email || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        username: user.username || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (PNG, JPG, WebP, GIF).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be under 5MB.');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      await uploadAvatar(file);
      toast.success('Profile photo updated and saved to database!');
    } catch (err) {
      const detail = err.response?.data?.detail;
      toast.error(detail || err.message || 'Failed to upload photo.');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSelectPreset = async (url) => {
    setIsUploadingPhoto(true);
    try {
      await updateProfile({ avatar: url });
      toast.success('Avatar preset applied and saved to database!');
    } catch (err) {
      const detail = err.response?.data?.detail;
      toast.error(detail || err.message || 'Failed to update avatar.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleApplyCustomUrl = async (e) => {
    e.preventDefault();
    if (!customAvatarUrl.trim()) return;
    setIsUploadingPhoto(true);
    try {
      await updateProfile({ avatar: customAvatarUrl.trim() });
      toast.success('Custom photo URL saved to database!');
      setCustomAvatarUrl('');
      setShowUrlInput(false);
    } catch (err) {
      const detail = err.response?.data?.detail;
      toast.error(detail || err.message || 'Failed to update photo URL.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleResetAvatar = async () => {
    const defaultUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'user'}`;
    setIsUploadingPhoto(true);
    try {
      await updateProfile({ avatar: defaultUrl });
      toast.info('Profile photo reset to default avatar.');
    } catch (err) {
      toast.error('Failed to reset avatar.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await updateProfile(profileForm);
      toast.success('Profile details saved to database successfully!');
    } catch (err) {
      const detail = err.response?.data?.detail;
      const errorMsg = Array.isArray(detail)
        ? detail.map((d) => d.msg).join(', ')
        : detail || err.message || 'Failed to update profile.';
      toast.error(errorMsg);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword({
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      toast.success('Security password successfully updated in database!');
    } catch (err) {
      const detail = err.response?.data?.detail;
      const errorMsg = Array.isArray(detail)
        ? detail.map((d) => d.msg).join(', ')
        : detail || err.message || 'Failed to change password.';
      toast.error(errorMsg);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security & Auth', icon: Shield },
  ];

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
          Account & Portal Settings
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 mt-1">
          Manage your personal profile and security credentials
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-zinc-200 gap-2 sm:gap-6 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-xs sm:text-sm transition-all whitespace-nowrap focus:outline-none ${
                isActive
                  ? 'border-brand-500 text-brand-600 font-semibold'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Profile Settings */}
      {activeTab === 'profile' && (
        <div className="space-y-6 animate-fade-in">
          <Card>
            <CardHeader>
              <CardTitle>Public Profile</CardTitle>
              <CardDescription>
                This information is displayed on activity logs and team directories.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleProfileSave}>
              <CardContent className="space-y-6">
                {/* Photo Change Section */}
                <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200 bg-zinc-50/70 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left: Avatar with hover camera overlay & User info */}
                    <div className="flex items-center gap-4">
                      <div className="relative group shrink-0">
                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-brand-500 shadow-md bg-white">
                          <img
                            src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`}
                            alt={user?.name || user?.username}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Loading spinner overlay */}
                        {isUploadingPhoto && (
                          <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-xs">
                            <RefreshCw className="w-5 h-5 text-white animate-spin" />
                          </div>
                        )}

                        {/* Hover Camera Overlay */}
                        {!isUploadingPhoto && (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            title="Click to upload new photo"
                            className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity cursor-pointer backdrop-blur-[2px]"
                          >
                            <Camera className="w-5 h-5 mb-0.5" />
                            <span className="text-[9px] font-semibold tracking-wider uppercase">Change</span>
                          </button>
                        )}
                      </div>

                      <div>
                        <p className="text-base font-bold text-zinc-900 leading-snug">
                          {user?.name || user?.username}
                        </p>
                        <p className="text-xs text-zinc-500 font-mono mt-0.5">
                          {user?.email}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="primary" size="sm">
                            {user?.role || 'Member'}
                          </Badge>
                          <span className="text-[11px] text-zinc-400 font-mono">ID: {user?.id?.slice(0, 8)}...</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Photo Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="hidden"
                      />

                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        leftIcon={Upload}
                        isLoading={isUploadingPhoto}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Upload Photo
                      </Button>

                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        leftIcon={Sparkles}
                        onClick={() => setShowPresets(!showPresets)}
                      >
                        {showPresets ? 'Hide Presets' : 'Choose Preset'}
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        leftIcon={Image}
                        onClick={() => setShowUrlInput(!showUrlInput)}
                      >
                        Image URL
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-zinc-500 hover:text-rose-600 hover:bg-rose-50"
                        title="Reset to default avatar"
                        onClick={handleResetAvatar}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Collapsible: Preset Avatars Gallery */}
                  {showPresets && (
                    <div className="pt-3.5 border-t border-zinc-200 animate-slide-down">
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-xs font-semibold text-zinc-700">Select a Professional Avatar Preset</span>
                        <span className="text-[11px] text-zinc-400">Saves automatically on click</span>
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
                        {PRESET_AVATARS.map((p) => {
                          const isSelected = user?.avatar === p.url;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleSelectPreset(p.url)}
                              className={`group flex flex-col items-center p-1.5 rounded-xl border text-center transition-all ${
                                isSelected
                                  ? 'border-brand-500 bg-brand-50/80 ring-2 ring-brand-500/20 shadow-xs'
                                  : 'border-zinc-200 bg-white hover:border-brand-300 hover:bg-zinc-50'
                              }`}
                            >
                              <div className="w-12 h-12 rounded-full overflow-hidden mb-1 relative bg-zinc-100">
                                <img src={p.url} alt={p.label} className="w-full h-full object-cover" />
                                {isSelected && (
                                  <div className="absolute inset-0 bg-brand-600/40 flex items-center justify-center">
                                    <Check className="w-4 h-4 text-white drop-shadow-md stroke-[3]" />
                                  </div>
                                )}
                              </div>
                              <span className="text-[10px] font-medium text-zinc-600 truncate w-full group-hover:text-zinc-900">
                                {p.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Collapsible: Custom URL Input */}
                  {showUrlInput && (
                    <div className="pt-3 border-t border-zinc-200 animate-slide-down">
                      <div className="flex gap-2">
                        <Input
                          type="url"
                          placeholder="Paste image URL (https://example.com/photo.jpg)..."
                          value={customAvatarUrl}
                          onChange={(e) => setCustomAvatarUrl(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          size="md"
                          onClick={handleApplyCustomUrl}
                        >
                          Apply URL
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    placeholder="Alex Morgan"
                    required
                  />
                  <Input
                    label="Username"
                    value={profileForm.username}
                    onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                    placeholder="admin_alex"
                    required
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    placeholder="admin@example.com"
                    required
                    className="sm:col-span-2"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="submit" variant="primary" isLoading={isSavingProfile} leftIcon={Save}>
                  Save Profile
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}

      {/* Tab 2: Security & Password */}
      {activeTab === 'security' && (
        <div className="space-y-6 animate-fade-in">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Ensure your account uses a strong password with letters, numbers, and special characters.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handlePasswordChange}>
              <CardContent className="space-y-4 max-w-md">
                <Input
                  label="Current Password"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                  }
                  placeholder="••••••••"
                  showPasswordToggle
                  required
                />
                <Input
                  label="New Password"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                  }
                  placeholder="••••••••"
                  showPasswordToggle
                  required
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  value={passwordForm.confirmNewPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, confirmNewPassword: e.target.value })
                  }
                  placeholder="••••••••"
                  showPasswordToggle
                  required
                />
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isChangingPassword}
                  leftIcon={Lock}
                >
                  Update Password
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}

    </div>
  );
};

export default SettingsView;
