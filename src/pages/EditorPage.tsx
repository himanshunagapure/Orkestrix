import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle, ExternalLink, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchUIScreen, UIScreenData, getScreenPublicUrl, getScreenVersion, idForUpdateRequest } from '@/lib/api';
import { EditorView } from '@/components/editor/EditorView';
import type { ViewMode } from '@/components/editor/ViewModeToggle';
import { ProjectCredentialsSheet } from '@/components/ProjectCredentialsSheet';
import { RollbackModal } from '@/components/RollbackModal';


const subscriberId = import.meta.env.VITE_SUBSCRIBER_ID || 'default-subscriber';

export default function EditorPage() {
  const { projectId, screenId } = useParams<{ projectId: string; screenId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [credentialsOpen, setCredentialsOpen] = useState(false);
  const [rollbackOpen, setRollbackOpen] = useState(false);
  const [screen, setScreen] = useState<UIScreenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editorKey, setEditorKey] = useState(0);

  const initialTab = (searchParams.get('tab') as ViewMode) || 'angular';

  const [editorPreviewUrl, setEditorPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get('credentials') !== '1') return;
    setCredentialsOpen(true);
    const next = new URLSearchParams(searchParams);
    next.delete('credentials');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!screenId) return;
    setLoading(true);
    setError(null);
    setEditorPreviewUrl(null);
    fetchUIScreen(screenId, projectId)
      .then(setScreen)
      .catch((e) => setError(e instanceof Error ? e.message : 'Screen not found'))
      .finally(() => setLoading(false));
  }, [screenId, projectId]);

  const defaultPreviewUrl = screen ? getScreenPublicUrl(screen) : undefined;
  const previewUrl = editorPreviewUrl ?? defaultPreviewUrl;

  const formattedProjectId = projectId ? idForUpdateRequest(projectId, subscriberId) : '';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !screen) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">{error || 'Screen not found'}</p>
        <Button asChild variant="outline" size="sm">
          <Link to="/apps">Back to Apps</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-2 shrink-0 bg-card/50">
        <Button asChild variant="ghost" size="sm" className="gap-2">
          <Link to={`/apps/${projectId}/${screenId}`}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-medium truncate">{screen.screen_name || 'Editor'}</h2>
        </div>
        {previewUrl && (
          <Button variant="ghost" size="sm" className="gap-2" onClick={() => window.open(previewUrl, '_blank')}>
            <ExternalLink className="h-4 w-4" /> Open Preview
          </Button>
        )}
        {projectId && screenId && (
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setRollbackOpen(true)}>
            <RotateCcw className="h-4 w-4" /> Rollback
          </Button>
        )}
      </div>

      {/* Editor view fills remaining space */}
      <div className="flex-1 min-h-0">
        <EditorView
          key={editorKey}
          projectId={formattedProjectId}
          screenId={screen.screen_id}
          previewUrl={previewUrl}
          initialMode={initialTab}
          onPreviewUrlChange={setEditorPreviewUrl}
          onOpenCredentials={() => setCredentialsOpen(true)}
        />
      </div>

      {projectId && screenId && (
        <RollbackModal
          open={rollbackOpen}
          onOpenChange={setRollbackOpen}
          projectId={projectId}
          screenId={screenId}
          currentVersion={getScreenVersion(screen)}
          onRollbackComplete={(refreshedScreen) => {
            setScreen(refreshedScreen);
            setEditorPreviewUrl(null);
            // Force editor to re-init session with new version files
            setEditorKey((k) => k + 1);
          }}
        />
      )}

      {formattedProjectId && (
        <ProjectCredentialsSheet
          open={credentialsOpen}
          onOpenChange={setCredentialsOpen}
          projectId={formattedProjectId}
        />
      )}
    </div>
  );
}
