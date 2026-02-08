import { motion } from 'framer-motion';
import { Loader2, Clock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressIndicatorProps {
  isActive: boolean;
  className?: string;
}

export function ProgressIndicator({ isActive, className }: ProgressIndicatorProps) {
  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "flex flex-col items-center justify-center gap-6 p-8",
        className
      )}
    >
      {/* Animated loader */}
      <div className="relative">
        {/* Outer glow ring */}
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/20"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.2, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Main spinner container */}
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-info/20 border border-primary/30">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      </div>

      {/* Status text */}
      <div className="text-center space-y-2">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center gap-2 text-lg font-medium"
        >
          <Zap className="h-5 w-5 text-primary" />
          <span>Generating your screen</span>
        </motion.div>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-sm text-muted-foreground"
        >
          AI is crafting your UI components...
        </motion.p>
      </div>

      {/* Time estimate */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex items-center gap-2 rounded-full bg-muted/50 px-4 py-2 text-sm text-muted-foreground"
      >
        <Clock className="h-4 w-4" />
        <span>Generation typically takes 5-10 minutes</span>
      </motion.div>
    </motion.div>
  );
}
