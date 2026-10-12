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

interface MessageBubbleProps {
  message: MessageWithDetails;
  isFirstInGroup?: boolean;
}

const COMMON_EMOJIS = ['❤️', '👍', '😂', '😮', '😢', '🔥', '✨'];

export function MessageBubble({ message, isFirstInGroup = true }: MessageBubbleProps) {
  const { profile } = useAuth();
  const {
    setReplyingTo,
    toggleReaction,
    editMessage,
    deleteMessage,
  } = useChat();

  const [isEditing, setIsEditing] = React.useState(false);
  const [editText, setEditText] = React.useState(message.body || '');
  const [showReactionPicker, setShowReactionPicker] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [isCopied, setIsCopied] = React.useState(false);

  const isOutgoing = message.sender_id === profile?.id;

  // Status icon for outgoing messages
  const renderStatus = () => {
    if (!isOutgoing) return null;
    switch (message.deliveryStatus) {
      case 'sending':
        return <Clock className="w-3 h-3 text-muted-foreground animate-spin" />;
      case 'sent':
        return <Check className="w-3.5 h-3.5 text-muted-foreground/80" />;
      case 'delivered':
        return <CheckCheck className="w-3.5 h-3.5 text-muted-foreground/80" />;
      case 'read':
        return <CheckCheck className="w-3.5 h-3.5 text-primary" />;
      case 'failed':
        return <AlertCircle className="w-3.5 h-3.5 text-destructive" />;
      default:
        return <Check className="w-3.5 h-3.5 text-muted-foreground/80" />;
    }
  };

  const handleCopy = () => {
    if (message.body) {
      navigator.clipboard.writeText(message.body);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleSaveEdit = async () => {
    if (editText.trim() && editText !== message.body) {
      await editMessage(message.id, editText.trim());
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    await deleteMessage(message.id);
    setShowDeleteModal(false);
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
        'group relative flex flex-col mb-2 px-2 transition-all duration-150',
        isOutgoing ? 'items-end' : 'items-start'
      )}
    >
      {/* Quick Action Floating Toolbar on Hover */}
      {!isEditing && (
        <div
          className={cn(
            'absolute -top-4.5 z-20 hidden group-hover:flex items-center gap-0.5 rounded-xl bg-card border border-border/80 p-1 shadow-md text-muted-foreground backdrop-blur-xs transition-all',
            isOutgoing ? 'right-2' : 'left-2'
          )}
        >
          {/* Reaction Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowReactionPicker(prev => !prev)}
              aria-label="React with emoji"
              className="p-1.5 rounded-lg hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            >
              <Smile className="w-3.5 h-3.5" />
            </button>
            {showReactionPicker && (
              <div
                className={cn(
                  'absolute bottom-full mb-1 flex items-center gap-1 rounded-2xl bg-card border border-border/90 p-1.5 shadow-xl z-30 animate-in zoom-in-95',
                  isOutgoing ? 'right-0' : 'left-0'
                )}
              >
                {COMMON_EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => {
                      toggleReaction(message.id, emoji);
                      setShowReactionPicker(false);
                    }}
                    className="p-1 hover:scale-125 transition-transform text-base cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reply */}
          <button
            onClick={() => setReplyingTo(message)}
            aria-label="Reply to message"
            className="p-1.5 rounded-lg hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <Reply className="w-3.5 h-3.5" />
          </button>

          {/* Copy */}
          {message.body && (
            <button
              onClick={handleCopy}
              aria-label="Copy text"
              className="p-1.5 rounded-lg hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            >
              {isCopied ? <CheckIcon className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Edit (only text and only outgoing) */}
          {isOutgoing && message.message_type === 'text' && (
            <button
              onClick={() => {
                setIsEditing(true);
                setEditText(message.body || '');
              }}
              aria-label="Edit message"
              className="p-1.5 rounded-lg hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Delete */}
          {isOutgoing && (
            <button
              onClick={() => setShowDeleteModal(true)}
              aria-label="Delete message"
              className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
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
            'flex items-center gap-2 mb-1 px-3 py-1.5 rounded-xl text-xs bg-muted/60 border border-border/40 max-w-sm truncate text-muted-foreground',
            isOutgoing ? 'mr-1' : 'ml-1'
          )}
        >
          <Reply className="w-3 h-3 shrink-0 text-primary" />
          <span className="font-medium text-foreground shrink-0">
            {message.reply_to.sender_name}:
          </span>
          <span className="truncate">
            {message.reply_to.body || message.reply_to.original_filename || `[${message.reply_to.message_type}]`}
          </span>
        </div>
      )}

      {/* Main Bubble Content */}
      <div
        className={cn(
          'relative max-w-[85%] sm:max-w-md rounded-2xl p-3 shadow-xs transition-colors',
          isOutgoing
            ? 'bg-primary text-primary-foreground rounded-br-xs'
            : 'bg-card text-card-foreground border border-border/80 rounded-bl-xs'
        )}
      >
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
              isOutgoing={isOutgoing}
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
              isOutgoing={isOutgoing}
            />
          </div>
        )}

        {/* Text Body / Inline Edit */}
        {isEditing ? (
          <div className="space-y-2 mt-1">
            <textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              className="w-full p-2 text-xs rounded-lg bg-background text-foreground border border-border focus:outline-none focus:ring-1 focus:ring-ring"
              rows={2}
            />
            <div className="flex items-center justify-end gap-1.5">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(false)}
                className="h-7 text-xs px-2"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Cancel
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleSaveEdit}
                className="h-7 text-xs px-2.5 font-medium"
              >
                <CheckIcon className="w-3.5 h-3.5 mr-1" />
                Save
              </Button>
            </div>
          </div>
        ) : (
          message.body && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.body}
            </p>
          )
        )}

        {/* Timestamp & Status Metadata */}
        <div
          className={cn(
            'flex items-center gap-1.5 mt-1.5 text-[10px] select-none',
            isOutgoing ? 'justify-end text-primary-foreground/75' : 'justify-end text-muted-foreground'
          )}
        >
          {message.edited_at && <span className="italic opacity-80">(edited)</span>}
          <span>{formatMessageTime(message.created_at)}</span>
          {renderStatus()}
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
                onClick={() => toggleReaction(message.id, emoji)}
                className={cn(
                  'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all cursor-pointer shadow-xs',
                  hasReacted
                    ? 'bg-primary/15 border-primary/40 text-primary font-medium'
                    : 'bg-card border-border/80 text-muted-foreground hover:bg-muted'
                )}
              >
                <span>{emoji}</span>
                <span className="text-[11px] font-mono">{userIds.length}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Dialog
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        size="sm"
        title="Delete message?"
        description="Are you sure you want to delete this message? This action removes it for both participants."
      >
        <div className="flex items-center justify-end gap-2 pt-4">
          <Button variant="outline" size="sm" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            Delete for everyone
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
