import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ExternalLink, Loader2, AlertCircle, LayoutGrid, PlusCircle, Pencil, Code2, MoreVertical, KeyRound, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { fetchUIList, updateScreenDisplayName, UIListItem } from '@/lib/api';
import { toast } from 'sonner';

export default function AppsPage() {
  const [apps, setApps] = useState<UIListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<UIListItem | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameSaving, setRenameSaving] = useState(false);

  const loadApps = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUIList();
      setApps(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load apps');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadApps(); }, []);

  useEffect(() => {
    if (renameTarget) setRenameValue(renameTarget.screen_name?.trim() || '');
  }, [renameTarget]);

  const handleRenameSave = async () => {
    if (!renameTarget) return;
    const name = renameValue.trim();
    if (!name) {
      toast.error('Enter a screen name');
      return;
    }
    setRenameSaving(true);
    try {
      const ok = await updateScreenDisplayName({
        project_id: renameTarget.project_id,
        screen_id: renameTarget.screen_id,
        screen_name: name,
      });
      if (!ok.success) {
        toast.error(ok.error ?? 'Could not rename screen');
        return;
      }
      toast.success('Screen name updated');
      setRenameTarget(null);
      await loadApps();
    } finally {
      setRenameSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Apps</h1>
          <p className="text-sm text-muted-foreground mt-1">All your generated screens</p>
        </div>
        <Button asChild variant="hero" className="gap-2">
          <Link to="/create">
            <PlusCircle className="h-4 w-4" />
            Create App
          </Link>
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={loadApps}>Retry</Button>
        </div>
      )}

      {!loading && !error && apps.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center">
            <LayoutGrid className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="font-medium mb-1">No apps yet</p>
            <p className="text-sm text-muted-foreground">Create your first app from the builder.</p>
          </div>
          <Button asChild variant="hero" className="gap-2">
            <Link to="/create"><PlusCircle className="h-4 w-4" /> Create App</Link>
          </Button>
        </div>
      )}

      {!loading && !error && apps.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {apps.map((app, i) => (
            <motion.div
              key={app._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-5 hover:border-primary/30 transition-colors group flex flex-col"
            >
              <Link
                to={`/apps/${app.project_id}/${app.screen_id}`}
                className="flex-1 min-w-0"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-medium truncate group-hover:text-primary transition-colors">
                    {app.screen_name || 'Untitled Screen'}
                  </h3>
                  <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">{app.screen_id.slice(0, 8)}</Badge>
                </div>
              </Link>
              <div className="flex gap-2 mt-3">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1.5 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link
                    to={`/create?project_id=${app.project_id}&screen_id=${app.screen_id}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1.5 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link
                    to={`/apps/${app.project_id}/${app.screen_id}/editor`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Code2 className="h-3.5 w-3.5" />
                    Code
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0 px-2"
                      aria-label="More actions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem
                      className="gap-2 cursor-pointer"
                      onSelect={() => setRenameTarget(app)}
                    >
                      <Type className="h-4 w-4" />
                      Rename screen
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        to={`/apps/${app.project_id}/${app.screen_id}/editor?credentials=1`}
                        className="flex cursor-pointer items-center gap-2"
                      >
                        <KeyRound className="h-4 w-4" />
                        Manage project secrets
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={renameTarget !== null} onOpenChange={(open) => !open && setRenameTarget(null)}>
        <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Rename screen</DialogTitle>
            <DialogDescription>Choose a name shown for this screen in My Apps.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="Screen name"
              maxLength={120}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleRenameSave();
              }}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRenameTarget(null)} disabled={renameSaving}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleRenameSave()} disabled={renameSaving}>
              {renameSaving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
