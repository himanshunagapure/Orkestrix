import { useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  API_ENDPOINTS,
  GenerateAppRequest,
  GenerateAppResponse,
  SSEEvent,
  CompletePayload,
  JobStatus,
  JobState,
} from '@/lib/api';

const initialState: JobState = {
  status: 'idle',
  jobId: null,
  prompt: '',
  logs: [],
  result: null,
  error: null,
};

export function useJobGeneration() {
  const [state, setState] = useState<JobState>(initialState);
  const eventSourceRef = useRef<EventSource | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
      abortControllerRef.current?.abort();
    };
  }, []);

  const updateState = useCallback((updates: Partial<JobState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const addLog = useCallback((event: SSEEvent) => {
    setState((prev) => ({
      ...prev,
      logs: [...prev.logs, event],
    }));
  }, []);

  const submitJob = useCallback(async (prompt: string, screenName?: string) => {
    // Close any existing connection
    eventSourceRef.current?.close();
    abortControllerRef.current?.abort();

    // Reset state
    setState({
      status: 'submitting',
      jobId: null,
      prompt,
      logs: [],
      result: null,
      error: null,
    });

    // Generate IDs
    const projectId = uuidv4();
    const screenId = uuidv4();

    const requestBody: GenerateAppRequest = {
      prompt,
      project_id: projectId,
      screen_id: screenId,
      screen_name: screenName,
    };

    try {
      abortControllerRef.current = new AbortController();

      const response = await fetch(API_ENDPOINTS.generateAngularApp, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal,
      });

      const data: GenerateAppResponse = await response.json();

      if (!response.ok || !data.success) {
        const errorData = data as { success: false; error: string; required_credits?: number; available_credits?: number };
        let errorMessage = errorData.error || 'Failed to submit job';
        
        // Handle 402 - insufficient credits
        if (response.status === 402 && errorData.required_credits !== undefined) {
          errorMessage = `Insufficient credits. Required: ${errorData.required_credits}, Available: ${errorData.available_credits ?? 0}`;
        }
        
        updateState({
          status: 'error',
          error: errorMessage,
        });
        return null;
      }

      const { job_id } = data as { success: true; job_id: string };
      
      updateState({
        status: 'streaming',
        jobId: job_id,
      });

      // Start SSE connection
      startStreaming(job_id);
      
      return job_id;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return null;
      }
      
      updateState({
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to submit job',
      });
      return null;
    }
  }, [updateState]);

  const startStreaming = useCallback((jobId: string) => {
    const eventSource = new EventSource(API_ENDPOINTS.stream(jobId));
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data: SSEEvent = JSON.parse(event.data);
        
        switch (data.type) {
          case 'log':
          case 'retry':
          case 'warning':
            addLog(data);
            break;
            
          case 'error':
            addLog(data);
            updateState({
              status: 'error',
              error: data.message,
            });
            eventSource.close();
            break;
            
          case 'complete':
            addLog(data);
            updateState({
              status: 'complete',
              result: data.payload,
            });
            eventSource.close();
            break;
        }
      } catch (e) {
        console.error('Failed to parse SSE event:', e);
      }
    };

    eventSource.onerror = () => {
      updateState({
        status: 'error',
        error: 'Connection to server lost. Please try again.',
      });
      eventSource.close();
    };
  }, [addLog, updateState]);

  const reconnect = useCallback((jobId: string) => {
    updateState({
      status: 'streaming',
      jobId,
      logs: [],
      result: null,
      error: null,
    });
    startStreaming(jobId);
  }, [startStreaming, updateState]);

  const reset = useCallback(() => {
    eventSourceRef.current?.close();
    abortControllerRef.current?.abort();
    setState(initialState);
  }, []);

  const setStatus = useCallback((status: JobStatus) => {
    updateState({ status });
  }, [updateState]);

  return {
    ...state,
    submitJob,
    reconnect,
    reset,
    setStatus,
  };
}
