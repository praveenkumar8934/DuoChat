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
  Hash,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { profileUpdateSchema, ProfileUpdateFormData } from '@/lib/validations/auth';
import { useAuth } from '@/context/auth-context';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog } from '@/components/ui/dialog';
import { formatDuoId } from '@/lib/duo-id';
import { toast } from '@/components/ui/toast';

export default function ProfileSettingsPage() {
  const { profile, updateProfile } = useAuth();
  const [isSaving, setIsSaving] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [copiedDuoId, setCopiedDuoId] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState(false);

  // Secret Key State
  const [secretKey, setSecretKey] = React.useState<string | null>(null);
  const [hasSecretKey, setHasSecretKey] = React.useState<boolean>(false);
  const [isLoadingKey, setIsLoadingKey] = React.useState<boolean>(true);
  const [isGeneratingKey, setIsGeneratingKey] = React.useState<boolean>(false);
  const [showSecretKey, setShowSecretKey] = React.useState<boolean>(false);
  const [copiedSecretKey, setCopiedSecretKey] = React.useState(false);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = React.useState<boolean>(false);

  const duoId = formatDuoId(profile);

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
        setHasSecretKey(!!data.hasKey);
        setSecretKey(data.secretKey || null);
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

  const handleGenerateSecretKey = async () => {
    if (!profile?.id) return;
    setIsGeneratingKey(true);
    try {
      const res = await fetch('/api/auth/secret-key', {
        method: 'POST',
        headers: {
          'x-user-id': profile.id,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to generate secret key');
      } else {
        setHasSecretKey(true);
        setSecretKey(data.secretKey);
        setShowSecretKey(true);
        setShowRegenerateConfirm(false);
        toast.success('New Secret Key created! Save it safely.');
      }
    } catch {
      toast.error('Could not connect to server to generate key');
    } finally {
      setIsGeneratingKey(false);
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
    }
  }, [profile, reset]);

  const onSubmit = async (data: ProfileUpdateFormData) => {
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    const res = await updateProfile({
      displayName: data.displayName,
      username: data.username,
      bio: data.bio,
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

  const copyDuoId = () => {
    navigator.clipboard.writeText(duoId);
    setCopiedDuoId(true);
    toast.success('Duo ID copied to clipboard');
    setTimeout(() => setCopiedDuoId(false), 2000);
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
        <div className="flex items-center gap-4 pb-6 border-b border-border/60">
          <div className="relative group">
            <Avatar
              src={profile?.avatar_path}
              name={profile?.display_name || 'User'}
              size="xl"
            />
            <button
              type="button"
              className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
              title="Change avatar photo"
            >
              <Camera className="w-5 h-5" />
            </button>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Profile Picture</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              JPG, PNG, or WebP. Max 5MB.
            </p>
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

        {/* Instant Login Secret Key Section */}
        <div className="pt-6 border-t border-border/60 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-primary" />
                  Instant Login Secret Key
                </h4>
                {hasSecretKey ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck className="w-3 h-3" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Not Generated
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Log in quickly on any phone, tablet, or browser with just your personal Secret Key — no password required.
              </p>
            </div>
          </div>

          {isLoadingKey ? (
            <div className="p-4 rounded-2xl bg-muted/40 text-xs text-muted-foreground animate-pulse">
              Checking Secret Key status...
            </div>
          ) : hasSecretKey && secretKey ? (
            <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  Your Personal Key
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowSecretKey(!showSecretKey)}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {showSecretKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showSecretKey ? 'Hide' : 'Reveal'}</span>
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
                  {showSecretKey ? secretKey : 'DUO-SEC-••••-••••-••••'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  Keep this safe. Anyone with this key can log into your account.
                </p>
                <button
                  type="button"
                  onClick={() => setShowRegenerateConfirm(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Regenerate Key</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                You haven&apos;t created a Secret Key yet. Create one now to enable lightning-fast 1-click logins on any device without typing passwords.
              </p>
              <Button
                type="button"
                onClick={handleGenerateSecretKey}
                isLoading={isGeneratingKey}
                className="rounded-xl font-medium gap-1.5 cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                Create Secret Key
              </Button>
            </div>
          )}

          {/* Regenerate Confirmation Modal */}
          <Dialog
            isOpen={showRegenerateConfirm}
            onClose={() => setShowRegenerateConfirm(false)}
            title="Regenerate Secret Key"
            description="Are you sure you want to generate a new Secret Key?"
          >
            <div className="space-y-4 pt-1">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Generating a new key will <strong>immediately deactivate</strong> your current Secret Key. Any saved shortcuts using the old key will stop working.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowRegenerateConfirm(false)}
                  className="rounded-xl cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleGenerateSecretKey}
                  isLoading={isGeneratingKey}
                  className="rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground cursor-pointer"
                >
                  Yes, Regenerate Key
                </Button>
              </div>
            </div>
          </Dialog>
        </div>

        {/* Account Details & Duo Connection ID */}
        <div className="pt-6 border-t border-border/60 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-semibold text-foreground">Account Identification</h4>
              <p className="text-[11px] text-muted-foreground">
                Your credentials and unique address for connecting with partners.
              </p>
            </div>
            <Sparkles className="w-4 h-4 text-primary" />
          </div>

          {/* Unique Duo ID Badge */}
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5" />
                Unique Duo ID
              </span>
              <button
                type="button"
                onClick={copyDuoId}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-primary/10 hover:bg-primary/20 text-primary transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {copiedDuoId ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedDuoId ? 'Copied!' : 'Copy Duo ID'}</span>
              </button>
            </div>
            <div className="font-mono text-base font-bold text-foreground tracking-wide">
              {duoId}
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Share this ID with your partner. Anyone with this ID can find and connect with you on DuoChat.
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
    </div>
  );
}
