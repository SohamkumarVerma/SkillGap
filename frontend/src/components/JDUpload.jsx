import { useRef, useState } from "react";

const ACCEPTED = ".pdf,.txt";

export default function JDUpload({ onResult, onClear }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState(null);

  async function submit(file) {
    if (!file) return;

    const ext = file.name.split(".").pop().toLowerCase();
    if (!["pdf", "txt"].includes(ext)) {
      setError("Only .pdf and .txt files are supported.");
      return;
    }

    setError(null);
    setFileName(file.name);
    setLoading(true);

    const form = new FormData();
    form.append("jd", file);

    try {
      const res = await fetch("/api/upload-jd", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      onResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // drag-and-drop handlers
  function onDragOver(e) { e.preventDefault(); setDragging(true); }
  function onDragLeave()  { setDragging(false); }
  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    submit(e.dataTransfer.files[0]);
  }

  function clearFile(e) {
    e.stopPropagation();
    inputRef.current.value = "";
    setFileName(null);
    setError(null);
    onClear?.();
  }

  return (
    <div className="upload-area w-full max-w-xl mx-auto">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={(e) => submit(e.target.files[0])}
      />

      {fileName ? (
        <div className="file-preview-card" aria-label={`Selected file: ${fileName}`}>
          <div className="file-preview-icon" aria-hidden>FILE</div>
          <div className="file-preview-details">
            <span className="file-preview-label">Selected job description</span>
            <span className="file-preview-name" title={fileName}>{fileName}</span>
            <span className="file-preview-status">
              {loading ? "Analysing file..." : "Ready to analyse"}
            </span>
          </div>
          {!loading && (
            <button
              type="button"
              onClick={clearFile}
              className="file-clear"
              aria-label="Remove selected file"
            >
              ×
            </button>
          )}
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload job description — click or drag a PDF or TXT file here"
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          className={["upload-dropzone border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors", dragging ? "is-dragging" : ""].join(" ")}
        >
          <div className="upload-icon text-4xl mb-3" aria-hidden>↑</div>
          <p className="text-gray-800 font-semibold">Drop a job description here</p>
          <p className="text-gray-500 text-sm mt-1">Drop a PDF or TXT file, or click to browse</p>
        </div>
      )}

      {error && (
        <div role="alert"
             className="mt-3 bg-red-950 border border-red-800 rounded-xl
                        px-4 py-3 text-red-300 text-sm flex items-start gap-2">
          <span className="shrink-0">✗</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
