import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Copy, Check, RefreshCw, AlertCircle, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CompletePayload } from '@/lib/api';
import { cn } from '@/lib/utils';

interface PreviewIframeProps {
  result: CompletePayload;
  className?: string;
}

export function PreviewIframe({ result, className }: PreviewIframeProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
  }, []);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(result.public_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [result.public_url]);

  const handleOpenNewTab = useCallback(() => {
    window.open(result.public_url, '_blank', 'noopener,noreferrer');
  }, [result.public_url]);

  const handleRetry = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
    // Force iframe reload by triggering a re-render
    const iframe = document.querySelector('iframe[data-preview]') as HTMLIFrameElement;
    if (iframe) {
      iframe.src = result.public_url;
    }
  }, [result.public_url]);

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
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyLink}
            className="gap-2"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-success" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Link
              </>
            )}
          </Button>
          
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
      <div className="relative flex-1 bg-muted/20 min-h-[500px]">
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
          data-preview
          src={result.public_url}
          onLoad={handleLoad}
          onError={handleError}
          className="w-full h-full min-h-[500px] border-0"
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
