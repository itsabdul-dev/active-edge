export function SuccessMark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`ae-success-mark ${className}`}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="ae-success-ring"
        cx="32"
        cy="32"
        r="28"
        stroke="currentColor"
        strokeWidth="2"
        pathLength="100"
      />
      <path
        className="ae-success-tick"
        d="m19 32 9 9 17-19"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength="100"
      />
    </svg>
  );
}
