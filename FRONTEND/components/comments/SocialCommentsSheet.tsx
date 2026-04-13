import React from 'react';

type SocialCommentsSheetProps = {
  open: boolean;
  onClose: () => void;
  /** Shown in header: "Comments (N Comments)" */
  totalCount: number;
  /** e.g. post-only “Delete all” for owners */
  headerActions?: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

/**
 * MOxE social bottom sheet for comment lists.
 */
export function SocialCommentsSheet({
  open,
  onClose,
  totalCount,
  headerActions,
  loading,
  error,
  children,
  footer,
}: SocialCommentsSheetProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 flex items-end justify-center"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] bg-[#121212] rounded-t-3xl border-t border-[#262626] max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 flex items-center justify-between px-4 pt-[max(12px,env(safe-area-inset-top))] pb-3 border-b border-[#262626] gap-2">
          <h2 className="text-[17px] font-bold text-white min-w-0 flex-1 truncate">
            Comments ({totalCount} Comment{totalCount === 1 ? '' : 's'})
          </h2>
          <div className="flex items-center gap-2 shrink-0">
            {headerActions}
            <button
              type="button"
              onClick={onClose}
              className="text-[#8e8e8e] text-2xl leading-none px-2 py-1 -mr-2 rounded-lg hover:bg-white/10"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-4 min-h-0">
          {loading && <p className="text-[#8e8e8e] text-sm py-8 text-center">Loading comments…</p>}
          {error && !loading && <p className="text-red-400 text-sm py-4 text-center">{error}</p>}
          {!loading && !error ? children : null}
        </div>

        {footer}
      </div>
    </div>
  );
}

export function SocialCommentsEmpty({ message }: { message?: string }) {
  return <p className="text-[#8e8e8e] text-sm py-8 text-center">{message ?? 'No comments yet.'}</p>;
}
