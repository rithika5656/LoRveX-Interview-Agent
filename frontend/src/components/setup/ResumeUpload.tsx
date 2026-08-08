import type { ChangeEvent, DragEvent } from "react";

type ResumeUploadProps = {
  file: File | null;
  error?: string;
  onFileSelect: (file: File | null) => void;
};

const MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024;

export function validateResumeFile(file: File): string | null {
  if (file.type !== "application/pdf") {
    return "Please upload a PDF resume.";
  }

  if (file.size > MAX_RESUME_SIZE_BYTES) {
    return "Resume must be 5 MB or smaller.";
  }

  return null;
}

export function ResumeUpload({ file, error, onFileSelect }: ResumeUploadProps) {
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;
    onFileSelect(selectedFile);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files?.[0] ?? null;
    onFileSelect(droppedFile);
  };

  return (
    <section className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.38em] text-slate-500">Step 3</p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Resume upload</h2>
        <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
          Upload a PDF resume. It stays in frontend state for now and will be sent to the backend in a later phase.
        </p>
      </div>

      <div className="space-y-4">
        <label
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
          className="flex min-h-[17rem] cursor-pointer flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-slate-200 bg-white px-6 py-8 text-center transition hover:border-slate-300 hover:bg-slate-50"
        >
          <input type="file" accept="application/pdf" className="sr-only" onChange={handleInputChange} />
          <div className="max-w-md space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-2xl text-slate-700">
              ⬆
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-950">Upload your resume</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">Drag &amp; drop your PDF here or browse files.</p>
            </div>
            <p className="text-sm font-medium text-slate-500">PDF only • Max 5 MB</p>
          </div>
        </label>

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}

        {file ? (
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-slate-950">{file.name}</p>
                <p className="text-sm text-slate-600">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
                <p className="mt-2 text-sm font-medium text-emerald-700">✓ Ready for analysis</p>
              </div>
              <div className="flex gap-3">
                <label className="cursor-pointer rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-950">
                  Replace file
                  <input type="file" accept="application/pdf" className="sr-only" onChange={handleInputChange} />
                </label>
                <button
                  type="button"
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
                  onClick={() => onFileSelect(null)}
                >
                  Remove file
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
