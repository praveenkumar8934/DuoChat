'use client';

import * as React from 'react';
import { Copy, Check, Link as LinkIcon, Shield, Clock, Trash2, UserPlus } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { generateSecureToken, hashToken } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Invitation } from '@/types/database';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InviteModal({ isOpen, onClose }: InviteModalProps) {
  const { profile, isConfigured } = useAuth();
  const [copied, setCopied] = React.useState(false);
  const [generatedUrl, setGeneratedUrl] = React.useState<string | null>(null);
  const [expiryHours, setExpiryHours] = React.useState('168'); // 7 days default
  const [isLoading, setIsLoading] = React.useState(false);
  const [myInvites, setMyInvites] = React.useState<Invitation[]>([]);

  const loadInvites = React.useCallback(async () => {
    if (!isConfigured || !profile) return;
    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase
        .from('invitations')
        .select('*')
        .eq('created_by', profile.id)
        .is('used_at', null)
        .is('revoked_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (data) setMyInvites(data);
    } catch (err) {
      console.error('Failed to load invitations:', err);
    }
  }, [isConfigured, profile]);

  React.useEffect(() => {
    if (isOpen) {
      loadInvites();
    } else {
      setGeneratedUrl(null);
      setCopied(false);
    }
  }, [isOpen, loadInvites]);

  const handleGenerateLink = async () => {
    if (!profile) return;
    setIsLoading(true);

    try {
      const rawToken = generateSecureToken(32);
      const tokenHash = await hashToken(rawToken);
      const expiresAt = new Date(Date.now() + parseInt(expiryHours, 10) * 3600 * 1000).toISOString();

      if (isConfigured) {
        const supabase = getSupabaseBrowserClient();
        const { error } = await supabase.from('invitations').insert({
          created_by: profile.id,
          token_hash: tokenHash,
          expires_at: expiresAt,
        });

        if (error) throw error;
        await loadInvites();
      }

      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const inviteUrl = `${baseUrl}/invite/${rawToken}`;
      setGeneratedUrl(inviteUrl);
    } catch (err) {
      console.error('Error creating invitation:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!generatedUrl) return;
    navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRevoke = async (id: string) => {
    if (isConfigured) {
      const supabase = getSupabaseBrowserClient();
      await supabase
        .from('invitations')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', id);
      await loadInvites();
    } else {
      setMyInvites(prev => prev.filter(i => i.id !== id));
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title="Invite a Friend"
      description="Create a single-use private invitation link for your friend to connect."
    >
      <div className="space-y-4 pt-1">
        {/* Notice */}
        <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs">
          <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-muted-foreground leading-relaxed">
            Invitations are cryptographically single-use. Once your friend accepts, a private one-to-one conversation will be created and the link will expire.
          </p>
        </div>

        {/* Expiration Selector */}
        {!generatedUrl && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              Link Expiration
            </label>
            <select
              value={expiryHours}
              onChange={e => setExpiryHours(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-background border border-input focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="24">24 Hours</option>
              <option value="168">7 Days (Recommended)</option>
              <option value="720">30 Days</option>
            </select>
          </div>
        )}

        {/* Link Output or Generate Button */}
        {generatedUrl ? (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">
              Your Invitation Link
            </label>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-muted border border-border">
              <input
                type="text"
                readOnly
                value={generatedUrl}
                className="w-full bg-transparent text-xs font-mono focus:outline-none truncate select-all"
              />
              <Button
                size="sm"
                onClick={copyToClipboard}
                className="shrink-0 gap-1 rounded-lg text-xs font-medium"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Send this link securely to your friend via email, SMS, or any channel.
            </p>
          </div>
        ) : (
          <Button
            onClick={handleGenerateLink}
            isLoading={isLoading}
            className="w-full rounded-xl gap-2 font-medium"
          >
            <UserPlus className="w-4 h-4" />
            Generate Single-Use Link
          </Button>
        )}

        {/* Active Invites List */}
        {myInvites.length > 0 && (
          <div className="pt-3 border-t border-border/50">
            <h5 className="text-xs font-semibold text-foreground mb-2">
              Active Unclaimed Invites ({myInvites.length})
            </h5>
            <div className="space-y-2 max-h-36 overflow-y-auto">
              {myInvites.map(inv => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-muted/50 border border-border/40 text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <LinkIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="font-mono text-[11px] truncate">
                      Expires {new Date(inv.expires_at).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRevoke(inv.id)}
                    className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Revoke link"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
