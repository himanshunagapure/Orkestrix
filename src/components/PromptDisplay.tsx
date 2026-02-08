import { motion } from 'framer-motion';
import { FileText, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PromptDisplayProps {
  prompt: string;
  className?: string;
}

export function PromptDisplay({ prompt, className }: PromptDisplayProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3 bg-muted/30">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Your Prompt</span>
      </div>

      {/* Prompt content */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {prompt}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
