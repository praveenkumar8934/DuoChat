'use client';

import * as React from 'react';
import {
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  Reply,
  Smile,
  Edit2,
  Trash2,
  Copy,
  Check as CheckIcon,
  X,
  Bookmark,
  Heart,
  Sparkles,
  MoreHorizontal,
  Ghost,
} from 'lucide-react';
import { MessageWithDetails } from '@/types/database';
import { useAuth } from '@/context/auth-context';
import { useChat } from '@/context/chat-context';
import { formatMessageTime, cn } from '@/lib/utils';
import { ImagePreview } from './media/image-preview';
import { AudioPlayer } from './media/audio-player';
import { VideoPlayer } from './media/video-player';
import { DocumentCard } from './media/document-card';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { spawnFloatingHearts } from '@/components/ui/floating-hearts';
import { useRomanticFeatures } from '@/lib/romantic-features';
import { usePrivacySettings } from '@/lib/privacy-features';
import { toast } from '@/components/ui/toast';

interface MessageBubbleProps {
  message: MessageWithDetails;
  isFirstInGroup?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  onDeselect?: () => void;
}

const COMMON_EMOJIS = ['❤️', '💕', '🥰', '✨', '😂', '🔥', '☕'];

export interface MessageThemeStyle {
  bubbleClass: string;
  metaClass: string;
  statusTickClass: string;
}

export function getMessageThemeConfig(theme: string, isOutgoing: boolean): MessageThemeStyle {
  if (isOutgoing) {
    switch (theme) {
      case 'aurora-live':
        return {
          bubbleClass:
            'bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 text-white rounded-br-xs shadow-lg shadow-teal-950/30 border border-teal-300/40',
          metaClass: 'justify-end text-white/80',
          statusTickClass: 'text-white/80',
        };

      case 'sakura-live':
        return {
          bubbleClass:
            'bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-br-xs shadow-md shadow-rose-950/20 border border-rose-300/40',
          metaClass: 'justify-end text-white/80',
          statusTickClass: 'text-white/80',
        };

      case 'cosmic-live':
        return {
          bubbleClass:
            'bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 text-white rounded-br-xs shadow-lg shadow-purple-950/40 border border-purple-300/40',
          metaClass: 'justify-end text-white/80',
          statusTickClass: 'text-white/80',
        };

      case 'cyber-live':
        return {
          bubbleClass:
            'bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-br-xs shadow-lg shadow-pink-950/40 border-2 border-pink-400/60',
          metaClass: 'justify-end text-white/80',
          statusTickClass: 'text-white/80',
        };

      case 'ocean-live':
        return {
          bubbleClass:
            'bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 text-white rounded-br-xs shadow-lg shadow-cyan-950/30 border border-cyan-300/40',
          metaClass: 'justify-end text-white/80',
          statusTickClass: 'text-white/80',
        };

      case 'golden-live':
      case 'sunset':
        return {
          bubbleClass:
            'bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-br-xs shadow-md shadow-amber-950/25 border border-amber-200/40',
          metaClass: 'justify-end text-white/80',
          statusTickClass: 'text-white/80',
        };

      case 'emerald-live':
      case 'emerald':
        return {
          bubbleClass:
            'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-xs shadow-md shadow-emerald-950/25 border border-emerald-200/40',
          metaClass: 'justify-end text-white/80',
          statusTickClass: 'text-white/80',
        };

      case 'lavender-live':
      case 'lavender':
        return {
          bubbleClass:
            'bg-gradient-to-r from-purple-700 via-violet-600 to-fuchsia-600 text-white rounded-br-xs shadow-md shadow-purple-950/30 border border-purple-200/40',
          metaClass: 'justify-end text-white/80',
          statusTickClass: 'text-white/80',
        };

      case 'midnight':
        return {
          bubbleClass:
            'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white rounded-br-xs shadow-lg shadow-blue-950/40 border border-blue-300/30',
          metaClass: 'justify-end text-white/80',
          statusTickClass: 'text-white/80',
        };

      case 'doodle':
        return {
          bubbleClass:
            'bg-[#d9fdd3] dark:bg-[#005c4b] text-slate-900 dark:text-white rounded-br-xs shadow-sm border border-[#bbf7d0] dark:border-[#005c4b]',
          metaClass: 'justify-end text-slate-600 dark:text-white/80',
          statusTickClass: 'text-slate-600 dark:text-white/80',
        };

      case 'dark':
        return {
          bubbleClass:
            'bg-zinc-800 text-white rounded-br-xs border-2 border-zinc-600 shadow-md',
          metaClass: 'justify-end text-zinc-300',
          statusTickClass: 'text-zinc-300',
        };

      case 'minimal':
        return {
          bubbleClass:
            'bg-primary text-primary-foreground rounded-br-xs shadow-xs',
          metaClass: 'justify-end text-primary-foreground/80',
          statusTickClass: 'text-primary-foreground/80',
        };

      case 'romantic':
      default:
        return {
          bubbleClass:
            'bg-gradient-to-tr from-[#9f1239] via-[#be123c] to-[#e11d48] text-white rounded-br-xs shadow-md shadow-rose-950/20 border border-rose-300/25',
          metaClass: 'justify-end text-white/80',
          statusTickClass: 'text-white/80',
        };
    }
  } else {
    // Incoming messages: Distinct, elevated surface that clearly separates from the theme wallpaper
    switch (theme) {
      case 'aurora-live':
        return {
          bubbleClass:
            'bg-[#1e293b]/95 backdrop-blur-md text-slate-100 border-2 border-teal-400/50 rounded-bl-xs shadow-xl shadow-black/35',
          metaClass: 'justify-end text-slate-300',
          statusTickClass: 'text-slate-400',
        };

      case 'sakura-live':
        return {
          bubbleClass:
            'bg-white dark:bg-[#1f0b15] text-slate-900 dark:text-rose-50 border-2 border-rose-300/90 dark:border-rose-800 rounded-bl-xs shadow-md shadow-rose-950/10',
          metaClass: 'justify-end text-slate-500 dark:text-rose-300/80',
          statusTickClass: 'text-slate-500 dark:text-rose-300/80',
        };

      case 'cosmic-live':
        return {
          bubbleClass:
            'bg-[#181829]/95 backdrop-blur-md text-purple-50 border-2 border-indigo-400/60 rounded-bl-xs shadow-xl shadow-indigo-950/50',
          metaClass: 'justify-end text-purple-200/80',
          statusTickClass: 'text-purple-300/80',
        };

      case 'cyber-live':
        return {
          bubbleClass:
            'bg-[#111827]/95 backdrop-blur-md text-cyan-100 border-2 border-cyan-400 rounded-bl-xs shadow-xl shadow-cyan-950/50',
          metaClass: 'justify-end text-cyan-300/80',
          statusTickClass: 'text-cyan-300/80',
        };

      case 'ocean-live':
        return {
          bubbleClass:
            'bg-[#1e293b]/95 backdrop-blur-md text-slate-100 border-2 border-cyan-400/50 rounded-bl-xs shadow-xl shadow-black/35',
          metaClass: 'justify-end text-slate-300',
          statusTickClass: 'text-slate-400',
        };

      case 'golden-live':
      case 'sunset':
        return {
          bubbleClass:
            'bg-white dark:bg-[#1c1109] text-slate-900 dark:text-amber-50 border-2 border-amber-300 dark:border-amber-700 rounded-bl-xs shadow-md shadow-amber-950/10',
          metaClass: 'justify-end text-slate-500 dark:text-amber-300/80',
          statusTickClass: 'text-slate-500 dark:text-amber-300/80',
        };

      case 'emerald-live':
      case 'emerald':
        return {
          bubbleClass:
            'bg-white dark:bg-[#062019] text-slate-900 dark:text-emerald-50 border-2 border-emerald-300 dark:border-emerald-700 rounded-bl-xs shadow-md shadow-emerald-950/10',
          metaClass: 'justify-end text-slate-500 dark:text-emerald-300/80',
          statusTickClass: 'text-slate-500 dark:text-emerald-300/80',
        };

      case 'lavender-live':
      case 'lavender':
        return {
          bubbleClass:
            'bg-white dark:bg-[#180a26] text-slate-900 dark:text-purple-50 border-2 border-purple-300 dark:border-purple-700 rounded-bl-xs shadow-md shadow-purple-950/10',
          metaClass: 'justify-end text-slate-500 dark:text-purple-300/80',
          statusTickClass: 'text-slate-500 dark:text-purple-300/80',
        };

      case 'midnight':
        return {
          bubbleClass:
            'bg-[#1e293b]/95 backdrop-blur-md text-slate-100 border-2 border-indigo-400/50 rounded-bl-xs shadow-xl shadow-black/35',
          metaClass: 'justify-end text-slate-300',
          statusTickClass: 'text-slate-400',
        };

      case 'doodle':
        return {
          bubbleClass:
            'bg-white dark:bg-[#202c33] text-slate-900 dark:text-slate-100 border border-slate-300/80 dark:border-slate-700 rounded-bl-xs shadow-sm',
          metaClass: 'justify-end text-slate-500 dark:text-slate-400',
          statusTickClass: 'text-slate-500 dark:text-slate-400',
        };

      case 'dark':
        return {
          bubbleClass:
            'bg-zinc-900 text-zinc-100 border-2 border-zinc-700 rounded-bl-xs shadow-md',
          metaClass: 'justify-end text-zinc-400',
          statusTickClass: 'text-zinc-400',
        };

      case 'minimal':
        return {
          bubbleClass:
            'bg-card text-card-foreground border-2 border-border rounded-bl-xs shadow-sm',
          metaClass: 'justify-end text-muted-foreground',
          statusTickClass: 'text-muted-foreground',
        };

      case 'romantic':
      default:
        return {
          bubbleClass:
            'bg-white dark:bg-[#1f131a] text-slate-900 dark:text-rose-100 border-2 border-rose-200 dark:border-rose-900/80 rounded-bl-xs shadow-sm',
          metaClass: 'justify-end text-slate-500 dark:text-rose-300/80',
          statusTickClass: 'text-slate-500 dark:text-rose-300/80',
        };
    }
  }
}

export function getMessageBubbleThemeClasses(theme: string, isOutgoing: boolean): string {
  return getMessageThemeConfig(theme, isOutgoing).bubbleClass;
}

export function MessageBubble({
  message,
  isFirstInGroup = true,
  isSelected = false,
  onToggleSelect,
  onDeselect,
}: MessageBubbleProps) {
  const { profile } = useAuth();
  const {
    setReplyingTo,
    toggleReaction,
    editMessage,
    deleteMessage,
    activeConversation,
    chatTheme,
  } = useChat();

  const { isFavorite, toggleFav } = useRomanticFeatures();
  const { isSnapchatModeActive } = usePrivacySettings();
  const isBookmarked = isFavorite(message.id);

  const [isEditing, setIsEditing] = React.useState(false);
  const [editText, setEditText] = React.useState(message.body || '');
  const [showReactionPicker, setShowReactionPicker] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [isCopied, setIsCopied] = React.useState(false);

  const touchTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const isOutgoing = message.sender_id === profile?.id;
  const themeConfig = getMessageThemeConfig(chatTheme, isOutgoing);

  // Check if message is a "Little Note"
  const isLittleNote = message.body?.startsWith('[💌 Note]') || false;
  const displayBody = isLittleNote
    ? message.body?.replace(/^\[💌 Note\]\s*/, '')
    : message.body;

  // Status icon for outgoing messages
  const renderStatus = () => {
    if (!isOutgoing) return null;
    const tickClass = themeConfig.statusTickClass;
    switch (message.deliveryStatus) {
      case 'sending':
        return (
          <span title="Sending...">
            <Clock className={cn('w-3 h-3 animate-spin', tickClass)} />
          </span>
        );
      case 'sent':
        return (
          <span title="Sent (Partner is offline)">
            <Check className={cn('w-3.5 h-3.5', tickClass)} />
          </span>
        );
      case 'delivered':
        return (
          <span title="Delivered to partner">
            <CheckCheck className={cn('w-3.5 h-3.5', tickClass)} />
          </span>
        );
      case 'read':
        return (
          <span title="Seen by partner" className="inline-flex items-center gap-0.5">
            {isSnapchatModeActive && (
              <span title="Snapchat Mode: Vanishing on read">
                <Ghost className="w-2.5 h-2.5 text-amber-400 animate-pulse" />
              </span>
            )}
            <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb] drop-shadow-[0_0_2px_rgba(83,189,235,0.8)] font-bold stroke-[2.5]" />
          </span>
        );
      case 'failed':
        return (
          <span title="Failed to send">
            <AlertCircle className="w-3.5 h-3.5 text-rose-300" />
          </span>
        );
      default:
        return <Check className={cn('w-3.5 h-3.5', tickClass)} />;
    }
  };


  const handleCopy = () => {
    if (displayBody) {
      navigator.clipboard.writeText(displayBody);
      setIsCopied(true);
      toast.success('Message copied to clipboard');
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleSaveEdit = async () => {
    if (editText.trim() && editText !== displayBody) {
      const updated = isLittleNote ? `[💌 Note] ${editText.trim()}` : editText.trim();
      await editMessage(message.id, updated);
      toast.success('Message updated');
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    await deleteMessage(message.id);
    setShowDeleteModal(false);
    toast.success('Message deleted');
  };

  const handleReactionClick = (emoji: string, e?: React.MouseEvent) => {
    if (emoji === '❤️' || emoji === '💕' || emoji === '🥰') {
      const rect = (e?.currentTarget as HTMLElement)?.getBoundingClientRect();
      spawnFloatingHearts(rect?.left ?? window.innerWidth / 2, rect?.top ?? window.innerHeight / 2, 7);
    }
    toggleReaction(message.id, emoji);
    setShowReactionPicker(false);
  };

  const handleToggleFavorite = (e?: React.MouseEvent) => {
    const isNowFav = toggleFav(message.id);
    if (isNowFav) {
      const rect = (e?.currentTarget as HTMLElement)?.getBoundingClientRect();
      spawnFloatingHearts(rect?.left ?? window.innerWidth / 2, rect?.top ?? window.innerHeight / 2, 5);
      toast.success('Saved to Our Moments');
    } else {
      toast.info('Removed from Our Moments');
    }
  };

  // Touch handlers for mobile long-press selection
  const handleTouchStart = () => {
    touchTimerRef.current = setTimeout(() => {
      onToggleSelect?.();
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(40);
      }
    }, 450);
  };

  const handleTouchEnd = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
  };

  // Group reactions by emoji
  const groupedReactions = (message.reactions || []).reduce(
    (acc, r) => {
      acc[r.emoji] = acc[r.emoji] || [];
      acc[r.emoji].push(r.user_id);
      return acc;
    },
    {} as Record<string, string[]>
  );

  return (
    <div
      id={`msg-${message.id}`}
      className={cn(
        'group relative flex flex-col mb-2.5 px-1 sm:px-2 transition-all duration-150',
        isOutgoing ? 'items-end' : 'items-start'
      )}
    >
      {/* Quick Action Floating Toolbar (visible on hover OR when selected) */}
      {!isEditing && (
        <div
          className={cn(
            'absolute -top-4 z-20 items-center gap-0.5 rounded-2xl bg-card/95 border border-border/80 p-1 shadow-md text-muted-foreground backdrop-blur-md transition-all',
            isOutgoing ? 'right-2' : 'left-2',
            isSelected ? 'flex scale-100 opacity-100' : 'hidden group-hover:flex'
          )}
        >
          {/* Reaction Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowReactionPicker(prev => !prev)}
              aria-label="React with emoji"
              className="p-1.5 rounded-xl hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            >
              <Smile className="w-3.5 h-3.5" />
            </button>
            {showReactionPicker && (
              <div
                className={cn(
                  'absolute bottom-full mb-1 flex items-center gap-1 rounded-2xl bg-card border border-border/90 p-1.5 shadow-xl z-30 animate-in zoom-in-95 backdrop-blur-md',
                  isOutgoing ? 'right-0' : 'left-0'
                )}
              >
                {COMMON_EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={e => handleReactionClick(emoji, e)}
                    className="p-1 hover:scale-130 transition-transform text-base cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Heart Reaction Shortcut */}
          <button
            onClick={e => handleReactionClick('❤️', e)}
            aria-label="Send love reaction"
            className="p-1.5 rounded-xl hover:bg-rose-500/10 hover:text-rose-500 transition-colors cursor-pointer"
            title="Heart reaction"
          >
            <Heart className="w-3.5 h-3.5" />
          </button>

          {/* Save / Bookmark to Favorites */}
          <button
            onClick={handleToggleFavorite}
            aria-label={isBookmarked ? 'Unsave moment' : 'Save to Our Moments'}
            className={cn(
              'p-1.5 rounded-xl transition-colors cursor-pointer',
              isBookmarked
                ? 'text-amber-500 bg-amber-500/10'
                : 'hover:bg-muted hover:text-foreground'
            )}
            title={isBookmarked ? 'Saved to Our Moments' : 'Save to Our Moments'}
          >
            <Bookmark className={cn('w-3.5 h-3.5', isBookmarked && 'fill-current')} />
          </button>

          {/* Reply */}
          <button
            onClick={() => setReplyingTo(message)}
            aria-label="Reply to message"
            className="p-1.5 rounded-xl hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <Reply className="w-3.5 h-3.5" />
          </button>

          {/* Copy */}
          {displayBody && (
            <button
              onClick={handleCopy}
              aria-label="Copy text"
              className="p-1.5 rounded-xl hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            >
              {isCopied ? <CheckIcon className="w-3.5 h-3.5 text-rose-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Edit (only text and only outgoing) */}
          {isOutgoing && message.message_type === 'text' && (
            <button
              onClick={() => {
                setIsEditing(true);
                setEditText(displayBody || '');
                onDeselect?.();
              }}
              aria-label="Edit message"
              className="p-1.5 rounded-xl hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Delete */}
          {isOutgoing && (
            <button
              onClick={() => {
                setShowDeleteModal(true);
                onDeselect?.();
              }}
              aria-label="Delete message"
              className="p-1.5 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Replying-to Quoted Preview */}
      {message.reply_to && (
        <div
          className={cn(
            'flex items-center gap-2 mb-1 px-3 py-1.5 rounded-xl text-xs bg-muted/70 border border-border/50 max-w-sm truncate text-muted-foreground',
            isOutgoing ? 'mr-1' : 'ml-1'
          )}
        >
          <Reply className="w-3.5 h-3.5 shrink-0 text-primary" />
          <span className="font-semibold text-foreground shrink-0">
            {message.reply_to.sender_name}:
          </span>
          <span className="truncate">
            {message.reply_to.body || message.reply_to.original_filename || `[${message.reply_to.message_type}]`}
          </span>
        </div>
      )}

      {/* Main Bubble Content */}
      <div
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('button, a, input, textarea, audio, video')) {
            return;
          }
          onToggleSelect?.();
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchEnd}
        className={cn(
          'relative max-w-[85%] sm:max-w-md rounded-2xl p-3 sm:p-3.5 shadow-xs transition-all cursor-pointer select-text',
          isLittleNote
            ? 'little-note-card rounded-2xl'
            : themeConfig.bubbleClass,
          isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.01]'
        )}
      >
        {/* Little Note Header Badge */}
        {isLittleNote && (
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-rose-900/15 dark:border-rose-300/15">
            <span className="text-[11px] font-serif italic text-primary dark:text-rose-300 font-semibold flex items-center gap-1.5">
              <span>💌</span> Little Note
            </span>
            <Sparkles className="w-3 h-3 text-primary/70" />
          </div>
        )}

        {/* Media Attachments */}
        {message.message_type === 'image' && message.signedMediaUrl && (
          <div className="mb-2">
            <ImagePreview
              src={message.signedMediaUrl}
              filename={message.original_filename}
              fileSize={message.file_size}
            />
          </div>
        )}

        {message.message_type === 'audio' && message.signedMediaUrl && (
          <div className="mb-1">
            <AudioPlayer
              src={message.signedMediaUrl}
              filename={message.original_filename}
              fileSize={message.file_size}
              initialDuration={message.duration_seconds}
              isOutgoing={isOutgoing && !isLittleNote}
            />
          </div>
        )}

        {message.message_type === 'video' && message.signedMediaUrl && (
          <div className="mb-2">
            <VideoPlayer
              src={message.signedMediaUrl}
              filename={message.original_filename}
              fileSize={message.file_size}
              mimeType={message.mime_type}
            />
          </div>
        )}

        {message.message_type === 'file' && (
          <div className="mb-1">
            <DocumentCard
              src={message.signedMediaUrl}
              filename={message.original_filename}
              fileSize={message.file_size}
              mimeType={message.mime_type}
              isOutgoing={isOutgoing && !isLittleNote}
            />
          </div>
        )}

        {/* Text Body / Inline Edit */}
        {isEditing ? (
          <div className="space-y-2 mt-1" onClick={e => e.stopPropagation()}>
            <textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              className="w-full p-2 text-xs rounded-xl bg-background text-foreground border border-border focus:outline-none focus:ring-1 focus:ring-ring"
              rows={2}
              autoFocus
            />
            <div className="flex items-center justify-end gap-1.5">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(false)}
                className="h-7 text-xs px-2 cursor-pointer"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Cancel
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleSaveEdit}
                className="h-7 text-xs px-2.5 font-medium cursor-pointer"
              >
                <CheckIcon className="w-3.5 h-3.5 mr-1" />
                Save
              </Button>
            </div>
          </div>
        ) : (
          displayBody && (
            <p
              className={cn(
                'leading-relaxed whitespace-pre-wrap break-words',
                isLittleNote
                  ? 'font-serif text-sm italic text-foreground tracking-wide'
                  : 'text-sm font-sans'
              )}
            >
              {displayBody}
            </p>
          )
        )}

        {/* Timestamp & Status Metadata */}
        <div
          className={cn(
            'flex items-center gap-1.5 mt-1.5 text-[10px] select-none',
            isLittleNote
              ? 'justify-end text-muted-foreground'
              : themeConfig.metaClass
          )}
        >
          {isSnapchatModeActive && (
            <span title="Snapchat Mode (Vanish on read)" className="text-amber-500 flex items-center mr-0.5">
              <Ghost className="w-2.5 h-2.5 animate-pulse" />
            </span>
          )}
          {isBookmarked && (
            <span title="Saved in Our Moments" className="text-amber-400 mr-0.5">
              <Bookmark className="w-2.5 h-2.5 fill-current" />
            </span>
          )}
          {message.edited_at && <span className="italic opacity-80">(edited)</span>}
          <span>{formatMessageTime(message.created_at)}</span>
          {renderStatus()}

          {/* Mobile 3-Dots Quick Trigger */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect?.();
            }}
            className="sm:hidden p-0.5 rounded-md text-inherit opacity-70 hover:opacity-100 transition-opacity cursor-pointer inline-flex items-center justify-center"
            title="Message options"
            aria-label="Message options"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Emoji Reactions Badges */}
      {Object.keys(groupedReactions).length > 0 && (
        <div
          className={cn(
            'flex flex-wrap items-center gap-1 mt-1 z-10',
            isOutgoing ? 'justify-end pr-1' : 'justify-start pl-1'
          )}
        >
          {Object.entries(groupedReactions).map(([emoji, userIds]) => {
            const hasReacted = profile ? userIds.includes(profile.id) : false;

            return (
              <button
                key={emoji}
                onClick={e => handleReactionClick(emoji, e)}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs border transition-all cursor-pointer shadow-xs',
                  hasReacted
                    ? 'bg-rose-500/15 border-rose-500/40 text-primary font-semibold'
                    : 'bg-card/90 border-border/80 text-muted-foreground hover:bg-muted'
                )}
              >
                <span>{emoji}</span>
                <span className="text-[10px] font-mono">{userIds.length}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* MOBILE SELECTION BOTTOM ACTION SHEET */}
      {isSelected && (
        <div
          className="fixed inset-0 z-50 sm:hidden flex flex-col justify-end animate-in fade-in duration-200"
          onClick={(e) => {
            e.stopPropagation();
            onDeselect?.();
          }}
        >
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" />

          {/* Drawer Sheet */}
          <div
            className="relative w-full max-h-[85vh] bg-card text-card-foreground border-t border-border/80 rounded-t-3xl p-4 shadow-2xl z-10 space-y-4 animate-in slide-in-from-bottom duration-200 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grab Handle */}
            <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto" />

            {/* Header / Message Snippet */}
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="min-w-0 flex-1 pr-2">
                <span className="text-[11px] font-semibold text-primary uppercase tracking-wider block">
                  {isOutgoing
                    ? 'Your Sent Message'
                    : activeConversation?.otherUser?.display_name || 'Partner Message'}
                </span>
                <p className="text-xs text-muted-foreground truncate mt-0.5 font-sans">
                  {displayBody || message.original_filename || `[${message.message_type}]`}
                </p>
              </div>
              <button
                type="button"
                onClick={onDeselect}
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Reaction Emojis Row */}
            <div className="flex items-center justify-between gap-1 p-2 rounded-2xl bg-muted/50 border border-border/60 overflow-x-auto">
              {COMMON_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={(e) => {
                    handleReactionClick(emoji, e);
                    onDeselect?.();
                  }}
                  className="p-2 hover:scale-125 transition-transform text-xl cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Action Buttons List */}
            <div className="space-y-1">
              {/* Copy */}
              {displayBody && (
                <button
                  type="button"
                  onClick={() => {
                    handleCopy();
                    onDeselect?.();
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted text-xs font-medium text-foreground transition-colors cursor-pointer text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Copy className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block font-semibold">Copy Text</span>
                    <span className="text-[10px] text-muted-foreground">Copy message to your clipboard</span>
                  </div>
                </button>
              )}

              {/* Edit (only outgoing text) */}
              {isOutgoing && message.message_type === 'text' && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(true);
                    setEditText(displayBody || '');
                    onDeselect?.();
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted text-xs font-medium text-foreground transition-colors cursor-pointer text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Edit2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block font-semibold">Edit Message</span>
                    <span className="text-[10px] text-muted-foreground">Modify your sent message</span>
                  </div>
                </button>
              )}

              {/* Reply */}
              <button
                type="button"
                onClick={() => {
                  setReplyingTo(message);
                  onDeselect?.();
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted text-xs font-medium text-foreground transition-colors cursor-pointer text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Reply className="w-4 h-4" />
                </div>
                <div>
                  <span className="block font-semibold">Reply</span>
                  <span className="text-[10px] text-muted-foreground">Quote this message in your reply</span>
                </div>
              </button>

              {/* Bookmark to Moments */}
              <button
                type="button"
                onClick={(e) => {
                  handleToggleFavorite(e);
                  onDeselect?.();
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted text-xs font-medium text-foreground transition-colors cursor-pointer text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                  <Bookmark className={cn('w-4 h-4', isBookmarked && 'fill-current')} />
                </div>
                <div>
                  <span className="block font-semibold">
                    {isBookmarked ? 'Remove from Our Moments' : 'Save to Our Moments'}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Keep this special moment in your shared memory box
                  </span>
                </div>
              </button>

              {/* Delete (only outgoing) */}
              {isOutgoing && (
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(true);
                    onDeselect?.();
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-destructive/10 text-xs font-medium text-destructive transition-colors cursor-pointer text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-destructive/15 flex items-center justify-center text-destructive shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block font-semibold">Delete Message</span>
                    <span className="text-[10px] text-destructive/80">Delete for both you and your partner</span>
                  </div>
                </button>
              )}
            </div>

            {/* Cancel Button */}
            <div className="pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={onDeselect}
                className="w-full rounded-xl text-xs font-medium cursor-pointer"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Dialog
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        size="sm"
        title="Delete moment?"
        description="Are you sure you want to delete this message? This action removes it for both of you."
      >
        <div className="flex items-center justify-end gap-2 pt-4">
          <Button variant="outline" size="sm" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            Delete for both of us
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
