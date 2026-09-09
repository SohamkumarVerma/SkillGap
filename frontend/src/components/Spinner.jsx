/**
 * Spinner — accessible loading indicator used during async operations.
 */
export default function Spinner({ size = 32 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="text-indigo-500 animate-spin"
      aria-label="Loading"
      role="status"
    >
      <circle cx="12" cy="12" r="10" className="opacity-20" />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}
