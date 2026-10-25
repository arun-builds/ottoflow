// ---------------------------------------------------------------------------
// Centralized API client for Ottoflow
// ---------------------------------------------------------------------------

export const API_BASE = 'http://localhost:8080';
const WORKSPACE_ID = '00000000-0000-0000-0000-000000000001';

// ---- types ----------------------------------------------------------------

export interface Workflow {
  id: string;
  workspace_id: string;
  name: string;
  status: string;
  nodes?: FlowNode[];
  edges?: FlowEdge[];
  created_at: string;
  updated_at: string;
}

export interface FlowNode {
  id: string;
  type: string;
  data: Record<string, unknown>;
  position: { x: number; y: number };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface Execution {
  id: string;
  workspace_id: string;
  workflow_id: string;
  status: string;
  started_at: string;
  finished_at: string | null;
}

export interface NodeExecution {
  id: string;
  execution_id: string;
  node_id: string;
  node_type: string;
  status: string;
  input_data: unknown;
  output_data: unknown;
  error_message: string;
  executed_at: string;
}

// ---- helpers --------------------------------------------------------------

const headers = (): HeadersInit => ({
  'Content-Type': 'application/json',
  'X-Workspace-ID': WORKSPACE_ID,
});

// ---- workflows ------------------------------------------------------------

export async function listWorkflows(): Promise<Workflow[]> {
  const res = await fetch(`${API_BASE}/api/workflows`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to list workflows');
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function getWorkflow(id: string): Promise<Workflow> {
  const res = await fetch(`${API_BASE}/api/workflows/${id}`, { headers: headers() });
  if (!res.ok) throw new Error('Workflow not found');
  return res.json();
}

export async function createWorkflow(
  payload: Pick<Workflow, 'name'> & { nodes: FlowNode[]; edges: FlowEdge[] }
): Promise<Workflow> {
  const res = await fetch(`${API_BASE}/api/workflows`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ ...payload, workspace_id: WORKSPACE_ID }),
  });
  if (!res.ok) throw new Error('Failed to create workflow');
  return res.json();
}

export async function updateWorkflow(
  id: string,
  payload: Pick<Workflow, 'name'> & { nodes: FlowNode[]; edges: FlowEdge[] }
): Promise<Workflow> {
  const res = await fetch(`${API_BASE}/api/workflows/${id}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify({ ...payload, workspace_id: WORKSPACE_ID }),
  });
  if (!res.ok) throw new Error('Failed to update workflow');
  return res.json();
}

export async function deleteWorkflow(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/workflows/${id}`, {
    method: 'DELETE',
    headers: headers(),
  });
  if (!res.ok) throw new Error('Failed to delete workflow');
}

// ---- executions -----------------------------------------------------------

export async function listExecutions(workflowId: string): Promise<Execution[]> {
  const res = await fetch(`${API_BASE}/api/workflows/${workflowId}/executions`, {
    headers: headers(),
  });
  if (!res.ok) throw new Error('Failed to list executions');
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function getNodeExecutions(executionId: string): Promise<NodeExecution[]> {
  const res = await fetch(`${API_BASE}/api/executions/${executionId}/nodes`, {
    headers: headers(),
  });
  if (!res.ok) throw new Error('Failed to fetch node executions');
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}
