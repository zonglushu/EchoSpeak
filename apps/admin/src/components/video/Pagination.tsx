/**
 * 通用分页组件
 */

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / pageSize);

  if (totalItems <= pageSize) {
    return null;
  }

  return (
    <div className="mt-6 flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        上一页
      </button>

      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={`min-w-[36px] px-3 py-1.5 text-sm rounded-lg transition-colors ${
              currentPage === page
                ? 'bg-primary text-white'
                : 'border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {page}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        下一页
      </button>
    </div>
  );
}
