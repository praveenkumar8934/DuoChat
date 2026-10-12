'use client';

import * as React from 'react';
import {
  Bell,
  Check,
  X,
  UserCheck,
  UserX,
  Sparkles,
  Heart,
  Clock,
  Loader2,
} from 'lucide-react';
import { useChat } from '@/context/chat-context';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { formatDuoId } from '@/lib/duo-id';
import { cn } from '@/lib/utils';

export function NotificationBell() {
  const { incomingRequests, respondToRequest } = useChat();
  const [isOpen, setIsOpen] = React.useState(false);
  const [processingId, setProcessingId] = React.useState<string | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const count = incomingRequests.length;

  const handleAction = async (requestId: string, action: 'accept' | 'decline', senderName: string) => {
    setProcessingId(requestId);
    try {
      const res = await respondToRequest(requestId, action);
      if (res.success) {
        if (action === 'accept') {
          toast.success(`You are now connected with ${senderName}!`);
          setIsOpen(false);
        } else {
          toast.info(`Request from ${senderName} declined.`);
        }
      } else {
        toast.error(res.error || `Failed to ${action} request`);
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className={cn(
          'relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-all cursor-pointer border border-transparent',
          isOpen && 'bg-muted/80 text-foreground border-border/50',
          count > 0 && 'text-primary'
        )}
        title={count > 0 ? `${count} pending connection request${count > 1 ? 's' : ''}` : 'Notifications'}
      >
        <Bell className="w-4 h-4" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs animate-bounce">
            {count}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-card border border-border/80 shadow-2xl z-50 overflow-hidden backdrop-blur-md animate-in fade-in-0 zoom-in-95">
          {/* Header */}
          <div className="p-3.5 border-b border-border/60 bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-semibold text-foreground">Partner Requests</h3>
              {count > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary">
                  {count} new
                </span>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground p-1 rounded-lg text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Request List */}
          <div className="max-h-80 overflow-y-auto p-2 space-y-2">
            {count === 0 ? (
              <div className="py-8 px-4 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-muted/60 text-muted-foreground mx-auto flex items-center justify-center">
                  <Heart className="w-4 h-4 opacity-50" />
                </div>
                <p className="text-xs font-medium text-foreground">No pending requests</p>
                <p className="text-[11px] text-muted-foreground max-w-[220px] mx-auto">
                  When someone enters your Duo ID or username, their request will appear here.
                </p>
              </div>
            ) : (
              incomingRequests.map(req => {
                const isBusy = processingId === req.id;
                const duoIdText = formatDuoId(req.sender as any);

                return (
                  <div
                    key={req.id}
                    className="p-3 rounded-xl bg-background/90 border border-border/60 space-y-2.5 transition-all hover:border-primary/30"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={req.sender.avatar_path || undefined}
                        name={req.sender.display_name}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {req.sender.display_name}
                          </p>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            Recent
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground font-mono truncate">
                          {duoIdText}
                          {req.sender.username && ` • @${req.sender.username}`}
                        </p>
                        <p className="text-[11px] text-primary/80 italic font-serif mt-0.5">
                          wants to connect with you
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-1 border-t border-border/40">
                      <Button
                        size="sm"
                        disabled={isBusy}
                        onClick={() => handleAction(req.id, 'accept', req.sender.display_name)}
                        className="flex-1 h-8 rounded-xl text-xs gap-1.5 font-medium bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-xs cursor-pointer"
                      >
                        {isBusy ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        <span>Accept</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isBusy}
                        onClick={() => handleAction(req.id, 'decline', req.sender.display_name)}
                        className="flex-1 h-8 rounded-xl text-xs gap-1.5 border-border hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Top Notification Bar (Shows when there are incoming requests directly at the top of the chat)
 */
export function TopNotificationBar() {
  const { incomingRequests, respondToRequest } = useChat();
  const [processingId, setProcessingId] = React.useState<string | null>(null);

  if (incomingRequests.length === 0) return null;

  const current = incomingRequests[0];
  const isBusy = processingId === current.id;
  const duoIdText = formatDuoId(current.sender as any);

  const handleAction = async (requestId: string, action: 'accept' | 'decline', senderName: string) => {
    setProcessingId(requestId);
    try {
      const res = await respondToRequest(requestId, action);
      if (res.success) {
        if (action === 'accept') {
          toast.success(`Connected with ${senderName}! Added to your friend list.`);
        } else {
          toast.info(`Request from ${senderName} declined.`);
        }
      } else {
        toast.error(res.error || `Failed to ${action} request`);
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="w-full bg-gradient-to-r from-rose-500/15 via-primary/10 to-purple-500/15 border-b border-primary/20 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs backdrop-blur-md animate-in slide-in-from-top duration-200 select-none">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-ping shrink-0" />
        <Avatar
          src={current.sender.avatar_path || undefined}
          name={current.sender.display_name}
          size="sm"
        />
        <div className="truncate">
          <span className="font-semibold text-foreground">{current.sender.display_name}</span>
          <span className="text-muted-foreground ml-1.5 font-mono text-[11px]">
            ({duoIdText})
          </span>
          <span className="text-muted-foreground ml-1 hidden sm:inline">
            sent you a partner connection request!
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          disabled={isBusy}
          onClick={() => handleAction(current.id, 'accept', current.sender.display_name)}
          className="h-7 px-3 rounded-lg text-xs gap-1 font-medium bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs"
        >
          {isBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserCheck className="w-3 h-3" />}
          <span>Accept</span>
        </Button>

        <Button
          size="sm"
          variant="outline"
          disabled={isBusy}
          onClick={() => handleAction(current.id, 'decline', current.sender.display_name)}
          className="h-7 px-3 rounded-lg text-xs gap-1 border-border/80 text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <UserX className="w-3 h-3" />
          <span>Decline</span>
        </Button>
      </div>
    </div>
  );
}
