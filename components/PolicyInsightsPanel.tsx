import type { FC } from "react";
import { Lightbulb } from "lucide-react";
import { PolicyInsightItem } from "./PolicyInsightItem";
import type { AnalysisItem } from "@/lib/types";

type PolicyInsightsPanelProps = {
  analysis?: AnalysisItem[] | null;
};

export const PolicyInsightsPanel: FC<PolicyInsightsPanelProps> = ({
  analysis,
}) => {
  const items = Array.isArray(analysis) ? analysis : [];
  const hasItems = items.length > 0;

  return (
    <aside className="flex h-full min-h-0 flex-col border-l border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
            <Lightbulb className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Policy Insights
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {hasItems
                ? `${items.length} issue${items.length === 1 ? "" : "s"} detected`
                : "No analysis yet"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {hasItems ? (
          <div className="space-y-3">
            {items.map((item, index) => (
              <PolicyInsightItem
                key={item.issue_id ?? index}
                index={index + 1}
                item={item}
              />
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Process a document to see policy analysis insights.
          </p>
        )}
      </div>
    </aside>
  );
};