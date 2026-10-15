'use client';

import * as React from 'react';
import {
  Phone,
  PhoneOff,
  PhoneIncoming,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Maximize2,
  Minimize2,
  SwitchCamera,
  Sparkles,
  Heart,
  AlertCircle,
} from 'lucide-react';
import { useCall } from '@/context/call-context';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

// Native MediaStream Video Player
function StreamVideoRenderer({
  stream,
  mirror = false,
  className,
}: {
  stream: MediaStream | null;
  mirror?: boolean;
  className?: string;
}) {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (stream) {
      el.srcObject = stream;
    } else {
      el.srcObject = null;
    }
  }, [stream]);

  if (!stream) return null;

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={mirror} // local mirror preview muted to prevent audio feedback
      className={cn(
        'w-full h-full object-cover',
        mirror && 'scale-x-[-1]',
        className
      )}
    />
  );
}

function formatDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(mins)}:${pad(secs)}`;
}

export function CallOverlay() {
  const {
    callState,
    callType,
    partner,
    caller,
    duration,
    isMuted,
    isCameraOff,
    isReconnecting,
    errorMessage,
    localStream,
    remoteStream,
    isRemoteCameraOff,
    isRemoteMuted,
    acceptCall,
    declineCall,
    endCall,
    toggleMute,
    toggleCamera,
    switchCamera,
  } = useCall();

  const [isFullScreen, setIsFullScreen] = React.useState(false);
  const overlayContainerRef = React.useRef<HTMLDivElement>(null);
  const remoteAudioRef = React.useRef<HTMLAudioElement>(null);

  // Play remote audio track automatically
  React.useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.play().catch(e => {
        console.warn('Auto-play audio prevented by browser:', e);
      });
    }
  }, [remoteStream]);

  // Fullscreen toggle handler
  const handleToggleFullScreen = React.useCallback(async () => {
    if (!overlayContainerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await overlayContainerRef.current.requestFullscreen();
        setIsFullScreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullScreen(false);
      }
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    const handleFsChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  if (callState === 'idle') return null;

  // 1. INCOMING CALL MODAL (Ringing popup)
  if (callState === 'incoming_ringing') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
        <div className="w-full max-w-sm rounded-3xl bg-card border border-rose-500/30 p-6 shadow-2xl flex flex-col items-center text-center space-y-6 relative overflow-hidden">
          {/* Romantic ambient glow */}
          <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-rose-500/20 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-32 h-32 rounded-full bg-pink-500/20 blur-2xl pointer-events-none" />

          {/* Call Type Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-500 border border-rose-500/25 animate-pulse">
            {callType === 'video' ? <Video className="w-3.5 h-3.5" /> : <PhoneIncoming className="w-3.5 h-3.5" />}
            <span className="capitalize">Incoming {callType} Call (WebRTC)</span>
          </div>

          {/* Caller Avatar with Pulse Ring */}
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-rose-500/25 animate-ping duration-1000" />
            <div className="relative p-1 rounded-full bg-gradient-to-tr from-rose-500 via-pink-500 to-rose-400 shadow-xl">
              <Avatar
                src={caller?.avatar}
                name={caller?.name || 'Partner'}
                size="xl"
                className="w-24 h-24 border-2 border-background shadow-md"
              />
            </div>
            <span className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-emerald-500 text-white shadow-md">
              <Sparkles className="w-4 h-4 fill-current" />
            </span>
          </div>

          <div>
            <h3 className="text-lg font-bold text-foreground">
              {caller?.name || 'Your Partner'}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {caller?.username ? `@${caller.username}` : 'DuoChat Private Call'}
            </p>
            <p className="text-xs font-medium text-rose-600 dark:text-rose-400 mt-2 flex items-center justify-center gap-1">
              <Heart className="w-3.5 h-3.5 fill-current animate-bounce" />
              <span>Ringing...</span>
            </p>
          </div>

          {/* Accept / Decline Action Buttons */}
          <div className="flex items-center justify-center gap-8 w-full pt-2">
            {/* Decline */}
            <div className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={declineCall}
                className="w-14 h-14 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title="Decline Call"
                aria-label="Decline Call"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
              <span className="text-[11px] font-semibold text-muted-foreground">Decline</span>
            </div>

            {/* Accept */}
            <div className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={acceptCall}
                className="w-14 h-14 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer animate-bounce"
                title="Accept Call"
                aria-label="Accept Call"
              >
                {callType === 'video' ? <Video className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
              </button>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Accept</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. OUTGOING CALL / CONNECTING / ACTIVE CALL FULL-SCREEN OVERLAY
  return (
    <div
      ref={overlayContainerRef}
      className="fixed inset-0 z-50 flex flex-col bg-stone-950 text-white select-none overflow-hidden animate-in fade-in duration-200"
    >
      {/* Remote Audio Track (Plays voice in background) */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* Top Bar with Call Status & Duration */}
      <div className="p-4 sm:p-6 flex items-center justify-between z-20 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3">
          <Avatar
            src={partner?.avatar}
            name={partner?.name || 'Partner'}
            size="md"
            className="border-2 border-rose-500/40"
          />
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
              <span>{partner?.name || 'Partner'}</span>
              <Heart className="w-3 h-3 text-rose-500 fill-current inline" />
            </h3>
            <div className="flex items-center gap-2 text-xs">
              {callState === 'connected' ? (
                <span className="font-mono text-emerald-400 font-semibold tracking-wide flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {formatDuration(duration)}
                </span>
              ) : isReconnecting ? (
                <span className="text-amber-400 font-medium animate-pulse">Reconnecting...</span>
              ) : callState === 'connecting' ? (
                <span className="text-rose-300 font-medium animate-pulse">Connecting peer-to-peer...</span>
              ) : (
                <span className="text-rose-300 font-medium animate-pulse">Ringing...</span>
              )}

              {isRemoteMuted && (
                <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded-md text-amber-300">
                  Partner Muted
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right side controls: Fullscreen */}
        <div className="flex items-center gap-2">
          {callType === 'video' && (
            <button
              type="button"
              onClick={handleToggleFullScreen}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors cursor-pointer"
              title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
              aria-label="Toggle Full Screen"
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Main Viewport Content Area */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {/* VIDEO CALL VIEWPORT */}
        {callType === 'video' ? (
          <div className="w-full h-full relative flex items-center justify-center bg-neutral-900">
            {/* Remote Partner Video */}
            {remoteStream && remoteStream.getVideoTracks().length > 0 && !isRemoteCameraOff ? (
              <StreamVideoRenderer
                stream={remoteStream}
                className="w-full h-full object-cover"
              />
            ) : (
              /* Remote Camera is Off or Ringing */
              <div className="flex flex-col items-center justify-center space-y-4 text-center p-6">
                <div className="relative p-1.5 rounded-full bg-gradient-to-tr from-rose-500 via-pink-500 to-rose-400 shadow-2xl">
                  <Avatar
                    src={partner?.avatar}
                    name={partner?.name || 'Partner'}
                    size="xl"
                    className="rounded-full [&>div]:w-28 [&>div]:h-28 [&>div]:sm:w-36 [&>div]:sm:h-36 [&>div]:text-4xl [&>div]:border-4 [&>div]:border-stone-900 shadow-xl"
                  />
                </div>
                <div>
                  <h4 className="text-lg sm:text-xl font-bold text-white">
                    {partner?.name || 'Partner'}
                  </h4>
                  <p className="text-xs sm:text-sm text-stone-400 mt-1">
                    {callState === 'connected'
                      ? 'Camera is currently off'
                      : 'Waiting for partner to answer...'}
                  </p>
                </div>
              </div>
            )}

            {/* Local Video Preview (Picture-in-Picture floating window) */}
            {localStream && localStream.getVideoTracks().length > 0 && !isCameraOff && (
              <div className="absolute bottom-24 right-4 sm:bottom-28 sm:right-6 w-28 h-40 sm:w-36 sm:h-52 rounded-2xl overflow-hidden border-2 border-rose-500/50 shadow-2xl bg-black z-30">
                <StreamVideoRenderer stream={localStream} mirror className="w-full h-full object-cover" />
                <div className="absolute bottom-1.5 left-2 text-[10px] font-semibold text-white/90 bg-black/60 px-1.5 py-0.5 rounded-md">
                  You
                </div>
              </div>
            )}
          </div>
        ) : (
          /* VOICE CALL VIEWPORT */
          <div className="flex flex-col items-center justify-center space-y-6 text-center p-6 relative">
            {/* Ambient romantic halo */}
            <div className="absolute w-72 h-72 rounded-full bg-gradient-to-tr from-rose-600/30 via-pink-600/20 to-rose-400/20 blur-3xl pointer-events-none" />

            <div className="relative">
              {callState === 'connected' && (
                <div className="absolute -inset-4 rounded-full bg-rose-500/20 animate-pulse duration-1000 blur-md" />
              )}
              <div className="relative p-1.5 rounded-full bg-gradient-to-tr from-rose-500 via-pink-500 to-rose-400 shadow-2xl">
                <Avatar
                  src={partner?.avatar}
                  name={partner?.name || 'Partner'}
                  size="xl"
                  className="rounded-full [&>div]:w-28 [&>div]:h-28 [&>div]:sm:w-36 [&>div]:sm:h-36 [&>div]:text-4xl [&>div]:border-4 [&>div]:border-stone-950"
                />
              </div>
            </div>

            <div className="space-y-1 relative z-10">
              <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center justify-center gap-2">
                <span>{partner?.name || 'Partner'}</span>
                <Heart className="w-4 h-4 text-rose-500 fill-current" />
              </h3>
              <p className="text-xs sm:text-sm text-stone-300">
                {callState === 'connected'
                  ? 'Private Voice Call • WebRTC End-to-End'
                  : 'Calling partner...'}
              </p>
              {callState === 'connected' && (
                <div className="pt-2">
                  <span className="font-mono text-base font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full shadow-sm">
                    {formatDuration(duration)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error Notice Banner if any */}
      {errorMessage && (
        <div className="mx-4 mb-2 p-3 rounded-2xl bg-destructive/20 border border-destructive/40 text-destructive-foreground text-xs flex items-center justify-between z-30">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Bottom Floating Control Bar */}
      <div className="p-4 sm:p-6 pb-6 sm:pb-8 flex items-center justify-center gap-3 sm:gap-5 z-20 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
        {/* Microphone Toggle Button */}
        <button
          type="button"
          onClick={toggleMute}
          className={cn(
            'p-3.5 sm:p-4 rounded-full transition-all shadow-lg cursor-pointer hover:scale-105 active:scale-95',
            isMuted
              ? 'bg-amber-500 text-stone-950 hover:bg-amber-400'
              : 'bg-white/15 text-white hover:bg-white/25 backdrop-blur-md'
          )}
          title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6" />}
        </button>

        {/* Video Camera Toggle (If Video Call) */}
        {callType === 'video' && (
          <button
            type="button"
            onClick={toggleCamera}
            className={cn(
              'p-3.5 sm:p-4 rounded-full transition-all shadow-lg cursor-pointer hover:scale-105 active:scale-95',
              isCameraOff
                ? 'bg-amber-500 text-stone-950 hover:bg-amber-400'
                : 'bg-white/15 text-white hover:bg-white/25 backdrop-blur-md'
            )}
            title={isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
            aria-label={isCameraOff ? 'Camera On' : 'Camera Off'}
          >
            {isCameraOff ? <VideoOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Video className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>
        )}

        {/* Switch Camera (Front/Back) on Mobile */}
        {callType === 'video' && (
          <button
            type="button"
            onClick={switchCamera}
            className="p-3.5 sm:p-4 rounded-full bg-white/15 text-white hover:bg-white/25 backdrop-blur-md transition-all shadow-lg cursor-pointer hover:scale-105 active:scale-95"
            title="Switch Camera (Mobile / Devices)"
            aria-label="Switch Camera"
          >
            <SwitchCamera className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}

        {/* End Call Button */}
        <button
          type="button"
          onClick={endCall}
          className="px-6 sm:px-8 py-3.5 sm:py-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-2 shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title="End Call"
          aria-label="End Call"
        >
          <PhoneOff className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-xs sm:text-sm">End Call</span>
        </button>
      </div>
    </div>
  );
}
