// API configuration - uses environment variable for base URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5010';
export const API_CONTEXT_PATH = import.meta.env.VITE_API_CONTEXT_PATH || 'dev';

// Liberty FS base URL for previewing generated Angular app
export const LIBERTY_FS_BASE_URL = (import.meta.env.VITE_LIBERTY_FS_BASE_URL || 'http://localhost:843/').replace(/\/?$/, '/');

/** Build the preview URL for a completed screen. */
export function getPreviewUrl(screenId: string, version: string): string {
  return `${LIBERTY_FS_BASE_URL}${screenId}-v${version}/`;
}

// API endpoints
export const API_ENDPOINTS = {
  generateAngularApp: `${API_BASE_URL}/${API_CONTEXT_PATH}/aiqod-agent/agent/generate-angular-app`,
  updateAngularScreen: `${API_BASE_URL}/${API_CONTEXT_PATH}/aiqod-agent/agent/update-angular-screen`,
  stream: (jobId: string) => `${API_BASE_URL}/${API_CONTEXT_PATH}/aiqod-agent/agent/stream/${jobId}`,
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
} as const;

// Request types
export interface GenerateAppRequest {
  prompt: string;
  project_id: string;
  screen_id: string;
  user_id: string;
  screen_name?: string;
  description?: string;
  org_id?: string;
  subscriber_id?: string;
}

export interface UpdateScreenRequest {
  prompt: string;
  project_id: string;
  screen_id: string;
  user_id: string;
}

// Chat message type for the evolution mode
export interface ChatMessage {
  id: string;
  role: 'user' | 'system';
  content: string;
  status?: 'pending' | 'streaming' | 'applied' | 'failed';
  logs?: SSEEvent[];
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

export interface UpdateCompletePayload {
  success: true;
  screen_id: string;
  project_id: string;
  updated_ir_schema?: object;
  ir_schema?: object;
  angular?: { public_url: string; version: string; changed_files?: unknown[] };
  public_url?: string;
  version?: string;
  file_count?: number;
  recovery_attempts?: unknown[];
}

export function normalizeToCompletePayload(p: UpdateCompletePayload | CompletePayload): CompletePayload {
  const angular = 'angular' in p ? p.angular : undefined;
  return {
    success: true,
    project_id: p.project_id,
    screen_id: p.screen_id,
    ir_schema: ('updated_ir_schema' in p ? p.updated_ir_schema : undefined) ?? p.ir_schema ?? {},
    version: angular?.version ?? p.version ?? '',
    public_url: angular?.public_url ?? p.public_url ?? '',
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
  [key: string]: unknown;
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

export async function fetchCredits(subscriberId: string, orgId?: string, userId?: string): Promise<CreditsData> {
  const res = await fetch(API_ENDPOINTS.credits(subscriberId, orgId, userId));
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch credits');
  return json.data;
}
