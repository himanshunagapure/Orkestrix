import { Monitor, Code2, Server } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export type ViewMode = 'preview' | 'angular' | 'backend';

interface Props {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
}

const modes: { value: ViewMode; label: string; icon: typeof Monitor }[] = [
  { value: 'preview', label: 'Preview', icon: Monitor },
  { value: 'angular', label: 'Angular Code', icon: Code2 },
  { value: 'backend', label: 'Backend Functions', icon: Server },
];

export function ViewModeToggle({ mode, onChange, className }: Props) {
  return (
    <div className={cn('inline-flex items-center rounded-lg border border-border bg-card/80 p-0.5', className)}>
      {modes.map(({ value, label, icon: Icon }) => (
        <Tooltip key={value} delayDuration={300}>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => onChange(value)}
              aria-label={label}
              aria-pressed={mode === value}
              className={cn(
                'flex size-8 items-center justify-center rounded-md text-xs font-medium transition-all',
                mode === value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
              )}
            >
              <Icon className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{label}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
