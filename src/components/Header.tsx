import { motion } from 'framer-motion';
import { Sparkles, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  showReset?: boolean;
  onReset?: () => void;
}

export function Header({ showReset, onReset }: HeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl"
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-info">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">AI Screen Builder</h1>
            <p className="text-xs text-muted-foreground">Generate UI screens with AI</p>
          </div>
        </div>

        {showReset && onReset && (
          <Button variant="ghost" size="sm" onClick={onReset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            New Generation
          </Button>
        )}
      </div>
    </motion.header>
  );
}
