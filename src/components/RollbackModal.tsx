import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, RotateCcw, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { listScreenVersions, rollbackScreen, fetchUIScreen, type ScreenVersion } from '@/lib/api';
import { toast } from 'sonner';

interface RollbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  screenId: string;
  currentVersion?: string;
  /** Called after successful rollback with refreshed screen data */
  onRollbackComplete?: (newPublicUrl: string, newVersion: string) => void;
}

export function RollbackModal({
  open,
  onOpenChange,
  projectId,
  screenId,
  currentVersion,
  onRollbackComplete,
}: RollbackModalProps) {
  const [versions, setVersions] = useState<ScreenVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string>('');
  const [rolling, setRolling] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    setSelected('');
    listScreenVersions(projectId, screenId)
      .then((v) => {
        // Sort newest first
        const sorted = [...v].sort((a, b) => b.version.localeCompare(a.version));
        setVersions(sorted);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load versions'))
      .finally(() => setLoading(false));
  }, [open, projectId, screenId]);

  const canRollback = (v: ScreenVersion) =>
    v.build_status === 'success' && v.is_stable && v.version !== currentVersion;

  const handleRollback = async () => {
    if (!selected) return;
    setRolling(true);
    try {
      const result = await rollbackScreen(projectId, screenId, selected);
      toast.success(result.message || 'Rollback successful');

      // Refetch screen to get new public_url
      const refreshed = await fetchUIScreen(screenId, projectId);
      const newUrl = (refreshed.public_url as string) ?? '';
      const newVer = (refreshed.version as string) ?? selected;
      onRollbackComplete?.(newUrl, newVer);
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Rollback failed');
    } finally {
      setRolling(false);
    }
  };

  const formatVersion = (v: string) => {
    // Try to parse timestamp-style version like "20260209090207"
    if (/^\d{14}$/.test(v)) {
      const y = v.slice(0, 4), mo = v.slice(4, 6), d = v.slice(6, 8);
      const h = v.slice(8, 10), mi = v.slice(10, 12), s = v.slice(12, 14);
      return `${y}-${mo}-${d} ${h}:${mi}:${s}`;
    }
    return v;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Rollback Screen
          </DialogTitle>
          <DialogDescription>
            Select a previous version to restore. Only successful and stable builds can be rolled back to.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          )}

          {!loading && !error && versions.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No versions found.</p>
          )}

          {!loading && !error && versions.length > 0 && (
            <ScrollArea className="max-h-72">
              <RadioGroup value={selected} onValueChange={setSelected} className="gap-0">
                {versions.map((v) => {
                  const isCurrent = v.version === currentVersion;
                  const eligible = canRollback(v);
                  return (
                    <label
                      key={v.version}
                      className={`flex items-center gap-3 px-3 py-2.5 border-b border-border last:border-b-0 transition-colors ${
                        eligible ? 'cursor-pointer hover:bg-muted/50' : 'opacity-50 cursor-not-allowed'
                      } ${selected === v.version ? 'bg-muted/60' : ''}`}
                    >
                      <RadioGroupItem
                        value={v.version}
                        disabled={!eligible}
                        id={`v-${v.version}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Label
                            htmlFor={`v-${v.version}`}
                            className="text-sm font-mono cursor-inherit"
                          >
                            {formatVersion(v.version)}
                          </Label>
                          {isCurrent && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              Current
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge
                            variant={v.build_status === 'success' ? 'default' : 'destructive'}
                            className="text-[10px] px-1.5 py-0"
                          >
                            {v.build_status}
                          </Badge>
                          {v.is_stable && (
                            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                              <CheckCircle2 className="h-3 w-3" /> stable
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </RadioGroup>
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={rolling}>
            Cancel
          </Button>
          <Button onClick={handleRollback} disabled={!selected || rolling} className="gap-2">
            {rolling && <Loader2 className="h-4 w-4 animate-spin" />}
            Rollback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
