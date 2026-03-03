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

// ---------- Normalizers ----------

function normalizeFileTreeNode(raw: any): FileTreeNode {
  if (!raw) {
    return { name: '', path: '', type: 'file' };
  }

  // If backend returns a plain string path, treat it as a file
  if (typeof raw === 'string') {
    const path = raw;
    const name = path.includes('/') ? path.split('/').pop()! : path;
    return { name, path, type: 'file' };
  }

  const path: string =
    raw.path ??
    raw.full_path ??
    raw.relative_path ??
    raw.file_path ??
    '';

  const name: string =
    raw.name ??
    raw.label ??
    (typeof path === 'string' && path.includes('/') ? path.split('/').pop()! : path) ??
    '';

  const childrenRaw: any[] =
    raw.children ??
    raw.items ??
    raw.nodes ??
    [];

  const hasChildren = Array.isArray(childrenRaw) && childrenRaw.length > 0;

  const isDirectory: boolean =
    raw.type === 'directory' ||
    raw.kind === 'directory' ||
    raw.kind === 'dir' ||
    raw.is_dir === true ||
    raw.isDirectory === true ||
    hasChildren;

  return {
    name,
    path,
    type: isDirectory ? 'directory' : 'file',
    children: Array.isArray(childrenRaw)
      ? childrenRaw.map((c) => normalizeFileTreeNode(c))
      : undefined,
  };
}

function buildTreeFromFlatList(rawTree: any[]): FileTreeNode[] {
  const root: FileTreeNode[] = [];

  const ensureDirNode = (level: FileTreeNode[], name: string, fullPath: string): FileTreeNode => {
    let node = level.find((n) => n.name === name && n.type === 'directory');
    if (!node) {
      node = { name, path: fullPath, type: 'directory', children: [] };
      level.push(node);
    }
    if (!node.children) node.children = [];
    return node;
  };

  for (const raw of rawTree) {
    const path: string =
      typeof raw === 'string'
        ? raw
        : raw.path ?? raw.full_path ?? raw.relative_path ?? raw.file_path ?? '';

    if (!path) continue;

    const segments = path.split('/').filter(Boolean);
    if (segments.length === 0) continue;

    let currentLevel = root;
    let currentPath = '';

    // All but last segment are directories
    for (let i = 0; i < segments.length - 1; i++) {
      const seg = segments[i];
      currentPath = currentPath ? `${currentPath}/${seg}` : seg;
      const dirNode = ensureDirNode(currentLevel, seg, currentPath);
      currentLevel = dirNode.children!;
    }

    const fileName = segments[segments.length - 1];
    const filePath = path;
    if (!currentLevel.find((n) => n.name === fileName && n.type === 'file')) {
      currentLevel.push({ name: fileName, path: filePath, type: 'file' });
    }
  }

  return root;
}

function normalizeFileTree(rawTree: any): FileTreeNode[] {
  if (!rawTree) return [];
  if (Array.isArray(rawTree)) {
    // If any node already has children, assume hierarchical structure
    const hasNested =
      rawTree.some(
        (n) =>
          n &&
          (Array.isArray((n as any).children) ||
            Array.isArray((n as any).items) ||
            Array.isArray((n as any).nodes)),
      );
    if (hasNested) {
      return rawTree.map((n) => normalizeFileTreeNode(n));
    }
    // Otherwise treat as flat list of file paths and build hierarchy
    return buildTreeFromFlatList(rawTree);
  }
  // Some backends may wrap the tree in an object { root: {...} } or similar
  if (rawTree.root) {
    const rootNode = normalizeFileTreeNode(rawTree.root);
    return [rootNode];
  }
  // Fallback: treat the object itself as a single node
  return [normalizeFileTreeNode(rawTree)];
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
  // Backend may return functions under `functions` or `data`
  return json.data ?? json.functions ?? [];
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
  // Backend may return the session directly or under `data`
  const container = json.data ?? json;
  const fileTree = normalizeFileTree(container.file_tree);
  return {
    ...container,
    file_tree: fileTree,
  } as EditorSession;
}

export async function getEditorFileTree(sessionId: string): Promise<FileTreeNode[]> {
  const res = await fetch(`${BASE}/editor/file-tree?session_id=${sessionId}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch file tree');
  // Some backends wrap file_tree under `data`
  const container = json.data ?? json;
  return normalizeFileTree(container.file_tree);
}

export async function readEditorFile(sessionId: string, filePath: string): Promise<string> {
  const res = await fetch(`${BASE}/editor/file?session_id=${sessionId}&file_path=${encodeURIComponent(filePath)}`);
  const json = await res.json();
  const container = json.data ?? json;
  return container.content ?? '';
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
