import { useEffect, useRef, useState } from "react";

export interface MediaState {
  cameraEnabled: boolean;
  microphoneEnabled: boolean;
  cameraPermission: "unknown" | "granted" | "denied";
  microphonePermission: "unknown" | "granted" | "denied";
}

export function useInterviewMedia() {
  const [mediaState, setMediaState] = useState<MediaState>({
    cameraEnabled: false,
    microphoneEnabled: false,
    cameraPermission: "unknown",
    microphonePermission: "unknown",
  });

  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  async function enableMedia() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setMediaState({
        cameraEnabled: true,
        microphoneEnabled: true,
        cameraPermission: "granted",
        microphonePermission: "granted",
      });
    } catch (err) {
      // Permission denied or device unavailable
      const isDenied = (err as any)?.name === "NotAllowedError" || (err as any)?.message?.toLowerCase?.()?.includes("permission");
      setMediaState((s) => ({
        ...s,
        cameraPermission: isDenied ? "denied" : s.cameraPermission,
        microphonePermission: isDenied ? "denied" : s.microphonePermission,
      }));
    }
  }

  function attachVideoElement(el: HTMLVideoElement | null) {
    videoRef.current = el;
    if (el && streamRef.current) {
      el.srcObject = streamRef.current;
    }
  }

  function toggleCamera(enabled?: boolean) {
    const stream = streamRef.current;
    if (!stream) return;
    stream.getVideoTracks().forEach((t) => (t.enabled = enabled ?? !t.enabled));
    setMediaState((s) => ({ ...s, cameraEnabled: enabled ?? !s.cameraEnabled }));
  }

  function toggleMicrophone(enabled?: boolean) {
    const stream = streamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach((t) => (t.enabled = enabled ?? !t.enabled));
    setMediaState((s) => ({ ...s, microphoneEnabled: enabled ?? !s.microphoneEnabled }));
  }

  function stopMedia() {
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setMediaState({
      cameraEnabled: false,
      microphoneEnabled: false,
      cameraPermission: mediaState.cameraPermission,
      microphonePermission: mediaState.microphonePermission,
    });
    if (videoRef.current) {
      try {
        // detach
        (videoRef.current as HTMLVideoElement).srcObject = null;
      } catch (e) {}
    }
  }

  useEffect(() => {
    return () => {
      // cleanup on unmount
      stopMedia();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    mediaState,
    enableMedia,
    attachVideoElement,
    toggleCamera,
    toggleMicrophone,
    stopMedia,
  };
}
