import { useState, useCallback, useEffect, useMemo } from 'react';
import { ChevronRight, Loader2, Play, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import {
  saveBackendDraft,
  testBackendFunction,
  executeDynamicFunction,
  type ScreenFunction,
} from '@/lib/editorApi';

function minimalExampleFromSchema(schema: unknown): Record<string, unknown> {
  if (!schema || typeof schema !== 'object') return {};
  const s = schema as Record<string, unknown>;
  if (s.properties && typeof s.properties === 'object') {
    const out: Record<string, unknown> = {};
    const req = Array.isArray(s.required) ? (s.required as string[]) : [];
    const props = s.properties as Record<string, unknown>;
    for (const k of Object.keys(props)) {
      if (!req.includes(k)) continue;
      const prop = props[k];
      if (prop && typeof prop === 'object') {
        const t = (prop as { type?: string }).type;
        if (t === 'string') out[k] = '';
        else if (t === 'number' || t === 'integer') out[k] = 0;
        else if (t === 'boolean') out[k] = false;
        else if (t === 'array') out[k] = [];
        else if (t === 'object') out[k] = {};
        else out[k] = null;
      }
    }
    return out;
  }
  return {};
}

function prettyJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

interface BackendFunctionTestPanelProps {
  projectId: string;
  sessionId: string;
  fn: ScreenFunction;
  /** Current source from editor (for draft test). */
  sourceCode: string;
  modelsSource?: string | null;
}

export function BackendFunctionTestPanel({
  projectId,
  sessionId,
  fn,
  sourceCode,
  modelsSource,
}: BackendFunctionTestPanelProps) {
  const [requestBody, setRequestBody] = useState('{}');
  const [responseText, setResponseText] = useState<string | null>(null);
  const [responseError, setResponseError] = useState(false);
  const [runningTest, setRunningTest] = useState(false);
  const [runningLive, setRunningLive] = useState(false);

  const schemaHint = useMemo(() => {
    const name = fn.input_model_name ?? 'input';
    const schema = fn.input_model;
    if (schema == null) return `${name} (no schema)`;
    return prettyJson(schema);
  }, [fn]);

  useEffect(() => {
    const ex = minimalExampleFromSchema(fn.input_model);
    setRequestBody(Object.keys(ex).length > 0 ? JSON.stringify(ex, null, 2) : '{}');
    setResponseText(null);
    setResponseError(false);
  }, [fn.function_id]);

  const parsePayload = useCallback((): Record<string, unknown> => {
    const trimmed = requestBody.trim();
    if (!trimmed) return {};
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Request body must be a JSON object');
      }
      return parsed as Record<string, unknown>;
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : 'Invalid JSON');
    }
  }, [requestBody]);

  const handleRunTest = useCallback(async () => {
    let payload: Record<string, unknown>;
    try {
      payload = parsePayload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Invalid JSON');
      return;
    }
    setRunningTest(true);
    setResponseError(false);
    setResponseText(null);
    try {
      await saveBackendDraft(sessionId, fn.function_id, sourceCode, modelsSource ?? null);
      const result = await testBackendFunction(sessionId, fn.function_id, payload);
      setResponseText(prettyJson(result));
      const isFailure =
        result &&
        typeof result === 'object' &&
        'success' in result &&
        (result as { success?: boolean }).success === false;
      setResponseError(Boolean(isFailure));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Test failed');
      setResponseText(prettyJson({ error: e instanceof Error ? e.message : String(e) }));
      setResponseError(true);
    } finally {
      setRunningTest(false);
    }
  }, [parsePayload, sessionId, fn.function_id, sourceCode, modelsSource]);

  const handleRunLive = useCallback(async () => {
    let payload: Record<string, unknown>;
    try {
      payload = parsePayload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Invalid JSON');
      return;
    }
    setRunningLive(true);
    setResponseError(false);
    setResponseText(null);
    try {
      const result = await executeDynamicFunction(projectId, {
        function_id: fn.function_id,
        params: payload,
        request_meta: {},
      });
      setResponseText(prettyJson(result));
      const isFailure =
        result &&
        typeof result === 'object' &&
        'success' in result &&
        (result as { success?: boolean }).success === false;
      setResponseError(Boolean(isFailure));
    } catch (e) {
      const err = e as Error & { details?: unknown };
      const detail =
        err.details != null
          ? { message: err.message, details: err.details }
          : { message: err.message };
      setResponseText(prettyJson(detail));
      setResponseError(true);
    } finally {
      setRunningLive(false);
    }
  }, [parsePayload, projectId, fn.function_id]);

  const handleBlurFormat = useCallback(() => {
    try {
      const t = requestBody.trim();
      if (!t) return;
      const parsed = JSON.parse(t);
      setRequestBody(JSON.stringify(parsed, null, 2));
    } catch {
      // keep as-is
    }
  }, [requestBody]);

  return (
    <div className="flex flex-col border-t border-border bg-card/30 shrink-0 max-h-[45%] min-h-[140px]">
      <Collapsible defaultOpen className="border-b border-border">
        <CollapsibleTrigger className="flex w-full items-center gap-1.5 px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted-foreground font-semibold hover:bg-muted/50 [&[data-state=open]>svg]:rotate-90">
          <ChevronRight className="h-3.5 w-3.5 shrink-0 transition-transform" />
          Expected input
        </CollapsibleTrigger>
        <CollapsibleContent>
          <pre className="max-h-32 overflow-auto px-3 pb-2 text-[10px] text-muted-foreground font-mono whitespace-pre-wrap break-words">
            {schemaHint}
          </pre>
        </CollapsibleContent>
      </Collapsible>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-px min-h-0 flex-1 overflow-hidden">
        <div className="flex flex-col min-h-0 border-b lg:border-b-0 lg:border-r border-border p-2">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
            Request body
          </div>
          <Textarea
            value={requestBody}
            onChange={(e) => setRequestBody(e.target.value)}
            onBlur={handleBlurFormat}
            className="flex-1 min-h-[96px] font-mono text-xs resize-none"
            spellCheck={false}
            placeholder="{}"
          />
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Button
              type="button"
              size="sm"
              variant="default"
              className="h-8 text-xs gap-1.5"
              disabled={runningTest || runningLive}
              onClick={handleRunTest}
            >
              {runningTest ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              Run test
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1.5"
              disabled={runningTest || runningLive}
              onClick={handleRunLive}
            >
              {runningLive ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
              Run live
            </Button>
          </div>
        </div>

        <div className="flex flex-col min-h-0 p-2 min-h-[120px]">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
            Response
          </div>
          <pre
            className={cn(
              'flex-1 min-h-[96px] overflow-auto rounded-md border border-border bg-muted/30 p-2 text-xs font-mono whitespace-pre-wrap break-words',
              responseError && 'text-destructive border-destructive/30',
            )}
          >
            {responseText ?? 'Run a test to see the response.'}
          </pre>
        </div>
      </div>
    </div>
  );
}
