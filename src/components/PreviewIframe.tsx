import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Check, RefreshCw, AlertCircle, Maximize2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { CompletePayload, resolvePreviewUrl } from '@/lib/api';
import { cn } from '@/lib/utils';

export type ScreenStatus = 'draft' | 'active';

function withVersionCacheBust(url: string, version?: string): string {
  if (!version || version.trim() === '') return url;

  try {
    const parsed = new URL(url, window.location.origin);
    parsed.searchParams.set('v', version);

    if (/^https?:\/\//i.test(url)) {
      return parsed.toString();
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    const joiner = url.includes('?') ? '&' : '?';
    return `${url}${joiner}v=${encodeURIComponent(version)}`;
  }
}

interface PreviewIframeProps {
  result: CompletePayload;
  className?: string;
  /** When set (e.g. after editor Rebuild), iframe uses this URL so preview stays in sync with code edits. */
  previewUrlOverride?: string | null;
  /** Current status: draft (just generated) or active (saved/published). */
  status?: ScreenStatus;
  /** Called when user switches to Active (publish). No-op when already active or when backend doesn't support reverting to draft. */
  onStatusChange?: (status: ScreenStatus) => void;
  isSaving?: boolean;
  saveError?: string | null;
}

export function PreviewIframe({ result, className, previewUrlOverride, status = 'draft', onStatusChange, isSaving, saveError }: PreviewIframeProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Prefer editor override, then backend public_url, then local computed fallback.
  // Always include the current build version so updated bundles are fetched fresh.
  const rawPreviewUrl = resolvePreviewUrl(
    previewUrlOverride ?? result.public_url,
    result.screen_id,
    result.version,
  );
  const previewUrl = withVersionCacheBust(rawPreviewUrl, result.version);

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
  }, [previewUrl]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
  }, []);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  const handleOpenNewTab = useCallback(() => {
    window.open(previewUrl, '_blank', 'noopener,noreferrer');
  }, [previewUrl]);

  const handleRetry = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
    const iframe = document.querySelector('iframe[data-preview]') as HTMLIFrameElement;
    if (iframe) {
      iframe.src = previewUrl;
    }
  }, [previewUrl]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex flex-col rounded-xl border border-border overflow-hidden", className)}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border bg-card/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <Badge variant="success" className="gap-1.5">
            <Check className="h-3 w-3" />
            Complete
          </Badge>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>v{result.version}</span>
            <span>•</span>
            <span>{result.file_count} files</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onStatusChange != null && (
            <div className="flex items-center gap-2">
              <span className={cn("text-xs font-medium", status === 'draft' ? "text-foreground" : "text-muted-foreground")}>
                Draft
              </span>
              <Switch
                checked={status === 'active'}
                disabled={isSaving || status === 'active'}
                onCheckedChange={(checked) => {
                  if (isSaving) return;
                  if (checked) onStatusChange('active');
                }}
                aria-label="Draft / Active"
              />
              <span className={cn("text-xs font-medium", status === 'active' ? "text-foreground" : "text-muted-foreground")}>
                Active
              </span>
              {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
            </div>
          )}
          {saveError != null && saveError !== '' && (
            <span className="text-sm text-destructive">{saveError}</span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenNewTab}
            className="gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Open in New Tab
          </Button>
        </div>
      </div>

      {/* Preview container */}
      <div className="relative flex-1 bg-muted/20">
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <span className="text-sm text-muted-foreground">Loading preview...</span>
              </div>
            </motion.div>
          )}

          {hasError && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-background z-10"
            >
              <div className="flex flex-col items-center gap-4 text-center p-6">
                <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="font-medium mb-1">Failed to load preview</p>
                  <p className="text-sm text-muted-foreground">
                    The preview URL may be temporarily unavailable.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleRetry} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Retry
                  </Button>
                  <Button variant="default" size="sm" onClick={handleOpenNewTab} className="gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Open in New Tab
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <iframe
          key={previewUrl}
          data-preview
          src={previewUrl}
          onLoad={handleLoad}
          onError={handleError}
          className="w-full h-full min-h-[400px] border-0"
          title="Generated screen preview"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />

        {/* Fullscreen button */}
        {!hasError && !isLoading && (
          <Button
            variant="glass"
            size="icon"
            onClick={handleOpenNewTab}
            className="absolute bottom-4 right-4 h-8 w-8"
            aria-label="Open fullscreen"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}
