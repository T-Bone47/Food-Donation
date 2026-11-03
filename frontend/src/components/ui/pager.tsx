"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Offset paging for endpoints that return a page but no total: "Next" is offered only when the page came back full. */
export function Pager({
  label,
  page,
  pageSize,
  count,
  loading,
  onPage,
}: {
  label: string;
  page: number;
  pageSize: number;
  count: number;
  loading?: boolean;
  onPage: (page: number) => void;
}) {
  const from = page * pageSize + 1;
  return (
    <nav aria-label={label} className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-ink-soft" aria-live="polite">
        {count === 0 ? "No results on this page" : `Showing ${from}–${from + count - 1}`}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" disabled={page === 0 || loading} onClick={() => onPage(page - 1)}>
          <ChevronLeft aria-hidden />
          Previous
        </Button>
        <Button variant="outline" disabled={count < pageSize || loading} onClick={() => onPage(page + 1)}>
          Next
          <ChevronRight aria-hidden />
        </Button>
      </div>
    </nav>
  );
}
