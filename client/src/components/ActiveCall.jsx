import React, { useEffect, useRef, useState } from "react";
import { useCall } from "../context/CallContext.jsx";
import { Phone, Mic, MicOff, Video, VideoOff, Volume2, Speaker } from "lucide-react";
import toast from "react-hot-toast";

const formatDuration = (seconds) => {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
};

const ActiveCall = () => {
  const {
    callState,
    callType,
    remoteUser,
    localStream,
    remoteStream,
    muted,
    cameraOff,
    callStartedAt,
    endCall,
    toggleMute,
    toggleCamera,
  } = useCall();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [elapsed, setElapsed] = useState(0);
  const [blockedByAutoplay, setBlockedByAutoplay] = useState(false);
  const [usingAltOutput, setUsingAltOutput] = useState(false);

  useEffect(() => {
    const el = localVideoRef.current;
    if (!el) return;
    if (el.srcObject !== localStream) {
      el.srcObject = localStream || null;
    }
    if (localStream) {
      el.play().catch((err) => {
        console.log("[local video] play() issue:", err.name, err.message);
      });
    }
  }, [localStream]);

  useEffect(() => {
    const el = remoteVideoRef.current;
    if (!el) return;
    if (el.srcObject !== remoteStream) {
      el.srcObject = remoteStream || null;
    }
    if (remoteStream) {
      el.play()
        .then(() => setBlockedByAutoplay(false))
        .catch((err) => {
          if (err.name === "NotAllowedError") {
            console.log("[remote video] play() blocked:", err.name, err.message);
            setBlockedByAutoplay(true);
          } else {
            console.log("[remote video] play() interrupted (non-fatal):", err.name);
          }
        });
    }
  }, [remoteStream]);

  const retryPlay = () => {
    remoteVideoRef.current
      ?.play()
      .then(() => setBlockedByAutoplay(false))
      .catch((err) => console.log("[remote video] retry play() failed:", err.name));
  };

  const toggleSpeaker = async () => {
    const el = remoteVideoRef.current;
    if (!el || typeof el.setSinkId !== "function") {
      toast(
        "Your phone's browser doesn't allow switching speaker/earpiece from a website — that's controlled by your phone's OS, not the app.",
        { icon: "🔈", duration: 4000 },
      );
      return;
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const outputs = devices.filter((d) => d.kind === "audiooutput");
      if (outputs.length < 2) {
        toast("No alternate audio output device found on this computer", { icon: "🔈" });
        return;
      }
      const next = usingAltOutput
        ? outputs.find((d) => d.deviceId === "default") || outputs[0]
        : outputs.find((d) => d.deviceId !== "default") || outputs[1];
      await el.setSinkId(next.deviceId);
      setUsingAltOutput((v) => !v);
      toast.success(`Audio output: ${next.label || "switched"}`);
    } catch (err) {
      toast.error("Couldn't switch audio output");
    }
  };

  useEffect(() => {
    if (!callStartedAt) {
      setElapsed(0);
      return;
    }
    const id = setInterval(
      () => setElapsed(Math.floor((Date.now() - callStartedAt) / 1000)),
      1000,
    );
    return () => clearInterval(id);
  }, [callStartedAt]);

  if (callState !== "calling" && callState !== "connected") return null;
  if (!remoteUser) return null;

  const isVideo = callType === "video";
  const hasRemoteVideoTrack = (remoteStream?.getVideoTracks().length || 0) > 0;
  const showAvatarOverlay =
    !isVideo || callState === "calling" || !remoteStream || !hasRemoteVideoTrack;

  return (
    <div className="fixed inset-0 z-[300] bg-slate-900 flex flex-col items-center justify-between text-white">
      <div className="relative w-full flex-1 flex items-center justify-center overflow-hidden">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className={
            isVideo && !showAvatarOverlay
              ? "w-full h-full object-cover bg-black"
              : "hidden"
          }
        />

        {showAvatarOverlay && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95">
            <img
              src={remoteUser.profile_picture}
              className="size-28 rounded-full object-cover border-4 border-white/20 shadow-xl"
              alt=""
            />
            <p className="mt-4 text-xl font-semibold">{remoteUser.full_name}</p>
            <p className="text-slate-400 mt-1">
              {callState === "calling" ? "Ringing…" : formatDuration(elapsed)}
            </p>
          </div>
        )}

        {isVideo && !showAvatarOverlay && (
          <p className="absolute top-4 left-1/2 -translate-x-1/2 text-sm bg-black/40 px-3 py-1 rounded-full">
            {formatDuration(elapsed)}
          </p>
        )}

        {blockedByAutoplay && !showAvatarOverlay && (
          <button
            onClick={retryPlay}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 text-white"
          >
            <div className="size-14 rounded-full bg-white/20 flex items-center justify-center">
              <Video className="size-6" />
            </div>
            <p className="text-sm font-medium">Tap to start video/audio</p>
          </button>
        )}

        {/* Local video picture-in-picture */}
        {isVideo && (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute bottom-24 right-4 w-28 h-40 object-cover rounded-xl border-2 border-white/30 shadow-lg bg-black"
          />
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6 pb-10">
        <button
          onClick={toggleMute}
          className={`size-14 rounded-full flex items-center justify-center transition ${
            muted ? "bg-white text-slate-900" : "bg-white/10 hover:bg-white/20"
          }`}
          title={muted ? "Unmute" : "Mute"}
        >
          {muted ? <MicOff className="size-6" /> : <Mic className="size-6" />}
        </button>

        <button
          onClick={toggleSpeaker}
          className={`size-14 rounded-full flex items-center justify-center transition ${
            usingAltOutput ? "bg-white text-slate-900" : "bg-white/10 hover:bg-white/20"
          }`}
          title="Audio output"
        >
          {usingAltOutput ? <Speaker className="size-6" /> : <Volume2 className="size-6" />}
        </button>

        <button
          onClick={endCall}
          className="size-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition active:scale-95"
          title="End call"
        >
          <Phone className="size-7" />
        </button>

        {isVideo && (
          <button
            onClick={toggleCamera}
            className={`size-14 rounded-full flex items-center justify-center transition ${
              cameraOff
                ? "bg-white text-slate-900"
                : "bg-white/10 hover:bg-white/20"
            }`}
            title={cameraOff ? "Turn camera on" : "Turn camera off"}
          >
            {cameraOff ? (
              <VideoOff className="size-6" />
            ) : (
              <Video className="size-6" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default ActiveCall;