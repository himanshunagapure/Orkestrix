// API configuration - uses environment variable for base URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// API endpoints
export const API_ENDPOINTS = {
  generateAngularApp: `${API_BASE_URL}/aiqod-agent/agent/generate-angular-app`,
  stream: (jobId: string) => `${API_BASE_URL}/aiqod-agent/agent/stream/${jobId}`,
} as const;

// Request types
export interface GenerateAppRequest {
  prompt: string;
  project_id: string;
  screen_id: string;
  screen_name?: string;
  description?: string;
  orgId?: string;
  subscriberId?: string;
  userId?: string;
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
