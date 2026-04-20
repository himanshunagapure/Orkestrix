import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw, ArrowLeft, CreditCard, Coins, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CreditsErrorInfo } from '@/lib/api';

const BUY_CREDITS_URL = import.meta.env.VITE_BUY_CREDITS_URL as string | undefined;

interface ErrorDisplayProps {
  error: string;
  onRetry?: () => void;
  onBack?: () => void;
  className?: string;
  /** Structured credits error info from the backend (HTTP 402 or SSE error). */
  creditsError?: CreditsErrorInfo | null;
  /** Live available balance from the credits API (optional, supplements creditsError.available). */
  availableCredits?: number;
}

export function ErrorDisplay({ error, onRetry, onBack, className, creditsError, availableCredits }: ErrorDisplayProps) {
  const isCreditsError = Boolean(creditsError) || error.toLowerCase().includes('credit');

  const available = creditsError?.available ?? availableCredits;
  const required = creditsError?.required;

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
      {/* Icon */}
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        {isCreditsError ? (
          <CreditCard className="h-8 w-8 text-destructive" />
        ) : (
          <AlertCircle className="h-8 w-8 text-destructive" />
        )}
      </div>

      {/* Title + message */}
      <div className="text-center space-y-2 max-w-md">
        <h3 className="text-lg font-semibold text-destructive">
          {isCreditsError ? 'Insufficient Credits' : 'Generation Failed'}
        </h3>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>

      {/* Credits breakdown card — only when it's a credits error */}
      {isCreditsError && (available !== undefined || required !== undefined) && (
        <div className="w-full max-w-sm rounded-lg border border-border bg-card/80 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Coins className="h-4 w-4 text-primary" />
            Credits Details
          </div>
          <div className="space-y-2 text-sm">
            {available !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Available balance</span>
                <span className={cn('font-semibold tabular-nums', available === 0 && 'text-destructive')}>
                  {available.toLocaleString()}
                </span>
              </div>
            )}
            {required !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Required for this job</span>
                <span className="font-semibold tabular-nums text-warning">{required.toLocaleString()}</span>
              </div>
            )}
            {available !== undefined && required !== undefined && (
              <div className="flex items-center justify-between border-t border-border pt-2 mt-1">
                <span className="text-muted-foreground">Shortfall</span>
                <span className="font-semibold tabular-nums text-destructive">
                  {Math.max(0, required - available).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {onBack && (
          <Button variant="outline" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        )}
        {isCreditsError && (
          <Button
            variant="default"
            className="gap-2"
            onClick={() => window.open(BUY_CREDITS_URL || '#', BUY_CREDITS_URL ? '_blank' : '_self')}
          >
            <ShoppingCart className="h-4 w-4" />
            Buy More Credits
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
