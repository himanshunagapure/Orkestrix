// API configuration - uses environment variable for base URL
// Backend context path (e.g. /dev when running locally - must match backend "Mounting application at context path")
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5010';
export const API_CONTEXT_PATH = import.meta.env.VITE_API_CONTEXT_PATH || 'dev';

// Liberty FS base URL for previewing generated Angular app (dist served at LIBERTY_FS_ROOT)
// Preview URL pattern: {LIBERTY_FS_BASE_URL}{screen_id}-v{version}/
export const LIBERTY_FS_BASE_URL = (import.meta.env.VITE_LIBERTY_FS_BASE_URL || 'http://localhost:843/').replace(/\/?$/, '/');

/** Build the preview URL for a completed screen (iframe / open in new tab). */
export function getPreviewUrl(screenId: string, version: string): string {
  return `${LIBERTY_FS_BASE_URL}${screenId}-v${version}/`;
}

// API endpoints (path under context: e.g. http://localhost:5010/dev/agent/...)
export const API_ENDPOINTS = {
  generateAngularApp: `${API_BASE_URL}/${API_CONTEXT_PATH}/aiqod-agent/agent/generate-angular-app`,
  updateAngularScreen: `${API_BASE_URL}/${API_CONTEXT_PATH}/aiqod-agent/agent/update-angular-screen`,
  stream: (jobId: string) => `${API_BASE_URL}/${API_CONTEXT_PATH}/aiqod-agent/agent/stream/${jobId}`,
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
export interface LogEvent {
  type: 'log';
  message: string;
  details?: unknown;
}

export interface RetryEvent {
  type: 'retry';
  message: string;
  details?: unknown;
}

export interface WarningEvent {
  type: 'warning';
  message: string;
  details?: unknown;
}

export interface ErrorEvent {
  type: 'error';
  message: string;
}

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

export interface CompleteEvent {
  type: 'complete';
  payload: CompletePayload;
}

export type SSEEvent = LogEvent | RetryEvent | WarningEvent | ErrorEvent | CompleteEvent;

// Job status
export type JobStatus = 'idle' | 'submitting' | 'streaming' | 'complete' | 'error';

export interface JobState {
  status: JobStatus;
  jobId: string | null;
  prompt: string;
  logs: SSEEvent[];
  result: CompletePayload | null;
  error: string | null;
}
