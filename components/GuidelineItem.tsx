import { ChevronRight } from "lucide-react";
import type { FC } from "react";

export interface Guideline {
  id: number;
  name: string;
  type: string;
}

interface GuidelineItemProps {
  index: number;
  guideline: Guideline;
}

export const GuidelineItem: FC<GuidelineItemProps> = ({ index, guideline }) => {
  return (
    <button
      type="button"
      className="group flex w-full cursor-pointer items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-blue-500 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">
          {index}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-zinc-900">
            {guideline.name}
          </p>
          <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700">
            {guideline.type}
          </span>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-zinc-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600" />
    </button>
  );
};

