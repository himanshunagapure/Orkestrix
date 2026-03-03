import { Monitor, Code2, Server } from 'lucide-react';
import { cn } from '@/lib/utils';

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
        <button
          key={value}
          onClick={() => onChange(value)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all',
            mode === value
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}
