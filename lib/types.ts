export type JobStatus = "backlog" | "processing" | "completed" | "failed";
export type JobComplexity = "LOW" | "MEDIUM" | "HIGH";

export interface Job {
  id: string;
  policyName: string;
  fileName: string;
  source: string;
  version: string;
  status: JobStatus;
  complexity: JobComplexity;
  createdAt: string;
  currentUrl?: string;
  diffUrl?: string;
  hasPreviousVersion?: boolean;
  analysis?: AnalysisItem[] | null;
}

export interface AnalysisItem {
  issue_id?: string;
  issue?: string;
  core_issues?: string;
  analysis?: {
    issue_exist?: boolean;
    relevant_chunks?: unknown[];
    remedy_text?: string;
    summary?: string;
  };
}
