'use client';

import * as React from 'react';
import { useAuth } from '@/context/auth-context';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { callSounds } from '@/lib/call-sounds';
import { toast } from '@/components/ui/toast';
import type { CallType, CallStatus } from '@/types/database';

export interface CallParticipantInfo {
  id: string;
  name: string;
  avatar?: string | null;
  username?: string | null;
}

export type ActiveCallState =
  | 'idle'
  | 'initiating'
  | 'outgoing_ringing'
  | 'incoming_ringing'
  | 'connecting'
  | 'connected'
  | 'declined'
  | 'busy'
  | 'ended'
  | 'failed';

const DEFAULT_ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
  iceCandidatePoolSize: 10,
};

interface CallContextType {
  callState: ActiveCallState;
  callType: CallType;
  conversationId: string | null;
  callId: string | null;
  partner: CallParticipantInfo | null;
  caller: CallParticipantInfo | null;
  duration: number; // in seconds
  isMuted: boolean;
  isCameraOff: boolean;
  isReconnecting: boolean;
  errorMessage: string | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isRemoteCameraOff: boolean;
  isRemoteMuted: boolean;
  startCall: (
    conversationId: string,
    type: CallType,
    partner: CallParticipantInfo
  ) => Promise<void>;
  acceptCall: () => Promise<void>;
  declineCall: () => Promise<void>;
  endCall: () => Promise<void>;
  toggleMute: () => Promise<void>;
  toggleCamera: () => Promise<void>;
  switchCamera: () => Promise<void>;
}

const CallContext = React.createContext<CallContextType | undefined>(undefined);

export function CallProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();

  const [callState, setCallState] = React.useState<ActiveCallState>('idle');
  const [callType, setCallType] = React.useState<CallType>('voice');
  const [conversationId, setConversationId] = React.useState<string | null>(null);
  const [callId, setCallId] = React.useState<string | null>(null);
  const [partner, setPartner] = React.useState<CallParticipantInfo | null>(null);
  const [caller, setCaller] = React.useState<CallParticipantInfo | null>(null);
  const [duration, setDuration] = React.useState<number>(0);
  const [isMuted, setIsMuted] = React.useState<boolean>(false);
  const [isCameraOff, setIsCameraOff] = React.useState<boolean>(false);
  const [isReconnecting, setIsReconnecting] = React.useState<boolean>(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // WebRTC Native Streams
  const [localStream, setLocalStream] = React.useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = React.useState<MediaStream | null>(null);
  const [isRemoteCameraOff, setIsRemoteCameraOff] = React.useState<boolean>(false);
  const [isRemoteMuted, setIsRemoteMuted] = React.useState<boolean>(false);

  const pcRef = React.useRef<RTCPeerConnection | null>(null);
  const localStreamRef = React.useRef<MediaStream | null>(null);
  const durationTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const ringingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const iceCandidateQueueRef = React.useRef<RTCIceCandidateInit[]>([]);
  const facingModeRef = React.useRef<'user' | 'environment'>('user');
  const signalingChannelRef = React.useRef<any>(null);

  // Keep local stream ref in sync
  React.useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  // Handle call duration timer
  React.useEffect(() => {
    if (callState === 'connected') {
      durationTimerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    } else {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
      if (callState === 'idle') {
        setDuration(0);
      }
    }

    return () => {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
    };
  }, [callState]);

  // Clean up on unmount
  React.useEffect(() => {
    return () => {
      if (ringingTimeoutRef.current) {
        clearTimeout(ringingTimeoutRef.current);
      }
      callSounds.stopRing();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (pcRef.current) {
        pcRef.current.close();
      }
    };
  }, []);

  // Update Call Status in Database via API
  const updateCallStatusInDb = React.useCallback(
    async (targetCallId: string | null, status: CallStatus, callDuration?: number) => {
      if (!targetCallId) return;
      try {
        await fetch('/api/calls/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callId: targetCallId,
            status,
            durationSeconds: callDuration,
          }),
        });
      } catch (e) {
        console.warn('Could not record call status in DB:', e);
      }
    },
    []
  );

  // Helper to cleanup WebRTC peer connection and media tracks
  const cleanupWebRTC = React.useCallback(() => {
    callSounds.stopRing();

    if (ringingTimeoutRef.current) {
      clearTimeout(ringingTimeoutRef.current);
      ringingTimeoutRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      setLocalStream(null);
    }

    if (pcRef.current) {
      try {
        pcRef.current.ontrack = null;
        pcRef.current.onicecandidate = null;
        pcRef.current.onconnectionstatechange = null;
        pcRef.current.close();
      } catch {
        // ignore
      }
      pcRef.current = null;
    }

    if (signalingChannelRef.current) {
      try {
        const supabase = getSupabaseBrowserClient();
        supabase.removeChannel(signalingChannelRef.current);
      } catch {
        // ignore
      }
      signalingChannelRef.current = null;
    }

    iceCandidateQueueRef.current = [];
    setRemoteStream(null);
    setIsReconnecting(false);
  }, []);

  // Flush queued ICE candidates
  const flushQueuedIceCandidates = React.useCallback(async (pc: RTCPeerConnection) => {
    if (iceCandidateQueueRef.current.length > 0) {
      for (const candidate of iceCandidateQueueRef.current) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn('Error adding queued ICE candidate:', e);
        }
      }
      iceCandidateQueueRef.current = [];
    }
  }, []);

  // 1. START A CALL (Initiator / Caller Flow)
  const startCall = React.useCallback(
    async (
      convId: string,
      type: CallType,
      targetPartner: CallParticipantInfo
    ) => {
      if (!profile?.id) {
        toast.error('You must be signed in to make calls.');
        return;
      }

      cleanupWebRTC();

      setCallState('initiating');
      setCallType(type);
      setConversationId(convId);
      setPartner(targetPartner);
      setCaller({
        id: profile.id,
        name: profile.display_name,
        avatar: profile.avatar_path,
        username: profile.username,
      });
      setErrorMessage(null);
      setIsMuted(false);
      setIsCameraOff(false);

      try {
        // 1. Initialize call record in database
        const res = await fetch('/api/calls/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: convId,
            callType: type,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to initiate call session.');
        }

        const generatedCallId = data.callId || `call_${Date.now()}`;
        setCallId(generatedCallId);

        // 2. Request user media (audio and/or video)
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
            video:
              type === 'video'
                ? {
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                  }
                : false,
          });
        } catch (mediaErr: unknown) {
          console.error('Media permission error:', mediaErr);
          const msg =
            type === 'video'
              ? 'Camera or microphone access denied. Please allow permissions in browser.'
              : 'Microphone access denied. Please allow microphone permissions in browser.';
          setErrorMessage(msg);
          setCallState('failed');
          toast.error(msg);
          return;
        }

        setLocalStream(stream);

        // 3. Create RTCPeerConnection
        const iceConfig = data.iceServers ? { iceServers: data.iceServers } : DEFAULT_ICE_SERVERS;
        const pc = new RTCPeerConnection(iceConfig);
        pcRef.current = pc;

        // Add local tracks
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
        });

        // Remote track listener
        pc.ontrack = (event) => {
          if (event.streams && event.streams[0]) {
            setRemoteStream(event.streams[0]);
          }
        };

        // ICE Connection & Connection State Listeners
        pc.onconnectionstatechange = () => {
          const state = pc.connectionState;
          if (state === 'connected') {
            setIsReconnecting(false);
            setCallState('connected');
            callSounds.playConnected();
          } else if (state === 'connecting') {
            setCallState('connecting');
          } else if (state === 'failed' || state === 'disconnected') {
            setIsReconnecting(true);
          }
        };

        // 4. Set up dedicated WebRTC signaling channel for this call
        const supabase = getSupabaseBrowserClient();
        const callChannel = supabase.channel(`call-signaling:${generatedCallId}`);
        signalingChannelRef.current = callChannel;

        // ICE candidate handler: send to peer
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            callChannel.send({
              type: 'broadcast',
              event: 'webrtc-ice-candidate',
              payload: {
                candidate: event.candidate.toJSON(),
                senderId: profile.id,
              },
            });
          }
        };

        // Handle signaling responses from recipient
        callChannel
          .on('broadcast', { event: 'call-accepted' }, async () => {
            callSounds.stopRing();
            setCallState('connecting');

            // Caller creates WebRTC Offer
            try {
              const offer = await pc.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: type === 'video',
              });
              await pc.setLocalDescription(offer);

              callChannel.send({
                type: 'broadcast',
                event: 'webrtc-offer',
                payload: {
                  sdp: pc.localDescription?.toJSON(),
                },
              });
            } catch (offerErr) {
              console.error('Error creating WebRTC offer:', offerErr);
            }
          })
          .on('broadcast', { event: 'webrtc-answer' }, async (payload: any) => {
            const answer = payload?.payload?.sdp;
            if (answer && pc.signalingState !== 'closed') {
              try {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
                await flushQueuedIceCandidates(pc);
              } catch (ansErr) {
                console.error('Error setting remote description from answer:', ansErr);
              }
            }
          })
          .on('broadcast', { event: 'webrtc-ice-candidate' }, async (payload: any) => {
            const { candidate, senderId } = payload?.payload || {};
            if (candidate && senderId !== profile.id && pc.signalingState !== 'closed') {
              if (pc.remoteDescription) {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) {
                  console.warn('Error adding ICE candidate:', e);
                }
              } else {
                iceCandidateQueueRef.current.push(candidate);
              }
            }
          })
          .on('broadcast', { event: 'call-declined' }, () => {
            cleanupWebRTC();
            callSounds.playEnded();
            toast.info(`${targetPartner.name} declined the call.`);
            setCallState('idle');
            setPartner(null);
            setCaller(null);
          })
          .on('broadcast', { event: 'call-busy' }, () => {
            cleanupWebRTC();
            callSounds.playEnded();
            toast.info(`${targetPartner.name} is currently busy on another call.`);
            setCallState('idle');
            setPartner(null);
            setCaller(null);
          })
          .on('broadcast', { event: 'call-ended' }, () => {
            cleanupWebRTC();
            callSounds.playEnded();
            toast.info('Call ended');
            setCallState('idle');
            setPartner(null);
            setCaller(null);
          })
          .on('broadcast', { event: 'media-toggle' }, (payload: any) => {
            const { isMuted: peerMuted, isCameraOff: peerCamOff } = payload?.payload || {};
            if (typeof peerMuted === 'boolean') setIsRemoteMuted(peerMuted);
            if (typeof peerCamOff === 'boolean') setIsRemoteCameraOff(peerCamOff);
          })
          .subscribe();

        // 5. Play outgoing ringing tone & notify recipient via user-notifications
        callSounds.startOutgoingRing();
        setCallState('outgoing_ringing');

        const partnerNotificationChannel = supabase.channel(`user-notifications:${targetPartner.id}`);
        await partnerNotificationChannel.send({
          type: 'broadcast',
          event: 'incoming-call',
          payload: {
            callId: generatedCallId,
            conversationId: convId,
            callType: type,
            caller: {
              id: profile.id,
              name: profile.display_name,
              avatar: profile.avatar_path,
              username: profile.username,
            },
          },
        });

        // 6. 45s Ringing timeout
        ringingTimeoutRef.current = setTimeout(async () => {
          cleanupWebRTC();
          callSounds.playEnded();
          toast.info(`${targetPartner.name} did not answer.`);
          await updateCallStatusInDb(generatedCallId, 'missed');
          partnerNotificationChannel.send({
            type: 'broadcast',
            event: 'call-cancelled',
            payload: { callId: generatedCallId },
          });
          setCallState('idle');
        }, 45000);
      } catch (err: unknown) {
        console.error('Error starting call:', err);
        cleanupWebRTC();
        setCallState('failed');
        setErrorMessage(err instanceof Error ? err.message : 'Error starting call');
        toast.error('Could not initiate call.');
      }
    },
    [profile, cleanupWebRTC, flushQueuedIceCandidates, updateCallStatusInDb]
  );

  // 2. ACCEPT CALL (Recipient Flow)
  const acceptCall = React.useCallback(async () => {
    if (!conversationId || !caller || !callId) return;

    callSounds.stopRing();
    if (ringingTimeoutRef.current) {
      clearTimeout(ringingTimeoutRef.current);
      ringingTimeoutRef.current = null;
    }

    setCallState('connecting');

    try {
      // 1. Request local media
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video:
            callType === 'video'
              ? {
                  facingMode: 'user',
                  width: { ideal: 1280 },
                  height: { ideal: 720 },
                }
              : false,
        });
      } catch (mediaErr: unknown) {
        console.error('Media permission error on accept:', mediaErr);
        const msg =
          callType === 'video'
            ? 'Camera or microphone access denied.'
            : 'Microphone access denied.';
        setErrorMessage(msg);
        setCallState('failed');
        toast.error(msg);
        return;
      }

      setLocalStream(stream);

      // 2. Create RTCPeerConnection for recipient
      const pc = new RTCPeerConnection(DEFAULT_ICE_SERVERS);
      pcRef.current = pc;

      // Add local tracks
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Remote track listener
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        }
      };

      // State listener
      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        if (state === 'connected') {
          setIsReconnecting(false);
          setCallState('connected');
          callSounds.playConnected();
        } else if (state === 'connecting') {
          setCallState('connecting');
        } else if (state === 'failed' || state === 'disconnected') {
          setIsReconnecting(true);
        }
      };

      // 3. Connect to call signaling channel
      const supabase = getSupabaseBrowserClient();
      const callChannel = supabase.channel(`call-signaling:${callId}`);
      signalingChannelRef.current = callChannel;

      // ICE candidate handler: send to caller
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          callChannel.send({
            type: 'broadcast',
            event: 'webrtc-ice-candidate',
            payload: {
              candidate: event.candidate.toJSON(),
              senderId: profile?.id,
            },
          });
        }
      };

      callChannel
        .on('broadcast', { event: 'webrtc-offer' }, async (payload: any) => {
          const offer = payload?.payload?.sdp;
          if (offer && pc.signalingState !== 'closed') {
            try {
              await pc.setRemoteDescription(new RTCSessionDescription(offer));
              await flushQueuedIceCandidates(pc);

              // Recipient creates WebRTC Answer
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);

              callChannel.send({
                type: 'broadcast',
                event: 'webrtc-answer',
                payload: {
                  sdp: pc.localDescription?.toJSON(),
                },
              });
            } catch (err) {
              console.error('Error handling WebRTC offer:', err);
            }
          }
        })
        .on('broadcast', { event: 'webrtc-ice-candidate' }, async (payload: any) => {
          const { candidate, senderId } = payload?.payload || {};
          if (candidate && senderId !== profile?.id && pc.signalingState !== 'closed') {
            if (pc.remoteDescription) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
              } catch (e) {
                console.warn('Error adding ICE candidate:', e);
              }
            } else {
              iceCandidateQueueRef.current.push(candidate);
            }
          }
        })
        .on('broadcast', { event: 'call-ended' }, () => {
          cleanupWebRTC();
          callSounds.playEnded();
          toast.info('Partner ended the call');
          setCallState('idle');
          setPartner(null);
          setCaller(null);
        })
        .on('broadcast', { event: 'media-toggle' }, (payload: any) => {
          const { isMuted: peerMuted, isCameraOff: peerCamOff } = payload?.payload || {};
          if (typeof peerMuted === 'boolean') setIsRemoteMuted(peerMuted);
          if (typeof peerCamOff === 'boolean') setIsRemoteCameraOff(peerCamOff);
        })
        .subscribe(async (status: string) => {
          if (status === 'SUBSCRIBED') {
            // Tell caller we accepted!
            await callChannel.send({
              type: 'broadcast',
              event: 'call-accepted',
              payload: { callId },
            });
          }
        });

      await updateCallStatusInDb(callId, 'connected');
    } catch (err: unknown) {
      console.error('Error accepting call:', err);
      cleanupWebRTC();
      setCallState('failed');
      toast.error('Failed to connect call.');
    }
  }, [conversationId, caller, callId, callType, profile?.id, cleanupWebRTC, flushQueuedIceCandidates, updateCallStatusInDb]);

  // 3. DECLINE CALL (Recipient Flow)
  const declineCall = React.useCallback(async () => {
    callSounds.stopRing();
    callSounds.playEnded();

    if (ringingTimeoutRef.current) {
      clearTimeout(ringingTimeoutRef.current);
      ringingTimeoutRef.current = null;
    }

    if (callId) {
      const supabase = getSupabaseBrowserClient();
      const callChannel = supabase.channel(`call-signaling:${callId}`);
      await callChannel.send({
        type: 'broadcast',
        event: 'call-declined',
        payload: { callId },
      });
      await updateCallStatusInDb(callId, 'declined');
    }

    cleanupWebRTC();
    setCallState('idle');
    setCaller(null);
    setPartner(null);
  }, [callId, cleanupWebRTC, updateCallStatusInDb]);

  // 4. END CALL (Both Participants Flow)
  const endCall = React.useCallback(async () => {
    callSounds.stopRing();
    callSounds.playEnded();

    if (ringingTimeoutRef.current) {
      clearTimeout(ringingTimeoutRef.current);
      ringingTimeoutRef.current = null;
    }

    const currentDuration = duration;
    const isActuallyConnected = callState === 'connected';
    const finalStatus: CallStatus = isActuallyConnected ? 'completed' : 'cancelled';

    // Send call-ended broadcast
    if (callId && signalingChannelRef.current) {
      try {
        await signalingChannelRef.current.send({
          type: 'broadcast',
          event: 'call-ended',
          payload: { callId, duration: currentDuration, status: finalStatus },
        });
      } catch {
        // ignore
      }
    }

    await updateCallStatusInDb(callId, finalStatus, currentDuration);

    cleanupWebRTC();
    setCallState('idle');
    setPartner(null);
    setCaller(null);
    setDuration(0);
    toast.info('Call ended');
  }, [duration, callId, callState, cleanupWebRTC, updateCallStatusInDb]);

  // 5. MEDIA CONTROLS
  const toggleMute = React.useCallback(async () => {
    if (!localStreamRef.current) return;
    const nextMuted = !isMuted;
    localStreamRef.current.getAudioTracks().forEach(track => {
      track.enabled = !nextMuted;
    });
    setIsMuted(nextMuted);

    // Broadcast media toggle to peer
    if (signalingChannelRef.current) {
      signalingChannelRef.current.send({
        type: 'broadcast',
        event: 'media-toggle',
        payload: { isMuted: nextMuted },
      });
    }
    toast.info(nextMuted ? 'Microphone muted 🔇' : 'Microphone unmuted 🎙️');
  }, [isMuted]);

  const toggleCamera = React.useCallback(async () => {
    if (!localStreamRef.current) return;
    const nextCameraOff = !isCameraOff;
    localStreamRef.current.getVideoTracks().forEach(track => {
      track.enabled = !nextCameraOff;
    });
    setIsCameraOff(nextCameraOff);

    // Broadcast media toggle to peer
    if (signalingChannelRef.current) {
      signalingChannelRef.current.send({
        type: 'broadcast',
        event: 'media-toggle',
        payload: { isCameraOff: nextCameraOff },
      });
    }
    toast.info(nextCameraOff ? 'Camera turned off 📷' : 'Camera turned on 🎥');
  }, [isCameraOff]);

  const switchCamera = React.useCallback(async () => {
    if (!localStreamRef.current || !pcRef.current) return;
    const newFacing = facingModeRef.current === 'user' ? 'environment' : 'user';
    facingModeRef.current = newFacing;

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: newFacing } },
      });
      const newVideoTrack = newStream.getVideoTracks()[0];

      // Replace track on peer connection
      const sender = pcRef.current.getSenders().find(s => s.track && s.track.kind === 'video');
      if (sender && newVideoTrack) {
        await sender.replaceTrack(newVideoTrack);
      }

      // Stop old video track
      localStreamRef.current.getVideoTracks().forEach(t => t.stop());

      // Update local stream
      const currentAudio = localStreamRef.current.getAudioTracks();
      const combined = new MediaStream([...currentAudio, newVideoTrack]);
      setLocalStream(combined);

      toast.info(`Switched camera to ${newFacing}`);
    } catch {
      toast.error('Camera switching not supported on this device/browser');
    }
  }, []);

  // 6. REAL-TIME SIGNALING LISTENER (Listens to user-notifications channel)
  React.useEffect(() => {
    if (!profile?.id) return;

    const supabase = getSupabaseBrowserClient();
    const userChannel = supabase.channel(`user-notifications:${profile.id}`);

    userChannel
      .on('broadcast', { event: 'incoming-call' }, async (payload: any) => {
        const data = payload?.payload;
        if (!data) return;

        // If currently in an active call, send back busy signal
        if (callState !== 'idle') {
          const callChannel = supabase.channel(`call-signaling:${data.callId}`);
          callChannel.send({
            type: 'broadcast',
            event: 'call-busy',
            payload: { callId: data.callId },
          });
          return;
        }

        // Set incoming call details
        setCallId(data.callId);
        setConversationId(data.conversationId);
        setCallType(data.callType);
        setCaller(data.caller);
        setPartner(data.caller);
        setCallState('incoming_ringing');

        // Play gentle romantic chime
        callSounds.startIncomingRing();

        // Browser push notification if in background
        if (typeof window !== 'undefined' && 'Notification' in window) {
          if (Notification.permission === 'granted' && document.hidden) {
            new Notification(`Incoming ${data.callType} call ❤️`, {
              body: `${data.caller.name} is calling you on DuoChat`,
              icon: data.caller.avatar || '/duochat-logo.png',
            });
          }
        }
      })
      .on('broadcast', { event: 'call-cancelled' }, () => {
        cleanupWebRTC();
        callSounds.playEnded();
        toast.info('Call was cancelled');
        setCallState('idle');
        setCaller(null);
        setPartner(null);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(userChannel);
    };
  }, [profile?.id, callState, cleanupWebRTC]);

  const value = React.useMemo(
    () => ({
      callState,
      callType,
      conversationId,
      callId,
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
      startCall,
      acceptCall,
      declineCall,
      endCall,
      toggleMute,
      toggleCamera,
      switchCamera,
    }),
    [
      callState,
      callType,
      conversationId,
      callId,
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
      startCall,
      acceptCall,
      declineCall,
      endCall,
      toggleMute,
      toggleCamera,
      switchCamera,
    ]
  );

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
}

export function useCall() {
  const context = React.useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
}
