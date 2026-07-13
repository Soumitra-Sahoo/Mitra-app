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
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

const RING_TIMEOUT_MS = 30000;

export const CallProvider = ({ children }) => {
  const { getToken } = useAuth();
  const currentUser = useSelector((s) => s.user.value);
  const dispatch = useDispatch();
  const location = useLocation();

  const [callState, setCallState] = useState("idle"); 
  const [callType, setCallType] = useState(null); 
  const [remoteUser, setRemoteUser] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [callStartedAt, setCallStartedAt] = useState(null);

  const pcRef = useRef(null);
  const callIdRef = useRef(null);
  const localStreamRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const ringTimeoutRef = useRef(null);
  const incomingRef = useRef(null); 

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
      pcRef.current.close();
      pcRef.current = null;
    }
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
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

      pc.ontrack = (e) => setRemoteStream(e.streams[0]);

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
          if (pcRef.current?.remoteDescription) {
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