'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Camera,
  Check,
  Copy,
  User,
  AtSign,
  Sparkles,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertTriangle,
  Pencil,
  Wand2,
  Trash2,
  Upload,
  Loader2,
  X,
} from 'lucide-react';
import { profileUpdateSchema, ProfileUpdateFormData } from '@/lib/validations/auth';
import { useAuth } from '@/context/auth-context';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog } from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';
import { generateSecretKey } from '@/lib/secret-key';

const PRESET_AVATARS = [
  { id: '1', label: 'Elegance', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=face' },
  { id: '2', label: 'Casual', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=256&h=256&fit=crop&crop=face' },
  { id: '3', label: 'Joy', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=256&h=256&fit=crop&crop=face' },
  { id: '4', label: 'Artisan', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&h=256&fit=crop&crop=face' },
  { id: '5', label: 'Glow', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop&crop=face' },
  { id: '6', label: 'Serene', url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=256&h=256&fit=crop&crop=face' },
  { id: '7', label: 'Vibrant', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&h=256&fit=crop&crop=face' },
  { id: '8', label: 'Chic', url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=256&h=256&fit=crop&crop=face' },
];

export default function ProfileSettingsPage() {
  const { profile, updateProfile } = useAuth();
  const [isSaving, setIsSaving] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [copiedUsername, setCopiedUsername] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState(false);

  // Avatar state
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);
  const [showPresetsModal, setShowPresetsModal] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Secret Key State
  const [secretKey, setSecretKey] = React.useState<string | null>(null);
  const [hasSecretKey, setHasSecretKey] = React.useState<boolean>(false);
  const [isLoadingKey, setIsLoadingKey] = React.useState<boolean>(true);
  const [isSavingKey, setIsSavingKey] = React.useState<boolean>(false);
  const [isDeletingKey, setIsDeletingKey] = React.useState<boolean>(false);
  const [isEditingKey, setIsEditingKey] = React.useState<boolean>(false);

  // User input for secret key
  const [inputSecretKey, setInputSecretKey] = React.useState<string>('');
  const [showInputKey, setShowInputKey] = React.useState<boolean>(true);
  const [showSavedKey, setShowSavedKey] = React.useState<boolean>(false);
  const [copiedSecretKey, setCopiedSecretKey] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState<boolean>(false);

  // Fetch active secret key
  const fetchSecretKey = React.useCallback(async () => {
    if (!profile?.id) return;
    try {
      setIsLoadingKey(true);
      const res = await fetch('/api/auth/secret-key', {
        headers: {
          'x-user-id': profile.id,
        },
      });
      if (res.ok) {
        const data = await res.json();
        const hasKey = !!data.hasKey;
        setHasSecretKey(hasKey);
        setSecretKey(data.secretKey || null);
        if (!hasKey) {
          setIsEditingKey(true);
        }
      }
    } catch (err) {
      console.warn('Failed to load secret key:', err);
    } finally {
      setIsLoadingKey(false);
    }
  }, [profile?.id]);

  React.useEffect(() => {
    fetchSecretKey();
  }, [fetchSecretKey]);

  // Save user-created secret key
  const handleSaveSecretKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    const trimmed = inputSecretKey.trim();
    if (!trimmed) {
      toast.error('Please enter a Secret Key.');
      return;
    }
    if (trimmed.length < 4) {
      toast.error('Secret Key must be at least 4 characters long.');
      return;
    }
    if (trimmed.length > 64) {
      toast.error('Secret Key cannot exceed 64 characters.');
      return;
    }

    setIsSavingKey(true);
    try {
      const res = await fetch('/api/auth/secret-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': profile.id,
        },
        body: JSON.stringify({ secretKey: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to save secret key');
      } else {
        setHasSecretKey(true);
        setSecretKey(data.secretKey);
        setIsEditingKey(false);
        setInputSecretKey('');
        toast.success('Your Secret Key has been saved! You can now use it to log in.');
      }
    } catch {
      toast.error('Could not connect to server to save key');
    } finally {
      setIsSavingKey(false);
    }
  };

  // Suggest a random key into the user's input
  const handleSuggestRandomKey = () => {
    const suggested = generateSecretKey();
    setInputSecretKey(suggested);
    setShowInputKey(true);
    toast.info('Suggested random key inserted. You can use it or modify it!');
  };

  // Delete/Revoke Secret Key
  const handleDeleteSecretKey = async () => {
    if (!profile?.id) return;
    setIsDeletingKey(true);
    try {
      const res = await fetch('/api/auth/secret-key', {
        method: 'DELETE',
        headers: {
          'x-user-id': profile.id,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to remove secret key');
      } else {
        setHasSecretKey(false);
        setSecretKey(null);
        setShowDeleteConfirm(false);
        setIsEditingKey(true);
        setInputSecretKey('');
        toast.success('Secret Key removed successfully.');
      }
    } catch {
      toast.error('Could not connect to server');
    } finally {
      setIsDeletingKey(false);
    }
  };

  const copySecretKey = () => {
    if (!secretKey) return;
    navigator.clipboard.writeText(secretKey);
    setCopiedSecretKey(true);
    toast.success('Secret Key copied to clipboard!');
    setTimeout(() => setCopiedSecretKey(false), 2000);
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileUpdateFormData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      displayName: profile?.display_name || '',
      username: profile?.username || '',
      bio: profile?.bio || '',
    },
  });

  React.useEffect(() => {
    if (profile) {
      reset({
        displayName: profile.display_name,
        username: profile.username || '',
        bio: profile.bio || '',
      });
      if (avatarPreview === null && profile.avatar_path) {
        setAvatarPreview(profile.avatar_path);
      }
    }
  }, [profile, reset, avatarPreview]);

  // Client-side image compression and upload handler
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose a valid image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be smaller than 10MB.');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = async () => {
          try {
            // Render to a 300x300 canvas with center crop
            const canvas = document.createElement('canvas');
            const targetSize = 300;
            canvas.width = targetSize;
            canvas.height = targetSize;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              toast.error('Failed to initialize image canvas.');
              setIsUploadingAvatar(false);
              return;
            }

            const minDim = Math.min(img.width, img.height);
            const sx = (img.width - minDim) / 2;
            const sy = (img.height - minDim) / 2;

            ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, targetSize, targetSize);

            let dataUrl = canvas.toDataURL('image/webp', 0.85);
            if (!dataUrl.startsWith('data:image/webp')) {
              dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            }

            setAvatarPreview(dataUrl);

            // Immediately persist avatar to database
            const res = await updateProfile({
              displayName: profile?.display_name || 'User',
              username: profile?.username || 'user',
              bio: profile?.bio,
              avatarPath: dataUrl,
            });

            if (res.error) {
              toast.error(res.error);
            } else {
              toast.success('Profile picture updated successfully!');
            }
          } catch (processErr) {
            console.error('Error processing image:', processErr);
            toast.error('Could not process avatar image.');
          } finally {
            setIsUploadingAvatar(false);
          }
        };
        img.onerror = () => {
          toast.error('Failed to load image file.');
          setIsUploadingAvatar(false);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Avatar upload error:', err);
      toast.error('Failed to upload picture.');
      setIsUploadingAvatar(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    setIsUploadingAvatar(true);
    setAvatarPreview(null);
    try {
      const res = await updateProfile({
        displayName: profile?.display_name || 'User',
        username: profile?.username || 'user',
        bio: profile?.bio,
        avatarPath: null,
      });
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Profile picture removed.');
      }
    } catch {
      toast.error('Failed to remove profile picture.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSelectPreset = async (url: string) => {
    setIsUploadingAvatar(true);
    setAvatarPreview(url);
    setShowPresetsModal(false);
    try {
      const res = await updateProfile({
        displayName: profile?.display_name || 'User',
        username: profile?.username || 'user',
        bio: profile?.bio,
        avatarPath: url,
      });
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Avatar preset applied!');
      }
    } catch {
      toast.error('Failed to apply avatar preset.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const onSubmit = async (data: ProfileUpdateFormData) => {
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    const res = await updateProfile({
      displayName: data.displayName,
      username: data.username,
      bio: data.bio,
      avatarPath: avatarPreview !== null ? avatarPreview : profile?.avatar_path,
    });

    setIsSaving(false);
    if (res.error) {
      setErrorMessage(res.error);
    } else {
      setSuccessMessage('Profile changes saved successfully');
      toast.success('Profile updated');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const copyUsername = () => {
    if (profile?.username) {
      navigator.clipboard.writeText(`@${profile.username}`);
      setCopiedUsername(true);
      toast.success('Username copied to clipboard');
      setTimeout(() => setCopiedUsername(false), 2000);
    } else {
      toast.error('No username set yet');
    }
  };

  const copyUserId = () => {
    if (profile?.id) {
      navigator.clipboard.writeText(profile.id);
      setCopiedId(true);
      toast.success('UUID copied to clipboard');
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Profile Information</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage how your partner sees you in DuoChat
        </p>
      </div>

      <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-xs space-y-6">
        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs border border-emerald-500/20 font-medium">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-xs border border-destructive/20 font-medium">
            {errorMessage}
          </div>
        )}

        {/* Avatar Section */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 pb-6 border-b border-border/60">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleImageFileChange}
            className="hidden"
          />

          <div className="relative group shrink-0 w-20 h-20">
            <Avatar
              src={avatarPreview ?? profile?.avatar_path}
              name={profile?.display_name || 'User'}
              size="xl"
            />
            {isUploadingAvatar ? (
              <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center text-white">
                <Loader2 className="w-6 h-6 animate-spin text-white" />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                title="Change avatar photo"
              >
                <Camera className="w-6 h-6" />
              </button>
            )}
          </div>

          <div className="space-y-2 flex-1">
            <div>
              <h4 className="text-sm font-semibold text-foreground">Profile Picture</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Upload a custom photo or pick an aesthetic preset. JPG, PNG, or WebP.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="rounded-xl text-xs gap-1.5 h-8 font-medium cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Photo</span>
              </Button>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowPresetsModal(true)}
                disabled={isUploadingAvatar}
                className="rounded-xl text-xs gap-1.5 h-8 font-medium cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>Choose Preset</span>
              </Button>

              {(avatarPreview || profile?.avatar_path) && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={handleRemoveAvatar}
                  disabled={isUploadingAvatar}
                  className="rounded-xl text-xs gap-1.5 h-8 text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Display Name
            </label>
            <Input
              placeholder="e.g. Alex Rivera"
              leftIcon={<User className="w-4 h-4" />}
              error={errors.displayName?.message}
              {...register('displayName')}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Username
            </label>
            <Input
              placeholder="e.g. alex_rivera"
              leftIcon={<AtSign className="w-4 h-4" />}
              error={errors.username?.message}
              {...register('username')}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Bio
            </label>
            <Textarea
              placeholder="A short note or favorite quote..."
              rows={3}
              error={errors.bio?.message}
              {...register('bio')}
            />
          </div>

          <div className="pt-2">
            <Button type="submit" isLoading={isSaving} className="rounded-xl font-medium">
              Save Changes
            </Button>
          </div>
        </form>

        {/* User-Created Secret Key Section */}
        <div className="pt-6 border-t border-border/60 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-primary" />
                  Your Personal Secret Key
                </h4>
                {hasSecretKey ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck className="w-3 h-3" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Not Set
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Create your own Secret Key. You can use it on the sign-in page to log in instantly on any device without passwords or emails.
              </p>
            </div>
          </div>

          {isLoadingKey ? (
            <div className="p-4 rounded-2xl bg-muted/40 text-xs text-muted-foreground animate-pulse">
              Checking Secret Key status...
            </div>
          ) : hasSecretKey && !isEditingKey && secretKey ? (
            /* VIEW MODE: Show Existing Secret Key */
            <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Active Secret Key
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowSavedKey(!showSavedKey)}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {showSavedKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showSavedKey ? 'Hide' : 'Reveal'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={copySecretKey}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-primary/10 hover:bg-primary/20 text-primary transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedSecretKey ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSecretKey ? 'Copied!' : 'Copy Key'}</span>
                  </button>
                </div>
              </div>

              {/* Secret Key Display Box */}
              <div className="p-3 rounded-xl bg-muted/50 border border-border/60 flex items-center justify-between">
                <span className="font-mono text-sm sm:text-base font-bold tracking-wider text-foreground select-all">
                  {showSavedKey ? secretKey : '••••••••••••••••'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  Keep this safe. Anyone with this key can log into your DuoChat account.
                </p>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setInputSecretKey(secretKey);
                      setIsEditingKey(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>Change Key</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* EDIT / CREATE MODE: User types their custom key */
            <form onSubmit={handleSaveSecretKey} className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
              <div>
                <h5 className="text-xs font-bold text-foreground">
                  {hasSecretKey ? 'Update Your Secret Key' : 'Create Your Secret Key'}
                </h5>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Type any memorable phrase, code, or secret word (minimum 4 characters) that you will use to log in fast.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">
                    Secret Key
                  </label>
                  <button
                    type="button"
                    onClick={handleSuggestRandomKey}
                    className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium cursor-pointer"
                  >
                    <Wand2 className="w-3 h-3" />
                    Suggest random key
                  </button>
                </div>

                <div className="relative">
                  <Input
                    type={showInputKey ? 'text' : 'password'}
                    placeholder="Enter your secret key (e.g. my_super_secret_code)"
                    value={inputSecretKey}
                    onChange={(e) => setInputSecretKey(e.target.value)}
                    leftIcon={<KeyRound className="w-4 h-4 text-muted-foreground" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowInputKey(!showInputKey)}
                        className="text-muted-foreground hover:text-foreground cursor-pointer"
                        aria-label={showInputKey ? 'Hide key' : 'Show key'}
                      >
                        {showInputKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                    className="rounded-xl font-mono text-sm"
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Must be between 4 and 64 characters. You can use letters, numbers, and symbols.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button
                  type="submit"
                  isLoading={isSavingKey}
                  className="rounded-xl font-medium gap-1.5 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  Save Secret Key
                </Button>
                {hasSecretKey && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditingKey(false);
                      setInputSecretKey('');
                    }}
                    className="rounded-xl cursor-pointer"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          )}

          {/* Delete Confirmation Modal */}
          <Dialog
            isOpen={showDeleteConfirm}
            onClose={() => setShowDeleteConfirm(false)}
            title="Remove Secret Key"
            description="Are you sure you want to remove your personal Secret Key?"
          >
            <div className="space-y-4 pt-1">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Removing your Secret Key means you will no longer be able to log in with it. You can create a new one at any time.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="rounded-xl cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleDeleteSecretKey}
                  isLoading={isDeletingKey}
                  className="rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground cursor-pointer"
                >
                  Yes, Remove Key
                </Button>
              </div>
            </div>
          </Dialog>
        </div>

        {/* Account Details & Username Connection */}
        <div className="pt-6 border-t border-border/60 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-semibold text-foreground">Account Identification</h4>
              <p className="text-[11px] text-muted-foreground">
                Your credentials and username for connecting with partners.
              </p>
            </div>
            <Sparkles className="w-4 h-4 text-primary" />
          </div>

          {/* Username Badge */}
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <AtSign className="w-3.5 h-3.5" />
                Your Username
              </span>
              <button
                type="button"
                onClick={copyUsername}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-primary/10 hover:bg-primary/20 text-primary transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {copiedUsername ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedUsername ? 'Copied!' : 'Copy Username'}</span>
              </button>
            </div>
            <div className="font-mono text-base font-bold text-foreground tracking-wide flex items-center gap-1">
              <span className="text-primary font-bold">@</span>
              <span>{profile?.username || 'user'}</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Share your username with your partner. Anyone can use your username to find and connect with you on DuoChat.
            </p>
          </div>

          {/* Database UUID */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/60 text-xs">
            <div className="min-w-0">
              <span className="text-[11px] text-muted-foreground block">System UUID</span>
              <span className="font-mono text-xs text-foreground truncate block">
                {profile?.id || '—'}
              </span>
            </div>
            <button
              type="button"
              onClick={copyUserId}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Copy UUID"
            >
              {copiedId ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Account created on{' '}
            {profile?.created_at
              ? new Date(profile.created_at).toLocaleDateString()
              : 'Recently'}
          </p>
        </div>
      </div>

      {/* Avatar Presets Selection Modal */}
      <Dialog
        isOpen={showPresetsModal}
        onClose={() => setShowPresetsModal(false)}
        title="Choose an Avatar Preset"
        description="Select a handcrafted aesthetic avatar style for your profile."
        size="md"
      >
        <div className="space-y-4 pt-1">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PRESET_AVATARS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset.url)}
                className="group relative flex flex-col items-center gap-1.5 p-2.5 rounded-2xl hover:bg-muted/80 border border-border/40 hover:border-primary/50 transition-all cursor-pointer"
              >
                <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-border group-hover:border-primary transition-colors shadow-xs">
                  <img
                    src={preset.url}
                    alt={preset.label}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-[11px] font-medium text-foreground group-hover:text-primary transition-colors">
                  {preset.label}
                </span>
              </button>
            ))}
          </div>

          <div className="flex justify-end pt-2 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPresetsModal(false)}
              className="rounded-xl text-xs cursor-pointer"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
