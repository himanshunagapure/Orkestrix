import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  User,
  Bot,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChatMessage, SSEEvent } from '@/lib/api';
import { cn } from '@/lib/utils';

interface ChatPanelProps {
  messages: ChatMessage[];
  isUpdating: boolean;
  onSendMessage: (message: string) => void;
  originalPrompt: string;
  className?: string;
}

function MessageStatusBadge({ status }: { status?: ChatMessage['status'] }) {
  switch (status) {
    case 'pending':
      return (
        <Badge variant="processing" className="text-[10px] gap-1">
          <Loader2 className="h-2.5 w-2.5 animate-spin" />
          Sending
        </Badge>
      );
    case 'streaming':
      return (
        <Badge variant="processing" className="text-[10px] gap-1">
          <Loader2 className="h-2.5 w-2.5 animate-spin" />
          Applying...
        </Badge>
      );
    case 'applied':
      return (
        <Badge variant="success" className="text-[10px] gap-1">
          <CheckCircle2 className="h-2.5 w-2.5" />
          Applied
        </Badge>
      );
    case 'failed':
      return (
        <Badge variant="error" className="text-[10px] gap-1">
          <XCircle className="h-2.5 w-2.5" />
          Failed
        </Badge>
      );
    default:
      return null;
  }
}

function SystemMessageLogs({ logs }: { logs?: SSEEvent[] }) {
  const [expanded, setExpanded] = useState(true);
  if (!logs || logs.length === 0) return null;

  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronDown className={cn('h-3 w-3 transition-transform', !expanded && '-rotate-90')} />
        {logs.length} log{logs.length !== 1 ? 's' : ''}
      </button>
      {expanded && (
        <div className="mt-1 space-y-0.5 max-h-[120px] overflow-y-auto">
          {logs.map((log, i) => (
            <div
              key={i}
              className={cn(
                'text-[11px] font-mono px-2 py-0.5 rounded',
                log.type === 'warning' && 'text-warning bg-warning/5',
                log.type === 'retry' && 'text-primary bg-primary/5',
                log.type === 'error' && 'text-destructive bg-destructive/5',
                log.type === 'log' && 'text-muted-foreground',
              )}
            >
              {'message' in log ? log.message : 'Complete'}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ChatPanel({ messages, isUpdating, onSendMessage, originalPrompt, className }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || isUpdating) return;
    onSendMessage(trimmed);
    setInput('');
    // Reset textarea height
    if (inputRef.current) inputRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize
  useEffect(() => {
    const ta = inputRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
    }
  }, [input]);

  return (
    <div className={cn('flex flex-col h-full rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3 bg-muted/30 shrink-0">
        <Bot className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Refine Your Screen</span>
        <span className="text-xs text-muted-foreground ml-auto">
          <Clock className="h-3 w-3 inline mr-1" />
          Updates take 1–5 min
        </span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0" role="log" aria-live="polite">
        {/* Initial generation message */}
        <div className="flex items-start gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <User className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-1">Original prompt</p>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{originalPrompt}</p>
            <Badge variant="success" className="text-[10px] gap-1 mt-2">
              <CheckCircle2 className="h-2.5 w-2.5" />
              Generated
            </Badge>
          </div>
        </div>

        {/* Chat messages */}
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3"
            >
              <div
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                  msg.role === 'user' ? 'bg-primary/10' : 'bg-muted'
                )}
              >
                {msg.role === 'user' ? (
                  <User className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <MessageStatusBadge status={msg.status} />
                </div>
                {msg.role === 'system' && <SystemMessageLogs logs={msg.logs} />}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isUpdating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-xs text-muted-foreground pl-10"
          >
            <Loader2 className="h-3 w-3 animate-spin" />
            AI is updating your screen...
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border p-3 shrink-0 bg-background/50">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isUpdating ? 'Update in progress...' : 'Describe a change...'}
            disabled={isUpdating}
            rows={1}
            className={cn(
              'flex-1 resize-none rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm',
              'placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-all'
            )}
          />
          <Button
            variant="hero"
            size="icon"
            onClick={handleSubmit}
            disabled={!input.trim() || isUpdating}
            className="h-9 w-9 shrink-0"
            aria-label="Send update"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
