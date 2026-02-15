import { useState, useCallback, useRef, useEffect } from 'react';
import { nanoid } from 'nanoid';
import {
  API_ENDPOINTS,
  GenerateAppRequest,
  UpdateScreenRequest,
  GenerateAppResponse,
  SSEEvent,
  CompletePayload,
  JobStatus,
  JobState,
  ChatMessage,
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
  const [projectId, setProjectId] = useState<string | null>(null);
  const [screenId, setScreenId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const userId = "5beaabd82ac6767c86dc311c";

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

  const startStreaming = useCallback((jobId: string, onLog?: (e: SSEEvent) => void, onComplete?: (p: CompletePayload) => void, onError?: (msg: string) => void) => {
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
            onLog?.(data);
            break;

          case 'error':
            addLog(data);
            updateState({ status: 'error', error: data.message });
            onError?.(data.message);
            eventSource.close();
            break;

          case 'complete':
            addLog(data);
            updateState({ status: 'complete', result: data.payload });
            onComplete?.(data.payload);
            eventSource.close();
            break;
        }
      } catch (e) {
        console.error('Failed to parse SSE event:', e);
      }
    };

    eventSource.onerror = () => {
      const msg = 'Connection to server lost. Please try again.';
      updateState({ status: 'error', error: msg });
      onError?.(msg);
      eventSource.close();
    };
  }, [addLog, updateState]);

  const submitJob = useCallback(async (prompt: string, screenName?: string) => {
    eventSourceRef.current?.close();
    abortControllerRef.current?.abort();

    const pId = nanoid(10);
    const sId = nanoid(10);
    setProjectId(pId);
    setScreenId(sId);

    setState({
      status: 'submitting',
      jobId: null,
      prompt,
      logs: [],
      result: null,
      error: null,
    });

    const requestBody: GenerateAppRequest = {
      prompt,
      project_id: pId,
      screen_id: sId,
      screen_name: screenName,
      user_id: userId,
    };

    try {
      abortControllerRef.current = new AbortController();
      const response = await fetch(API_ENDPOINTS.generateAngularApp, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal,
      });

      const data: GenerateAppResponse = await response.json();

      if (!response.ok || !data.success) {
        const errorData = data as { success: false; error: string; required_credits?: number; available_credits?: number };
        let errorMessage = errorData.error || 'Failed to submit job';
        if (response.status === 402 && errorData.required_credits !== undefined) {
          errorMessage = `Insufficient credits. Required: ${errorData.required_credits}, Available: ${errorData.available_credits ?? 0}`;
        }
        updateState({ status: 'error', error: errorMessage });
        return null;
      }

      const { job_id } = data as { success: true; job_id: string };
      updateState({ status: 'streaming', jobId: job_id });
      startStreaming(job_id);
      return job_id;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return null;
      updateState({ status: 'error', error: error instanceof Error ? error.message : 'Failed to submit job' });
      return null;
    }
  }, [updateState, startStreaming]);

  /** Submit an update to an already-generated screen (evolution mode) */
  const submitUpdate = useCallback(async (userMessage: string) => {
    if (!projectId || !screenId) return null;

    eventSourceRef.current?.close();
    abortControllerRef.current?.abort();
    setIsUpdating(true);

    const msgId = nanoid(8);
    const userMsg: ChatMessage = { id: msgId, role: 'user', content: userMessage, status: 'pending' };
    const systemMsgId = nanoid(8);
    const systemMsg: ChatMessage = { id: systemMsgId, role: 'system', content: 'Processing update...', status: 'streaming', logs: [] };

    setChatMessages((prev) => [...prev, userMsg, systemMsg]);

    // Update user message to streaming
    const updateChatMsg = (id: string, updates: Partial<ChatMessage>) => {
      setChatMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
    };

    const requestBody: UpdateScreenRequest = {
      prompt: userMessage,
      project_id: projectId,
      screen_id: screenId,
      user_id: userId,
    };

    try {
      abortControllerRef.current = new AbortController();
      const response = await fetch(API_ENDPOINTS.updateAngularScreen, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal,
      });

      const data: GenerateAppResponse = await response.json();

      if (!response.ok || !data.success) {
        const errorData = data as { success: false; error: string; required_credits?: number; available_credits?: number };
        let errorMessage = errorData.error || 'Failed to submit update';
        if (response.status === 402 && errorData.required_credits !== undefined) {
          errorMessage = `Insufficient credits. Required: ${errorData.required_credits}, Available: ${errorData.available_credits ?? 0}`;
        }
        updateChatMsg(msgId, { status: 'failed' });
        updateChatMsg(systemMsgId, { content: errorMessage, status: 'failed' });
        setIsUpdating(false);
        return null;
      }

      const { job_id } = data as { success: true; job_id: string };
      updateChatMsg(msgId, { status: 'pending' });

      // Stream update progress
      startStreaming(
        job_id,
        // onLog — append to system message logs
        (event) => {
          setChatMessages((prev) =>
            prev.map((m) =>
              m.id === systemMsgId
                ? { ...m, logs: [...(m.logs || []), event], content: 'message' in event ? event.message : m.content }
                : m
            )
          );
        },
        // onComplete
        (payload) => {
          updateChatMsg(msgId, { status: 'applied' });
          updateChatMsg(systemMsgId, { content: 'Update applied successfully!', status: 'applied', logs: [] });
          // Update result with new payload so preview refreshes
          updateState({ result: payload });
          setIsUpdating(false);
        },
        // onError
        (errorMsg) => {
          updateChatMsg(msgId, { status: 'failed' });
          updateChatMsg(systemMsgId, { content: errorMsg, status: 'failed' });
          setIsUpdating(false);
        }
      );

      return job_id;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setIsUpdating(false);
        return null;
      }
      const msg = error instanceof Error ? error.message : 'Failed to submit update';
      updateChatMsg(msgId, { status: 'failed' });
      updateChatMsg(systemMsgId, { content: msg, status: 'failed' });
      setIsUpdating(false);
      return null;
    }
  }, [projectId, screenId, updateState, startStreaming]);

  const reconnect = useCallback((jobId: string) => {
    updateState({ status: 'streaming', jobId, logs: [], result: null, error: null });
    startStreaming(jobId);
  }, [startStreaming, updateState]);

  const reset = useCallback(() => {
    eventSourceRef.current?.close();
    abortControllerRef.current?.abort();
    setState(initialState);
    setProjectId(null);
    setScreenId(null);
    setChatMessages([]);
    setIsUpdating(false);
  }, []);

  const setStatus = useCallback((status: JobStatus) => {
    updateState({ status });
  }, [updateState]);

  return {
    ...state,
    projectId,
    screenId,
    chatMessages,
    isUpdating,
    submitJob,
    submitUpdate,
    reconnect,
    reset,
    setStatus,
  };
}
