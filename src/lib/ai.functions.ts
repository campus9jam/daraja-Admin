/** AI workflow actions are intentionally unavailable until the workflow schema and RLS policies are deployed. */
export async function runAiWorkflow(): Promise<never> { throw new Error("AI workflows are not configured on this backend."); }
export async function retryWorkflowRun(): Promise<never> { throw new Error("AI workflows are not configured on this backend."); }
export async function diagnoseWorkflowFailure(): Promise<never> { throw new Error("AI workflows are not configured on this backend."); }
export async function updateWorkflowTriggers(): Promise<never> { throw new Error("AI workflows are not configured on this backend."); }
export async function getSchedulerStatus(): Promise<never> { throw new Error("AI workflows are not configured on this backend."); }
export async function resumeScheduler(): Promise<never> { throw new Error("AI workflows are not configured on this backend."); }
export const WORKFLOW_EVENTS = [] as const;
