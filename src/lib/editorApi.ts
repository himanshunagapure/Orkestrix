import { API_BASE_URL, API_CONTEXT_PATH } from './api';

const BASE = `${API_BASE_URL}/${API_CONTEXT_PATH}/aiqod-agent/agent`;

// ---------- Types ----------

export interface ScreenState {
  screen_id: string;
  project_id: string;
  screen_name?: string;
  ir_schema?: object;
  [key: string]: unknown;
}

export interface ScreenFunction {
  function_id: string;
  type: string;
  description?: string;
  source_code: string;
  models_source?: string;
  input_model_name?: string;
  response_model_name?: string;
  input_model?: object;
  response_model?: object;
  metadata?: object;
  created_at?: string;
  updated_at?: string;
}

export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeNode[];
}

export interface EditorSession {
  session_id: string;
  root_path: string;
  file_tree: FileTreeNode[];
  selector?: string;
}

// ---------- Screen state & functions ----------

export async function getScreenState(projectId: string, screenId: string): Promise<ScreenState> {
  const res = await fetch(`${BASE}/screen-state/${projectId}/${screenId}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch screen state');
  return json.data;
}

export async function getScreenFunctions(projectId: string, screenId: string): Promise<ScreenFunction[]> {
  const res = await fetch(`${BASE}/screen-functions/${projectId}/${screenId}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch screen functions');
  return json.data ?? [];
}

// ---------- Editor session (Angular files) ----------

export async function initEditor(screenId: string): Promise<EditorSession> {
  const res = await fetch(`${BASE}/editor/init`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ screen_id: screenId }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to init editor');
  return json;
}

export async function getEditorFileTree(sessionId: string): Promise<FileTreeNode[]> {
  const res = await fetch(`${BASE}/editor/file-tree?session_id=${sessionId}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch file tree');
  return json.file_tree ?? [];
}

export async function readEditorFile(sessionId: string, filePath: string): Promise<string> {
  const res = await fetch(`${BASE}/editor/file?session_id=${sessionId}&file_path=${encodeURIComponent(filePath)}`);
  const json = await res.json();
  return json.content ?? '';
}

export async function writeEditorFile(sessionId: string, filePath: string, content: string): Promise<void> {
  const res = await fetch(`${BASE}/editor/file`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, file_path: filePath, content }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to save file');
}

// ---------- Backend function update ----------

export async function updateBackendFunction(
  projectId: string,
  functionId: string,
  sourceCode: string,
  modelsSource?: string,
): Promise<void> {
  const body: Record<string, string> = { project_id: projectId, function_id: functionId, source_code: sourceCode };
  if (modelsSource) body.models_source = modelsSource;
  const res = await fetch(`${BASE}/admin/update-function`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to update function');
}
