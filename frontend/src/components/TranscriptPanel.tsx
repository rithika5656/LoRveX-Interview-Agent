import React from "react";

interface Props {
  transcript: string;
  listening: boolean;
  onChange: (value: string) => void;
}

export const TranscriptPanel: React.FC<Props> = ({ transcript, listening, onChange }) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-700">Your answer</span>
          {listening ? <span className="ml-2 inline-flex items-center rounded-full bg-rose-100 px-2 py-1 text-xs font-medium text-rose-700">🎙 Listening</span> : null}
        </div>
        <div className="text-xs text-slate-500">{transcript.trim().split(/\s+/).filter(Boolean).length} words</div>
      </div>

      <textarea
        aria-label="Transcript"
        value={transcript}
        onChange={(e) => onChange(e.target.value)}
        className="mt-3 min-h-[140px] w-full resize-y rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none"
      />
      <p className="mt-2 text-xs text-slate-500">Edit the transcript before submitting. Transcript will be used for AI evaluation.</p>
    </div>
  );
};

export default TranscriptPanel;
