import { Badge } from '@/components/ui/badge';
import { Code2 } from 'lucide-react';
import type { ScreenFunction } from '@/lib/editorApi';
import { cn } from '@/lib/utils';

interface Props {
  functions: ScreenFunction[];
  selectedId: string | null;
  onSelect: (fn: ScreenFunction) => void;
}

export function BackendFunctionsList({ functions, selectedId, onSelect }: Props) {
  if (functions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2 p-4">
        <Code2 className="h-6 w-6" />
        <span>No backend functions found for this screen.</span>
      </div>
    );
  }

  return (
    <div className="overflow-auto h-full py-1 text-sm">
      {functions.map((fn) => (
        <button
          key={fn.function_id}
          onClick={() => onSelect(fn)}
          className={cn(
            'w-full text-left px-3 py-2 hover:bg-accent/50 transition-colors flex flex-col gap-1',
            selectedId === fn.function_id && 'bg-accent text-accent-foreground',
          )}
        >
          <div className="flex items-center gap-2">
            <Code2 className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="font-mono text-xs truncate">{fn.function_id}</span>
            <Badge variant="secondary" className="text-[9px] ml-auto shrink-0">{fn.type}</Badge>
          </div>
          {fn.description && <span className="text-[11px] text-muted-foreground truncate pl-5">{fn.description}</span>}
        </button>
      ))}
    </div>
  );
}
