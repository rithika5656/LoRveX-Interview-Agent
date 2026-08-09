import React from "react";

interface Props {
  videoRef: (el: HTMLVideoElement | null) => void;
  mediaState: {
    cameraEnabled: boolean;
    microphoneEnabled: boolean;
    cameraPermission: "unknown" | "granted" | "denied";
    microphonePermission: "unknown" | "granted" | "denied";
  };
  onToggleCamera: () => void;
  onToggleMicrophone: () => void;
  candidateName?: string;
}

export const CameraCard: React.FC<Props> = ({ videoRef, mediaState, onToggleCamera, onToggleMicrophone, candidateName }) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-700">{candidateName ?? "Candidate"}</p>
          <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
            <span className={`flex items-center gap-2 ${mediaState.cameraEnabled ? "text-emerald-600" : "text-rose-600"}`}>
              <span className="h-2 w-2 rounded-full" style={{ background: mediaState.cameraEnabled ? "#10b981" : "#ef4444" }} />
              {mediaState.cameraEnabled ? "Camera On" : "Camera Off"}
            </span>
            <span className={`flex items-center gap-2 ${mediaState.microphoneEnabled ? "text-emerald-600" : "text-rose-600"}`}>
              <span className="h-2 w-2 rounded-full" style={{ background: mediaState.microphoneEnabled ? "#10b981" : "#ef4444" }} />
              {mediaState.microphoneEnabled ? "Microphone On" : "Microphone Off"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button aria-label="Toggle camera" onClick={onToggleCamera} className="rounded-md bg-slate-100 px-3 py-2 text-sm">
            🎥
          </button>
          <button aria-label="Toggle microphone" onClick={onToggleMicrophone} className="rounded-md bg-slate-100 px-3 py-2 text-sm">
            🎤
          </button>
        </div>
      </div>

      <div className="mt-4 h-48 w-full overflow-hidden rounded-md bg-slate-100">
        {mediaState.cameraEnabled ? (
          <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-sm text-slate-500">Camera is off</div>
          </div>
        )}
      </div>
      <p className="mt-3 text-xs text-slate-500">Your camera is used for the live interview. Video is not uploaded.</p>
    </div>
  );
};

export default CameraCard;
