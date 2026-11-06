/** Server workflow execution is disabled until its backing tables, RLS, and scheduler lease are deployed. */
export class AiError extends Error { constructor(message: string, public status: number) { super(message); } }
export const MODEL = "disabled";
export async function callAI(): Promise<never> { throw new AiError("AI workflows are not configured on this backend.", 503); }
export async function executeRun(): Promise<never> { throw new AiError("AI workflows are not configured on this backend.", 503); }
