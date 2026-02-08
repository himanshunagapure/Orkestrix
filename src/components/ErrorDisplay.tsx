import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw, ArrowLeft, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorDisplayProps {
  error: string;
  onRetry?: () => void;
  onBack?: () => void;
  className?: string;
}

export function ErrorDisplay({ error, onRetry, onBack, className }: ErrorDisplayProps) {
  const isCreditsError = error.toLowerCase().includes('credit');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "flex flex-col items-center justify-center gap-6 p-8 rounded-xl",
        "border border-destructive/30 bg-destructive/5",
        className
      )}
    >
      {/* Error icon */}
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        {isCreditsError ? (
          <CreditCard className="h-8 w-8 text-destructive" />
        ) : (
          <AlertCircle className="h-8 w-8 text-destructive" />
        )}
      </div>

      {/* Error message */}
      <div className="text-center space-y-2 max-w-md">
        <h3 className="text-lg font-semibold text-destructive">
          {isCreditsError ? 'Insufficient Credits' : 'Generation Failed'}
        </h3>
        <p className="text-sm text-muted-foreground">
          {error}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {onBack && (
          <Button variant="outline" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        )}
        {onRetry && !isCreditsError && (
          <Button variant="default" onClick={onRetry} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        )}
      </div>
    </motion.div>
  );
}
