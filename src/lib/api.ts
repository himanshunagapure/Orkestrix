// API configuration - uses environment variable for base URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5010';
export const API_CONTEXT_PATH = import.meta.env.VITE_API_CONTEXT_PATH || 'dev';

// Liberty FS base URL for previewing generated Angular app
export const LIBERTY_FS_BASE_URL = (import.meta.env.VITE_LIBERTY_FS_BASE_URL || 'http://localhost:843/').replace(/\/?$/, '/');

/** Format project_id or screen_id for API requests: <id>-sb-<subscriber_id> */
export function formatIdForApi(id: string, subscriberId: string): string {
  return `${id}-sb-${subscriberId}`;
}

/** Use for update requests: if id already contains '-sb-', return as-is; otherwise format. */
export function idForUpdateRequest(id: string, subscriberId: string): string {
  return id.includes('-sb-') ? id : formatIdForApi(id, subscriberId);
}

/** Build the preview URL for a completed screen. */
export function getPreviewUrl(screenId: string, version: string): string {
  return `${LIBERTY_FS_BASE_URL}${screenId}-v${version}/`;
}

function extractPreviewSegment(previewUrl: string): string | null {
  const clean = previewUrl.trim().split('#')[0].split('?')[0];
  const segment = clean.split('/').filter(Boolean).pop();
  return segment && segment !== 'dev' ? segment : null;
}

/**
 * Normalize backend preview URLs to the Liberty FS host used by the frontend.
 * The backend may return URLs like http://localhost:8000/dev/<screen>-v<version>,
 * while the actual preview is served from LIBERTY_FS_BASE_URL.
 */
export function resolvePreviewUrl(
  previewUrl?: string | null,
  screenId?: string,
  version?: string,
): string {
  const expectedSegment =
    screenId && version && screenId.trim() !== '' && version.trim() !== ''
      ? `${screenId}-v${version}`
      : null;

  const segment = expectedSegment ?? (previewUrl ? extractPreviewSegment(previewUrl) : null);
  if (segment && /-v[\w.-]+$/.test(segment)) {
    return `${LIBERTY_FS_BASE_URL}${segment}/`;
  }

  if (screenId && version && screenId.trim() !== '' && version.trim() !== '') {
    return getPreviewUrl(screenId, version);
  }

  return previewUrl?.trim() ?? '';
}

// API endpoints
export const API_ENDPOINTS = {
  generateAngularApp: `${API_BASE_URL}/${API_CONTEXT_PATH}/aiqod-agent/agent/generate-angular-app`,
  updateAngularScreen: `${API_BASE_URL}/${API_CONTEXT_PATH}/aiqod-agent/agent/update-angular-screen`,
  stream: (jobId: string) => `${API_BASE_URL}/${API_CONTEXT_PATH}/aiqod-agent/agent/stream/${jobId}`,
  saveScreen: `${API_BASE_URL}/${API_CONTEXT_PATH}/aiqod-agent/agent/save-screen`,
  updateScreenMetadata: `${API_BASE_URL}/${API_CONTEXT_PATH}/aiqod-agent/agent/update-screen-metadata`,
  uiList: `${API_BASE_URL}/${API_CONTEXT_PATH}/aiqod-agent/agent/ui-list`,
  uiScreen: (screenId: string, projectId?: string) =>
    `${API_BASE_URL}/${API_CONTEXT_PATH}/aiqod-agent/agent/ui-screen/${screenId}${projectId ? `?project_id=${projectId}` : ''}`,
  credits: (subscriberId: string, orgId?: string, userId?: string) => {
    const params = new URLSearchParams({ subscriberId });
    if (orgId) params.set('orgId', orgId);
    if (userId) params.set('userId', userId);
    return `${API_BASE_URL}/${API_CONTEXT_PATH}/aiqod-agent/agent/credits?${params.toString()}`;
  },
  health: `${API_BASE_URL}/${API_CONTEXT_PATH}/aiqod-agent/agent/health`,
  screenVersions: (projectId: string, screenId: string) =>
    `${API_BASE_URL}/${API_CONTEXT_PATH}/aiqod-agent/agent/screen-versions?project_id=${encodeURIComponent(projectId)}&screen_id=${encodeURIComponent(screenId)}`,
  rollbackScreen: `${API_BASE_URL}/${API_CONTEXT_PATH}/aiqod-agent/agent/rollback-screen`,
  projectCredentials: (projectId: string) =>
    `${API_BASE_URL}/${API_CONTEXT_PATH}/aiqod-agent/agent/projects/${encodeURIComponent(projectId)}/credentials`,
  projectCredentialByName: (projectId: string, name: string) =>
    `${API_BASE_URL}/${API_CONTEXT_PATH}/aiqod-agent/agent/projects/${encodeURIComponent(projectId)}/credentials/${encodeURIComponent(name)}`,
} as const;

// Request types — matches /generate-angular-app: prompt, project_id, screen_id, subscriber_id, user_id required; rest optional
export interface GenerateAppRequest {
  prompt: string;
  project_id: string;
  screen_id: string;
  subscriber_id: string;
  user_id: string;
  screen_name?: string;
  org_id?: string;
  figma_link?: string;
  figma_token?: string;
}

export interface UpdateScreenRequest {
  prompt: string;
  project_id: string;
  screen_id: string;
  subscriber_id: string;
  user_id: string;
}

export interface SaveScreenRequest {
  screen_id: string;
  project_id: string;
}

/** Structured credits error details returned by the backend (HTTP 402) or detected from error messages. */
export interface CreditsErrorInfo {
  required?: number;
  available?: number;
}

/** Detect whether an error message indicates a credits-exhausted/insufficient-credits condition. */
export function isCreditsErrorMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('credit') ||
    lower.includes('exhausted') ||
    lower.includes('insufficient') ||
    lower.includes('not enough')
  );
}

export interface ParsedErrorResponse {
  error: string;
  required_credits?: number;
  available_credits?: number;
  code?: string;
}

/**
 * Normalize the various error body shapes the backend may return:
 *  - Direct:   { success: false, error: "...", required_credits, available_credits }
 *  - FastAPI:  { detail: "..." }
 *  - FastAPI:  { detail: { error: "...", required_credits, available_credits } }
 * When the body is completely unreadable, falls back to `fallbackMessage`.
 */
export function parseErrorResponse(
  data: unknown,
  fallbackMessage = 'Request failed',
): ParsedErrorResponse {
  if (!data || typeof data !== 'object') return { error: fallbackMessage };

  const d = data as Record<string, unknown>;

  // Direct format
  if (typeof d.error === 'string') {
    return {
      error: d.error,
      required_credits: typeof d.required_credits === 'number' ? d.required_credits : undefined,
      available_credits: typeof d.available_credits === 'number' ? d.available_credits : undefined,
      code: typeof d.code === 'string' ? d.code : undefined,
    };
  }

  // FastAPI detail as a plain string
  if (typeof d.detail === 'string') {
    return { error: d.detail || fallbackMessage };
  }

  // FastAPI detail as an object  (HTTPException raised with a dict payload)
  if (d.detail && typeof d.detail === 'object') {
    const detail = d.detail as Record<string, unknown>;
    if (typeof detail.error === 'string') {
      return {
        error: detail.error,
        required_credits: typeof detail.required_credits === 'number' ? detail.required_credits : undefined,
        available_credits: typeof detail.available_credits === 'number' ? detail.available_credits : undefined,
        code: typeof detail.code === 'string' ? detail.code : undefined,
      };
    }
  }

  return { error: fallbackMessage };
}

// Chat message type for the evolution mode
export interface ChatMessage {
  id: string;
  role: 'user' | 'system';
  content: string;
  status?: 'pending' | 'streaming' | 'applied' | 'failed';
  logs?: SSEEvent[];
  creditsError?: CreditsErrorInfo;
}

// Response types
export interface GenerateAppSuccessResponse {
  success: true;
  job_id: string;
}

export interface GenerateAppErrorResponse {
  success: false;
  error: string;
  code?: string;
  required_credits?: number;
  available_credits?: number;
  estimate?: {
    min_credits?: number;
    max_credits?: number;
  };
}

export type GenerateAppResponse = GenerateAppSuccessResponse | GenerateAppErrorResponse;

// SSE Event types
export interface LogEvent { type: 'log'; message: string; details?: unknown; }
export interface RetryEvent { type: 'retry'; message: string; details?: unknown; }
export interface WarningEvent { type: 'warning'; message: string; details?: unknown; }
export interface ErrorEvent { type: 'error'; message: string; }

export interface CompletePayload {
  success: true;
  project_id: string;
  screen_id: string;
  ir_schema: object;
  version: string;
  public_url: string;
  file_count: number;
  recovery_attempts: unknown[];
}

/** Update-job complete payload: public_url and version live under `angular`. */
export interface UpdateCompletePayload {
  success: true;
  screen_id: string;
  project_id: string;
  updated_ir_schema?: object;
  ir_schema?: object;
  angular?: {
    public_url: string;
    version: string;
    changed_files?: unknown[];
  };
  public_url?: string;
  version?: string;
  file_count?: number;
  recovery_attempts?: unknown[];
}

/** Normalize update-job payload to CompletePayload (use angular.public_url / angular.version when present). */
export function normalizeToCompletePayload(
  p: UpdateCompletePayload | CompletePayload
): CompletePayload {
  const angular = 'angular' in p ? p.angular : undefined;
  const version = angular?.version ?? p.version ?? '';
  return {
    success: true,
    project_id: p.project_id,
    screen_id: p.screen_id,
    ir_schema: ('updated_ir_schema' in p ? p.updated_ir_schema : undefined) ?? p.ir_schema ?? {},
    version,
    public_url: resolvePreviewUrl(angular?.public_url ?? p.public_url ?? '', p.screen_id, version),
    file_count: Array.isArray(angular?.changed_files) ? angular.changed_files.length : (p.file_count ?? 0),
    recovery_attempts: p.recovery_attempts ?? [],
  };
}



export interface CompleteEvent { type: 'complete'; payload: CompletePayload; }
export type SSEEvent = LogEvent | RetryEvent | WarningEvent | ErrorEvent | CompleteEvent;

export type JobStatus = 'idle' | 'submitting' | 'streaming' | 'complete' | 'error';

export interface JobState {
  status: JobStatus;
  jobId: string | null;
  prompt: string;
  logs: SSEEvent[];
  result: CompletePayload | null;
  error: string | null;
  creditsError: CreditsErrorInfo | null;
}

// --- Data fetching helpers ---

export interface UIListItem {
  _id: string;
  project_id: string;
  screen_id: string;
  screen_name?: string;
}

export interface UIScreenData {
  _id: string;
  project_id: string;
  screen_id: string;
  screen_name?: string;
  public_url?: string;
  version?: string;
  angular?: {
    public_url?: string;
    version?: string;
  };
  ir_schema?: object;
  current_version?: string;
  latest_version?: string;
  [key: string]: unknown;
}

export function getScreenVersion(data: UIScreenData): string {
  return (data.version as string) ?? (data.angular?.version as string) ?? '';
}

export function getScreenPublicUrl(data: UIScreenData): string {
  return resolvePreviewUrl(
    (data.angular?.public_url as string | undefined) ?? (data.public_url as string | undefined) ?? '',
    data.screen_id,
    getScreenVersion(data),
  );
}

export interface CreditsData {
  credits: {
    balance: number;
    reserved: number;
    total_purchased: number;
    total_consumed: number;
  };
  available_credits: number;
  limits?: unknown;
  subscription?: unknown;
  updatedAt?: string;
}

export async function fetchUIList(): Promise<UIListItem[]> {
  const res = await fetch(API_ENDPOINTS.uiList);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch apps');
  return json.data ?? [];
}

export async function fetchUIScreen(screenId: string, projectId?: string): Promise<UIScreenData> {
  const res = await fetch(API_ENDPOINTS.uiScreen(screenId, projectId));
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Screen not found');
  return json.data;
}

/** Save screen: set status from draft to active. */
export async function saveScreen(payload: SaveScreenRequest): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(API_ENDPOINTS.saveScreen, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) return { success: false, error: json.error || 'Failed to save screen' };
  return json.success ? { success: true } : { success: false, error: json.error || 'Save failed' };
}

/**
 * POST /aiqod-agent/agent/update-screen-metadata
 * Required: project_id, screen_id. At least one metadata field must be sent (validated client + server).
 * Optional: version (snapshot id; else server uses current_version / latest non-deleted row).
 * Extra keys are forbidden on the server — only these fields are serialized.
 */
export interface UpdateScreenMetadataRequest {
  project_id: string;
  screen_id: string;
  version?: string;
  screen_name?: string;
  description?: string;
  tags?: string[];
  screen_type?: string;
  permissions?: unknown;
  theme_preferences?: Record<string, unknown>;
}

export interface UpdateScreenMetadataSuccess {
  success: true;
  project_id: string;
  screen_id: string;
  version: string;
  updated_fields: string[];
  metadata: unknown;
}

export type UpdateScreenMetadataResult =
  | UpdateScreenMetadataSuccess
  | { success: false; error: string };

const UPDATE_SCREEN_METADATA_KEYS = [
  'screen_name',
  'description',
  'tags',
  'screen_type',
  'permissions',
  'theme_preferences',
] as const;

function buildUpdateScreenMetadataBody(
  payload: UpdateScreenMetadataRequest,
): Record<string, unknown> | null {
  const body: Record<string, unknown> = {
    project_id: payload.project_id,
    screen_id: payload.screen_id,
  };
  if (payload.version !== undefined && payload.version !== '') {
    body.version = payload.version;
  }
  if (payload.screen_name !== undefined) body.screen_name = payload.screen_name;
  if (payload.description !== undefined) body.description = payload.description;
  if (payload.tags !== undefined) body.tags = payload.tags;
  if (payload.screen_type !== undefined) body.screen_type = payload.screen_type;
  if (payload.permissions !== undefined) body.permissions = payload.permissions;
  if (payload.theme_preferences !== undefined) body.theme_preferences = payload.theme_preferences;

  const hasField = UPDATE_SCREEN_METADATA_KEYS.some((k) => body[k] !== undefined);
  if (!hasField) return null;
  return body;
}

/** Whitelisted metadata updates only (no IR / Angular / backend). */
export async function updateScreenMetadata(
  payload: UpdateScreenMetadataRequest,
): Promise<UpdateScreenMetadataResult> {
  const body = buildUpdateScreenMetadataBody(payload);
  if (!body) {
    return {
      success: false,
      error:
        'At least one of screen_name, description, tags, screen_type, permissions, theme_preferences is required',
    };
  }

  const res = await fetch(API_ENDPOINTS.updateScreenMetadata, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  let json: Record<string, unknown> = {};
  try {
    json = await res.json();
  } catch {
    /* non-JSON body */
  }

  if (!res.ok) {
    return { success: false, error: (json.error as string) || `Update failed (${res.status})` };
  }
  if (json.success === false) {
    return { success: false, error: (json.error as string) || 'Update failed' };
  }

  return {
    success: true,
    project_id: String(json.project_id ?? payload.project_id),
    screen_id: String(json.screen_id ?? payload.screen_id),
    version: String(json.version ?? ''),
    updated_fields: Array.isArray(json.updated_fields) ? (json.updated_fields as string[]) : [],
    metadata: json.metadata,
  };
}

/** Rename helper: sends only screen_name (My Apps). */
export async function updateScreenDisplayName(payload: {
  project_id: string;
  screen_id: string;
  screen_name: string;
}): Promise<UpdateScreenMetadataResult> {
  return updateScreenMetadata({
    project_id: payload.project_id,
    screen_id: payload.screen_id,
    screen_name: payload.screen_name,
  });
}

/** Build a minimal CompletePayload from UIScreenData for edit mode (preview + chat updates). */
export function screenDataToCompletePayload(data: UIScreenData): CompletePayload {
  const version = getScreenVersion(data);
  return {
    success: true,
    project_id: data.project_id,
    screen_id: data.screen_id,
    ir_schema: (data.ir_schema as object) ?? {},
    version,
    public_url: getScreenPublicUrl(data),
    file_count: 0,
    recovery_attempts: [],
  };
}

// --- Screen versions & rollback (Phase 5) ---

export interface ScreenVersion {
  version: string;
  /** Human-friendly label from backend, e.g. v1, v2, v3 */
  version_label?: string | null;
  created_at?: string | null;
  build_status: string;
  is_stable: boolean;
  status?: string;
  public_url?: string | null;
}

export interface RollbackResult {
  success: true;
  screen_id: string;
  project_id: string;
  version: string;
  message: string;
  rollback_cleanup: {
    versions_removed: string[];
    files_removed: number;
    screen_marked: number;
    functions_marked: number;
    screen_deleted: number;
    functions_deleted: number;
  };
}

export async function listScreenVersions(projectId: string, screenId: string): Promise<ScreenVersion[]> {
  const res = await fetch(API_ENDPOINTS.screenVersions(projectId, screenId));
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch versions');
  const raw = (json.versions ?? []) as Array<
    ScreenVersion & { versionLabel?: string | null }
  >;
  return raw.map((item) => ({
    ...item,
    version_label: item.version_label ?? item.versionLabel ?? undefined,
  }));
}

export async function rollbackScreen(projectId: string, screenId: string, version: string): Promise<RollbackResult> {
  const res = await fetch(API_ENDPOINTS.rollbackScreen, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project_id: projectId, screen_id: screenId, version }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || `Rollback failed (${res.status})`);
  }
  return json;
}

export async function fetchCredits(subscriberId: string, orgId?: string, userId?: string): Promise<CreditsData> {
  const res = await fetch(API_ENDPOINTS.credits(subscriberId, orgId, userId));
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch credits');
  return json.data;
}

// --- Project credentials (Phase 4) — values never returned by list/create ---

export type CredentialScope = 'backend_only' | 'frontend_public';

export interface CredentialUpsertBody {
  name: string;
  type: string;
  service?: string;
  scope?: CredentialScope;
  /** Omit or leave unset to update metadata only (existing secret unchanged). */
  value?: string | null;
  environment?: string | null;
}

export interface ProjectCredentialMeta {
  project_id: string;
  name: string;
  type: string;
  service: string;
  scope: string;
  environment: string;
  updatedAt?: string;
  updated_at?: string;
}

export interface CredentialAuditQuery {
  orgId?: string;
  subscriberId?: string;
  userId?: string;
}

/** Optional audit / ownership query params for credential POST (same idea as credits / generate). */
export function credentialAuditParamsFromEnv(): CredentialAuditQuery {
  const subscriberId = import.meta.env.VITE_SUBSCRIBER_ID as string | undefined;
  const orgId = import.meta.env.VITE_ORG_ID as string | undefined;
  const userId = import.meta.env.VITE_USER_ID as string | undefined;
  return {
    ...(subscriberId ? { subscriberId } : {}),
    ...(orgId ? { orgId } : {}),
    ...(userId ? { userId } : {}),
  };
}

function appendCredentialAuditParams(url: URL, audit?: CredentialAuditQuery) {
  if (!audit) return;
  if (audit.orgId) url.searchParams.set('orgId', audit.orgId);
  if (audit.subscriberId) url.searchParams.set('subscriberId', audit.subscriberId);
  if (audit.userId) url.searchParams.set('userId', audit.userId);
}

function credentialErrorMessage(res: Response, json: Record<string, unknown>): string {
  if (res.status === 503) {
    const code = json.code ?? json.error;
    if (code === 'credential_store_unavailable' || String(code).includes('credential'))
      return 'Credential store is unavailable. Configure CRED_MASTER_KEY on the server.';
    return (json.detail as string) || (json.error as string) || 'Credential store unavailable';
  }
  return (
    (json.detail as string) ||
    (json.error as string) ||
    (json.message as string) ||
    `Request failed (${res.status})`
  );
}

export async function createOrUpdateCredential(
  projectId: string,
  body: CredentialUpsertBody,
  audit?: CredentialAuditQuery
): Promise<ProjectCredentialMeta> {
  const url = new URL(API_ENDPOINTS.projectCredentials(projectId));
  appendCredentialAuditParams(url, audit);
  const payload: Record<string, unknown> = {
    name: body.name,
    type: body.type,
    service: body.service ?? '',
    scope: body.scope ?? 'backend_only',
  };
  const env = body.environment;
  if (env !== undefined && env !== null && String(env).trim() !== '') {
    payload.environment = env;
  }
  if (body.value !== undefined && body.value !== '') {
    payload.value = body.value;
  }
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok || json.success === false) {
    throw new Error(credentialErrorMessage(res, json));
  }
  const cred = json.credential as ProjectCredentialMeta | undefined;
  if (!cred) throw new Error('Invalid response: missing credential');
  return cred;
}

export async function listProjectCredentials(
  projectId: string,
  environment?: string
): Promise<ProjectCredentialMeta[]> {
  const url = new URL(API_ENDPOINTS.projectCredentials(projectId));
  if (environment) url.searchParams.set('environment', environment);
  const res = await fetch(url.toString());
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok || json.success === false) {
    throw new Error(credentialErrorMessage(res, json));
  }
  const list = json.credentials;
  return Array.isArray(list) ? (list as ProjectCredentialMeta[]) : [];
}

export async function deleteProjectCredential(
  projectId: string,
  name: string,
  environment?: string
): Promise<void> {
  const url = new URL(API_ENDPOINTS.projectCredentialByName(projectId, name));
  if (environment) url.searchParams.set('environment', environment);
  const res = await fetch(url.toString(), { method: 'DELETE' });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok || json.success === false) {
    throw new Error(credentialErrorMessage(res, json));
  }
}
