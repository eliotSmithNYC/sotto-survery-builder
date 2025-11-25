"use client";

interface ValidationBannerProps {
  message: string;
  onDismiss?: () => void;
}

export default function ValidationBanner({
  message,
  onDismiss,
}: ValidationBannerProps) {
  return (
    <div
      className="px-4 py-2 bg-red-50 border-b border-red-200"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-red-800">{message}</p>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-4 text-red-600 hover:text-red-800"
            aria-label="Dismiss"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
