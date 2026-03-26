import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Loader2, AlertCircle, Pencil, Code2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchUIScreen, UIScreenData, getPreviewUrl } from '@/lib/api';
import { RollbackModal } from '@/components/RollbackModal';

export default function AppViewPage() {
  const { projectId, screenId } = useParams<{ projectId: string; screenId: string }>();
  const [screen, setScreen] = useState<UIScreenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rollbackOpen, setRollbackOpen] = useState(false);

  useEffect(() => {
    if (!screenId) return;
    setLoading(true);
    setError(null);
    fetchUIScreen(screenId, projectId)
      .then(setScreen)
      .catch((e) => setError(e instanceof Error ? e.message : 'Screen not found'))
      .finally(() => setLoading(false));
  }, [screenId, projectId]);

  const previewUrl = screen?.public_url
    || (screen?.version ? getPreviewUrl(screen.screen_id, screen.version as string) : null);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-2 shrink-0 bg-card/50">
        <Button asChild variant="ghost" size="sm" className="gap-2">
          <Link to="/apps"><ArrowLeft className="h-4 w-4" /> Back</Link>
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-medium truncate">{screen?.screen_name || 'App Preview'}</h2>
        </div>
        {projectId && screenId && (
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link to={`/create?project_id=${projectId}&screen_id=${screenId}`}>
              <Pencil className="h-4 w-4" /> Edit
            </Link>
          </Button>
        )}
        {projectId && screenId && (
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link to={`/apps/${projectId}/${screenId}/editor`}>
              <Code2 className="h-4 w-4" /> Editor
            </Link>
          </Button>
        )}
        {projectId && screenId && (
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setRollbackOpen(true)}>
            <RotateCcw className="h-4 w-4" /> Rollback
          </Button>
        )}
        {previewUrl && (
          <Button variant="ghost" size="sm" className="gap-2" onClick={() => window.open(previewUrl, '_blank')}>
            <ExternalLink className="h-4 w-4" /> Open in New Tab
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 relative">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        {error && (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button asChild variant="outline" size="sm"><Link to="/apps">Back to Apps</Link></Button>
          </div>
        )}
        {!loading && !error && previewUrl && (
          <iframe
            src={previewUrl}
            className="w-full h-full border-0"
            title="App preview"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        )}
        {!loading && !error && !previewUrl && (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <p className="text-sm text-muted-foreground">No preview URL available for this screen.</p>
          </div>
        )}

        {projectId && screenId && (
          <RollbackModal
            open={rollbackOpen}
            onOpenChange={setRollbackOpen}
            projectId={projectId}
            screenId={screenId}
            currentVersion={screen?.version as string | undefined}
            onRollbackComplete={(newUrl, newVer) => {
              setScreen((prev) => prev ? { ...prev, public_url: newUrl, version: newVer } : prev);
            }}
          />
        )}
      </div>
    </div>
  );
}
