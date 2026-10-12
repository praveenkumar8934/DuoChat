'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useChat } from '@/context/chat-context';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/env';
import { hashToken } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';

export default function InviteAcceptClient({ token }: { token: string }) {
  const router = useRouter();
  const { user, profile, isConfigured } = useAuth();
  const { refreshConversations } = useChat();

  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successConversationId, setSuccessConversationId] = React.useState<string | null>(null);

  const handleAcceptInvite = async () => {
    if (!token) return;
    setIsLoading(true);
    setErrorMessage(null);

    if (!isConfigured) {
      setTimeout(async () => {
        setIsLoading(false);
        setSuccessConversationId('conv_duo_777');
        await refreshConversations();
        router.push('/chat');
      }, 700);
      return;
    }

    try {
      const tokenHash = await hashToken(token);
      const supabase = getSupabaseBrowserClient();

      const { data: conversationId, error } = await supabase.rpc('accept_invitation', {
        p_token_hash: tokenHash,
      });

      if (error) {
        setErrorMessage(error.message);
      } else if (conversationId) {
        setSuccessConversationId(conversationId);
        await refreshConversations();
        router.push(`/chat/${conversationId}`);
      }
    } catch (err: unknown) {
      setErrorMessage((err as Error)?.message || 'Failed to accept invitation');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="p-4 flex items-center justify-between border-b border-border/40">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
            <MessageSquare className="w-4 h-4 fill-current" />
          </div>
          <span className="font-bold text-base">DuoChat</span>
        </Link>
        <ThemeToggle />
      </header>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3 shadow-xs">
              <UserCheck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Private Invitation</h1>
            <p className="text-xs text-muted-foreground">
              A friend has invited you to connect on DuoChat
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-xl space-y-5">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-xs border border-destructive/20 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successConversationId ? (
              <div className="text-center space-y-3 py-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h3 className="font-bold text-base">Connection Established!</h3>
                <p className="text-xs text-muted-foreground">
                  Your private one-to-one conversation is ready.
                </p>
                <Link href={`/chat/${successConversationId}`}>
                  <Button size="md" className="mt-2 rounded-xl">
                    Enter Chat
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="p-4 rounded-2xl bg-muted/60 border border-border/40 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-foreground font-semibold">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    <span>Single-Use Direct Link</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    By accepting, you will create a private messaging channel with the sender. No third parties can join or view your messages.
                  </p>
                </div>

                {user ? (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground text-center">
                      Signed in as <span className="font-semibold text-foreground">{profile?.display_name || user.email}</span>
                    </p>
                    <Button
                      onClick={handleAcceptInvite}
                      isLoading={isLoading}
                      className="w-full rounded-xl font-medium shadow-sm"
                    >
                      Accept & Connect
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 pt-2">
                    <p className="text-xs text-muted-foreground text-center">
                      Please sign in or create an account to accept this invitation:
                    </p>
                    <div className="flex gap-2">
                      <Link
                        href={`/login?redirectTo=/invite/${token}`}
                        className="flex-1"
                      >
                        <Button variant="outline" className="w-full rounded-xl">
                          Sign In
                        </Button>
                      </Link>
                      <Link
                        href={`/signup?redirectTo=/invite/${token}`}
                        className="flex-1"
                      >
                        <Button className="w-full rounded-xl">
                          Create Account
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
