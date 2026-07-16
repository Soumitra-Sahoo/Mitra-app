import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useAuth } from "@clerk/clerk-react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import api from "../api/axios.js";
import toast from "react-hot-toast";
import { addMessage } from "../features/messages/messagesSlice.js";

const CallContext = createContext(null);
export const useCall = () => useContext(CallContext);

// Public STUN servers — enough to establish a connection on most home/mobile
// networks. Behind a symmetric NAT or strict corporate firewall this alone
// isn't enough; a real production deployment would add a TURN server here
// (e.g. coturn, Twilio, or Metered) as a relay fallback.
// STUN alone only works when both peers' NATs are traversable directly —
// it fails in exactly the way just observed (one-way audio, missing video)
// when one side is behind a stricter NAT (very common on cellular/mobile
// networks). TURN relays media through a third-party server as a fallback
// when a direct peer-to-peer path isn't possible. These are the Open Relay
// Project's public free-tier TURN credentials — fine for a demo/portfolio
// project, but a real production deployment should use a dedicated TURN
// provider (Metered.ca, Twilio, or self-hosted coturn) since this is a
// shared, rate-limited public relay.
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
};

const RING_TIMEOUT_MS = 30000;

export const CallProvider = ({ children }) => {
  const { getToken } = useAuth();
  const currentUser = useSelector((s) => s.user.value);
  const dispatch = useDispatch();
  const location = useLocation();

  const [callState, setCallState] = useState("idle"); // idle | calling | ringing | connected
  const [callType, setCallType] = useState(null); // 'audio' | 'video'
  const [remoteUser, setRemoteUser] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [callStartedAt, setCallStartedAt] = useState(null);

  const pcRef = useRef(null);
  const callIdRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteMediaStreamRef = useRef(null); // accumulator, see createPeerConnection
  const pendingCandidatesRef = useRef([]);
  const ringTimeoutRef = useRef(null);
  const incomingRef = useRef(null); // the raw 'call-incoming' signal payload

  const authHeader = async () => ({
    headers: { Authorization: `Bearer ${await getToken()}` },
  });

  const appendIfChatOpen = useCallback(
    (message, otherId) => {
      if (location.pathname === `/messages/${otherId}`) {
        dispatch(addMessage(message));
      }
    },
    [location.pathname, dispatch],
  );

  const cleanup = useCallback(() => {
    clearTimeout(ringTimeoutRef.current);
    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.oniceconnectionstatechange = null;
      pcRef.current.onsignalingstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
    }
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    remoteMediaStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setRemoteUser(null);
    setCallType(null);
    setCallState("idle");
    setMuted(false);
    setCameraOff(false);
    setCallStartedAt(null);
    callIdRef.current = null;
    pendingCandidatesRef.current = [];
    incomingRef.current = null;
  }, []);

  const createPeerConnection = useCallback(
    (toUserId) => {
      // A fresh accumulator per call — tracks get added to this single,
      // stable MediaStream object as they arrive, instead of relying on
      // e.streams[0] always being the same reference across multiple
      // ontrack firings. Belt-and-suspenders alongside the srcObject
      // reassignment guard in ActiveCall.jsx.
      remoteMediaStreamRef.current = new MediaStream();

      const pc = new RTCPeerConnection(ICE_SERVERS);

      pc.onicecandidate = async (e) => {
        if (!e.candidate || !callIdRef.current) return;
        try {
          const headers = await authHeader();
          api.post(
            "/api/call/ice-candidate",
            { to: toUserId, callId: callIdRef.current, candidate: e.candidate },
            headers,
          );
        } catch (_) {}
      };

      pc.ontrack = (e) => {
        // Diagnostic — check DevTools console on both devices during a
        // call. readyState should be "live" and enabled should be true;
        // anything else means the track itself is broken upstream of any
        // rendering code.
        console.log(
          "[ontrack]",
          e.track.kind,
          "readyState:",
          e.track.readyState,
          "enabled:",
          e.track.enabled,
        );
        const acc = remoteMediaStreamRef.current;
        if (acc && !acc.getTracks().some((t) => t.id === e.track.id)) {
          acc.addTrack(e.track);
        }
        setRemoteStream(acc);
      };
      
      pc.onconnectionstatechange = () => {
        console.log("[pc] connectionState:", pc.connectionState);
      };
      pc.oniceconnectionstatechange = () => {
        console.log("[pc] iceConnectionState:", pc.iceConnectionState);
      };
      pc.onsignalingstatechange = () => {
        console.log("[pc] signalingState:", pc.signalingState);
      };

      return pc;
    },
    [getToken],
  );

  const startCall = useCallback(
    async (toUser, type) => {
      if (callState !== "idle") {
        toast.error("You're already in a call");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: type === "video",
        });
        console.log(
          "[local stream/startCall]",
          stream.getTracks().map((t) => `${t.kind} readyState=${t.readyState} enabled=${t.enabled}`),
        );
        localStreamRef.current = stream;
        setLocalStream(stream);
        setCallType(type);
        setRemoteUser(toUser);
        setCallState("calling");

        const callId = `${currentUser?._id}-${Date.now()}`;
        callIdRef.current = callId;

        const pc = createPeerConnection(toUser._id);
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
        pcRef.current = pc;

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        const headers = await authHeader();
        const { data } = await api.post(
          "/api/call/initiate",
          { to: toUser._id, callType: type, sdp: offer, callId },
          headers,
        );

        if (!data.success) {
          toast.error(data.message);
          cleanup();
          return;
        }

        ringTimeoutRef.current = setTimeout(() => {
          toast("No answer", { icon: "📵" });
          finishCallRef.current("missed", 0, toUser._id, callId, type);
        }, RING_TIMEOUT_MS);
      } catch (error) {
        toast.error(
          error?.name === "NotAllowedError"
            ? "Camera/microphone access denied"
            : error.message || "Could not start call",
        );
        cleanup();
      }
    },
    [callState, currentUser, createPeerConnection, cleanup, getToken],
  );

  const finishCall = useCallback(
    async (status, duration, toId, callId, type) => {
      try {
        const headers = await authHeader();
        const { data } = await api.post(
          "/api/call/end",
          { to: toId, callId, callType: type, status, duration },
          headers,
        );
        if (data.success && data.message) {
          appendIfChatOpen(data.message, toId);
        }
      } catch (_) {}
      cleanup();
    },
    [getToken, cleanup, appendIfChatOpen],
  );
  const finishCallRef = useRef(finishCall);
  useEffect(() => {
    finishCallRef.current = finishCall;
  }, [finishCall]);

  const endCall = useCallback(() => {
    if (!remoteUser || !callIdRef.current) {
      cleanup();
      return;
    }
    const duration = callStartedAt
      ? Math.floor((Date.now() - callStartedAt) / 1000)
      : 0;
    const status = callState === "connected" ? "completed" : "cancelled";
    finishCall(status, duration, remoteUser._id, callIdRef.current, callType);
  }, [remoteUser, callStartedAt, callState, callType, finishCall, cleanup]);

  const declineCall = useCallback(
    async (reason = "declined") => {
      const incoming = incomingRef.current;
      if (!incoming) {
        cleanup();
        return;
      }
      try {
        const headers = await authHeader();
        const { data } = await api.post(
          "/api/call/reject",
          {
            to: incoming.from,
            callId: incoming.callId,
            callType: incoming.callType,
            reason,
          },
          headers,
        );
        if (data.success && data.message) {
          appendIfChatOpen(data.message, incoming.from);
        }
      } catch (_) {}
      cleanup();
    },
    [getToken, cleanup, appendIfChatOpen],
  );

  const acceptCall = useCallback(async () => {
    const incoming = incomingRef.current;
    if (!incoming) return;
    const { from, callType: type, sdp, callId } = incoming;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === "video",
      });
      console.log(
        "[local stream/acceptCall]",
        stream.getTracks().map((t) => `${t.kind} readyState=${t.readyState} enabled=${t.enabled}`),
      );
      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = createPeerConnection(from);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      pcRef.current = pc;

      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      for (const c of pendingCandidatesRef.current) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(c));
        } catch (_) {}
      }
      pendingCandidatesRef.current = [];

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      const headers = await authHeader();
      await api.post(
        "/api/call/answer",
        { to: from, callId, sdp: answer },
        headers,
      );

      setCallState("connected");
      setCallStartedAt(Date.now());
    } catch (error) {
      toast.error("Could not access camera/microphone");
      declineCall("busy");
    }
  }, [createPeerConnection, getToken, declineCall]);

  const handleSignal = useCallback(
    async (data) => {
      console.log("[call signal received]", data.type, data);
      switch (data.type) {
        case "call-incoming": {
          if (callState !== "idle") {
            try {
              const headers = await authHeader();
              await api.post(
                "/api/call/reject",
                {
                  to: data.from,
                  callId: data.callId,
                  callType: data.callType,
                  reason: "busy",
                },
                headers,
              );
            } catch (_) {}
            return;
          }
          incomingRef.current = data;
          callIdRef.current = data.callId;
          setRemoteUser(data.callerInfo);
          setCallType(data.callType);
          setCallState("ringing");
          break;
        }
        case "call-answered": {
          if (data.callId !== callIdRef.current || !pcRef.current) return;
          clearTimeout(ringTimeoutRef.current);
          await pcRef.current.setRemoteDescription(
            new RTCSessionDescription(data.sdp),
          );
          for (const c of pendingCandidatesRef.current) {
            try {
              await pcRef.current.addIceCandidate(new RTCIceCandidate(c));
            } catch (_) {}
          }
          pendingCandidatesRef.current = [];
          setCallState("connected");
          setCallStartedAt(Date.now());
          break;
        }
        case "call-ice-candidate": {
          if (data.callId !== callIdRef.current) return;
          if (pcRef.current?.currentRemoteDescription) {
            try {
              await pcRef.current.addIceCandidate(
                new RTCIceCandidate(data.candidate),
              );
            } catch (_) {}
          } else {
            pendingCandidatesRef.current.push(data.candidate);
          }
          break;
        }
        case "call-rejected": {
          if (data.callId !== callIdRef.current) return;
          if (data.message) {
            appendIfChatOpen(data.message, data.message.to_user_id);
          }
          toast(data.reason === "busy" ? "User is busy" : "Call declined", {
            icon: "📵",
          });
          cleanup();
          break;
        }
        case "call-ended": {
          if (data.callId !== callIdRef.current) return;
          if (data.message) {
            appendIfChatOpen(data.message, data.message.from_user_id?._id);
          }
          toast("Call ended", { icon: "📴" });
          cleanup();
          break;
        }
        default:
          break;
      }
    },
    [callState, cleanup, getToken, appendIfChatOpen],
  );

  const handleSignalRef = useRef(handleSignal);
  useEffect(() => {
    handleSignalRef.current = handleSignal;
  }, [handleSignal]);
  const stableHandleSignal = useCallback((data) => handleSignalRef.current(data), []);

  const toggleMute = useCallback(() => {
    localStreamRef.current
      ?.getAudioTracks()
      .forEach((t) => (t.enabled = muted));
    setMuted((m) => !m);
  }, [muted]);

  const toggleCamera = useCallback(() => {
    localStreamRef.current
      ?.getVideoTracks()
      .forEach((t) => (t.enabled = cameraOff));
    setCameraOff((c) => !c);
  }, [cameraOff]);

  const value = {
    callState,
    callType,
    remoteUser,
    localStream,
    remoteStream,
    muted,
    cameraOff,
    callStartedAt,
    startCall,
    acceptCall,
    declineCall,
    endCall,
    toggleMute,
    toggleCamera,
    handleSignal: stableHandleSignal,
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};