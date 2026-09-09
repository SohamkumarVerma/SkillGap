import { useRef, useState } from "react";

const ACCEPTED = ".pdf,.txt";

export default function JDUpload({ onResult }) {
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

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload job description — click or drag a PDF or TXT file here"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        className={[
          "border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors",
          dragging
            ? "border-indigo-400 bg-indigo-950"
            : "border-gray-600 hover:border-indigo-500 hover:bg-gray-800/50",
        ].join(" ")}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          className="hidden"
          onChange={(e) => submit(e.target.files[0])}
        />

        <div className="text-4xl mb-3" aria-hidden>📄</div>

        {loading ? (
          <p className="text-indigo-300 animate-pulse">Analysing job description…</p>
        ) : fileName ? (
          <p className="text-gray-300 text-sm">
            <span className="font-mono text-indigo-300">{fileName}</span>
            <br />
            <span className="text-gray-500 text-xs">Click or drop to replace</span>
          </p>
        ) : (
          <>
            <p className="text-gray-300 font-medium">
              Drop a job description here
            </p>
            <p className="text-gray-500 text-sm mt-1">
              or click to browse — .pdf or .txt
            </p>
          </>
        )}
      </div>

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
