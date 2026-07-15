import React from "react";
import { useCall } from "../context/CallContext.jsx";
import { Phone, Video } from "lucide-react";

const IncomingCallModal = () => {
  const { callState, remoteUser, callType, acceptCall, declineCall } = useCall();

  if (callState !== "ringing" || !remoteUser) return null;

  return (
    <div className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center">
        <img
          src={remoteUser.profile_picture}
          className="size-24 rounded-full object-cover mx-auto border-4 border-indigo-100 shadow animate-pulse"
          alt=""
        />
        <p className="mt-4 text-xl font-semibold text-slate-900">
          {remoteUser.full_name}
        </p>
        <p className="text-slate-500 mt-1 flex items-center justify-center gap-1.5">
          {callType === "video" ? (
            <Video className="size-4" />
          ) : (
            <Phone className="size-4" />
          )}
          Incoming {callType} call…
        </p>

        <div className="flex justify-center gap-6 mt-8">
          <button
            onClick={() => declineCall("declined")}
            className="size-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition active:scale-95"
            title="Decline"
          >
            <Phone className="size-6" />
          </button>
          <button
            onClick={acceptCall}
            className="size-14 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition active:scale-95"
            title="Accept"
          >
            <Phone className="size-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;