type ResultCallback = (transcript: string, isFinal: boolean) => void;

const getSpeechRecognitionCtor = () => {
  // @ts-ignore
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
};

export class SpeechRecognitionService {
  private recognition: any | null = null;
  private onResultCb: ResultCallback | null = null;

  constructor() {
    const Ctor = getSpeechRecognitionCtor();
    if (Ctor) {
      this.recognition = new Ctor();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = navigator.language || "en-US";

      this.recognition.onresult = (event: any) => {
        let interim = "";
        let final = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            final += res[0].transcript;
          } else {
            interim += res[0].transcript;
          }
        }
        const combined = (final + " " + interim).trim();
        this.onResultCb?.(combined, Boolean(final));
      };

      this.recognition.onerror = (ev: any) => {
        console.warn("SpeechRecognition error", ev);
      };
    }
  }

  static isSupported() {
    return Boolean(getSpeechRecognitionCtor());
  }

  start(onResult: ResultCallback) {
    if (!this.recognition) return Promise.reject(new Error("SpeechRecognition not supported"));
    this.onResultCb = onResult;
    try {
      this.recognition.start();
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  }

  stop() {
    if (!this.recognition) return;
    try {
      this.recognition.stop();
    } catch (e) {}
  }

  abort() {
    if (!this.recognition) return;
    try {
      this.recognition.abort();
    } catch (e) {}
  }
}
