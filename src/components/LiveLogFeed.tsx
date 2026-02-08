import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, AlertTriangle, XCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SSEEvent } from '@/lib/api';
import { cn } from '@/lib/utils';

interface LiveLogFeedProps {
  logs: SSEEvent[];
  className?: string;
}

const getLogIcon = (type: SSEEvent['type']) => {
  switch (type) {
    case 'log':
      return <Info className="h-3.5 w-3.5" />;
    case 'warning':
      return <AlertTriangle className="h-3.5 w-3.5" />;
    case 'error':
      return <XCircle className="h-3.5 w-3.5" />;
    case 'retry':
      return <RefreshCw className="h-3.5 w-3.5" />;
    case 'complete':
      return <CheckCircle2 className="h-3.5 w-3.5" />;
  }
};

const getLogClass = (type: SSEEvent['type']) => {
  switch (type) {
    case 'log':
      return 'log-entry-info';
    case 'warning':
      return 'log-entry-warning';
    case 'error':
      return 'log-entry-error';
    case 'retry':
      return 'log-entry-retry';
    case 'complete':
      return 'log-entry-success';
  }
};

const getBadgeVariant = (type: SSEEvent['type']) => {
  switch (type) {
    case 'log':
      return 'log';
    case 'warning':
      return 'warning';
    case 'error':
      return 'error';
    case 'retry':
      return 'retry';
    case 'complete':
      return 'success';
  }
};

const getMessage = (event: SSEEvent) => {
  if (event.type === 'complete') {
    return 'Generation complete!';
  }
  return event.message;
};

export function LiveLogFeed({ logs, className }: LiveLogFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border border-border bg-card/50 backdrop-blur-sm",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
          <span className="text-sm font-medium">Live Logs</span>
        </div>
        <Badge variant="processing" className="text-xs">
          {logs.length} events
        </Badge>
      </div>

      {/* Log entries */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[400px] min-h-[200px]"
        role="log"
        aria-live="polite"
        aria-label="Generation progress logs"
      >
        <AnimatePresence initial={false}>
          {logs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center h-full text-muted-foreground text-sm"
            >
              Waiting for events...
            </motion.div>
          ) : (
            logs.map((log, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className={cn("flex items-start gap-3", getLogClass(log.type))}
              >
                <span className="mt-0.5 shrink-0">
                  {getLogIcon(log.type)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={getBadgeVariant(log.type)} className="text-[10px] uppercase">
                      {log.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm break-words">{getMessage(log)}</p>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
