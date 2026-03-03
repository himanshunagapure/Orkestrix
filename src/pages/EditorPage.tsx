import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchUIScreen, UIScreenData, getPreviewUrl } from '@/lib/api';
import { EditorView } from '@/components/editor/EditorView';
import type { ViewMode } from '@/components/editor/ViewModeToggle';
import { idForUpdateRequest } from '@/lib/api';

const subscriberId = import.meta.env.VITE_SUBSCRIBER_ID || 'default-subscriber';

export default function EditorPage() {
  const { projectId, screenId } = useParams<{ projectId: string; screenId: string }>();
  const [searchParams] = useSearchParams();
  const [screen, setScreen] = useState<UIScreenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initialTab = (searchParams.get('tab') as ViewMode) || 'angular';

  useEffect(() => {
    if (!screenId) return;
    setLoading(true);
    setError(null);
    fetchUIScreen(screenId, projectId)
      .then(setScreen)
      .catch((e) => setError(e instanceof Error ? e.message : 'Screen not found'))
      .finally(() => setLoading(false));
  }, [screenId, projectId]);

  const previewUrl =
    screen?.public_url || (screen?.version ? getPreviewUrl(screen.screen_id, screen.version as string) : undefined);

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
      </div>

      {/* Editor view fills remaining space */}
      <div className="flex-1 min-h-0">
        <EditorView
          projectId={formattedProjectId}
          screenId={screen.screen_id}
          previewUrl={previewUrl}
          initialMode={initialTab}
        />
      </div>
    </div>
  );
}
