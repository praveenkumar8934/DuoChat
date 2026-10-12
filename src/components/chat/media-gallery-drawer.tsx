'use client';

import * as React from 'react';
import {
  X,
  Image as ImageIcon,
  Music,
  Film,
  FileText,
  Download,
  Calendar,
  Lock,
} from 'lucide-react';
import { useChat } from '@/context/chat-context';
import { Avatar } from '@/components/ui/avatar';
import { formatBytes, formatMessageDate } from '@/lib/utils';
import { ImagePreview } from './media/image-preview';

export function MediaGalleryDrawer() {
  const {
    isMediaDrawerOpen,
    setIsMediaDrawerOpen,
    activeConversation,
    messages,
  } = useChat();

  const [activeTab, setActiveTab] = React.useState<'images' | 'audio' | 'videos' | 'files'>('images');

  if (!isMediaDrawerOpen) return null;

  const friend = activeConversation?.otherUser;

  // Filter messages by category
  const images = messages.filter(m => m.message_type === 'image' && m.signedMediaUrl);
  const audioFiles = messages.filter(m => m.message_type === 'audio' && m.signedMediaUrl);
  const videos = messages.filter(m => m.message_type === 'video' && m.signedMediaUrl);
  const documents = messages.filter(m => m.message_type === 'file' && m.original_filename);

  return (
    <aside className="w-80 lg:w-96 border-l border-border/80 bg-card flex flex-col h-full animate-in slide-in-from-right duration-200 z-20">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/60">
        <h3 className="text-sm font-semibold text-foreground">Conversation Details</h3>
        <button
          onClick={() => setIsMediaDrawerOpen(false)}
          className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          aria-label="Close details"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Profile Card */}
        <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-muted/40 border border-border/40">
          <Avatar
            src={friend?.avatar_path}
            name={friend?.display_name || 'Friend'}
            size="lg"
            className="mb-3"
          />
          <h4 className="font-semibold text-base text-foreground">
            {friend?.display_name || 'Friend'}
          </h4>
          {friend?.username && (
            <p className="text-xs text-muted-foreground font-mono">@{friend.username}</p>
          )}
          {friend?.bio && (
            <p className="text-xs text-muted-foreground mt-2 max-w-xs">{friend.bio}</p>
          )}

          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-3 pt-3 border-t border-border/40 w-full justify-center">
            <Lock className="w-3.5 h-3.5 text-primary" />
            <span>Private One-to-One Space</span>
          </div>
        </div>

        {/* Media Tabs */}
        <div>
          <div className="flex rounded-xl bg-muted p-1 text-xs font-medium">
            <button
              onClick={() => setActiveTab('images')}
              className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'images'
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Photos ({images.length})
            </button>
            <button
              onClick={() => setActiveTab('audio')}
              className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'audio'
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Audio ({audioFiles.length})
            </button>
            <button
              onClick={() => setActiveTab('videos')}
              className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'videos'
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Video ({videos.length})
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'files'
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Files ({documents.length})
            </button>
          </div>

          {/* Tab Content */}
          <div className="mt-4">
            {activeTab === 'images' && (
              <div>
                {images.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    No photos shared yet
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {images.map(img => (
                      <div key={img.id} className="relative aspect-square">
                        <ImagePreview
                          src={img.signedMediaUrl!}
                          filename={img.original_filename}
                          fileSize={img.file_size}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'audio' && (
              <div className="space-y-2">
                {audioFiles.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    No songs or voice notes shared yet
                  </p>
                ) : (
                  audioFiles.map(audio => (
                    <div
                      key={audio.id}
                      className="p-3 rounded-xl bg-muted/50 border border-border/40 text-xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Music className="w-4 h-4 text-violet-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{audio.original_filename || 'Audio track'}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {formatMessageDate(audio.created_at)}
                          </p>
                        </div>
                      </div>
                      <a
                        href={audio.signedMediaUrl!}
                        download={audio.original_filename || 'audio.mp3'}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'videos' && (
              <div className="space-y-2">
                {videos.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    No videos shared yet
                  </p>
                ) : (
                  videos.map(vid => (
                    <div
                      key={vid.id}
                      className="p-3 rounded-xl bg-muted/50 border border-border/40 text-xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Film className="w-4 h-4 text-sky-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{vid.original_filename || 'Video clip'}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {formatMessageDate(vid.created_at)}
                          </p>
                        </div>
                      </div>
                      <a
                        href={vid.signedMediaUrl!}
                        download={vid.original_filename || 'video.mp4'}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'files' && (
              <div className="space-y-2">
                {documents.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    No documents shared yet
                  </p>
                ) : (
                  documents.map(doc => (
                    <div
                      key={doc.id}
                      className="p-3 rounded-xl bg-muted/50 border border-border/40 text-xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{doc.original_filename}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            {doc.file_size ? formatBytes(doc.file_size) : 'File'} •{' '}
                            {formatMessageDate(doc.created_at)}
                          </p>
                        </div>
                      </div>
                      {doc.signedMediaUrl && (
                        <a
                          href={doc.signedMediaUrl}
                          download={doc.original_filename || 'document'}
                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
