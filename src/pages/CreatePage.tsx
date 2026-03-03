import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PromptInput } from '@/components/PromptInput';
import { LiveLogFeed } from '@/components/LiveLogFeed';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { PreviewIframe } from '@/components/PreviewIframe';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { ChatPanel } from '@/components/ChatPanel';
import { PromptDisplay } from '@/components/PromptDisplay';
import { useJobGeneration } from '@/hooks/useJobGeneration';
import { fetchUIScreen, screenDataToCompletePayload, saveScreen } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { EditorView } from '@/components/editor/EditorView';
import { ViewModeToggle, type ViewMode } from '@/components/editor/ViewModeToggle';
import { Sparkles, Layers, Zap, Code2 } from 'lucide-react';

const features = [
  { icon: Sparkles, title: "AI-Powered", description: "Natural language to UI screens" },
  { icon: Layers, title: "Production Ready", description: "Clean, maintainable code output" },
  { icon: Zap, title: "Fast Generation", description: "Complete screens in minutes" },
  { icon: Code2, title: "Angular Apps", description: "Full Angular component generation" },
];

export default function CreatePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const jobGeneration = useJobGeneration();
  const [initialJobId] = useState(() => searchParams.get('job_id'));
  const editProjectId = searchParams.get('project_id');
  const editScreenId = searchParams.get('screen_id');
  const [editLoadError, setEditLoadError] = useState<string | null>(null);
  const [editLoaded, setEditLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('preview');

  const {
    status, jobId, prompt, logs, result, error,
    chatMessages, isUpdating,
    submitJob, submitUpdate, reconnect, reset, loadForEdit,
  } = jobGeneration;

  useEffect(() => {
    if (initialJobId && status === 'idle') {
      reconnect(initialJobId);
    }
  }, [initialJobId, status, reconnect]);

  // Reset edit state when edit params change
  useEffect(() => {
    setEditLoaded(false);
    setEditLoadError(null);
  }, [editProjectId, editScreenId]);

  // Load existing screen for editing when project_id & screen_id are in URL
  useEffect(() => {
    if (!editProjectId || !editScreenId || editLoaded || editLoadError) return;
    setEditLoadError(null);
    fetchUIScreen(editScreenId, editProjectId)
      .then((data) => {
        const payload = screenDataToCompletePayload(data);
        loadForEdit(editProjectId, editScreenId, payload);
        setEditLoaded(true);
      })
      .catch((e) => setEditLoadError(e instanceof Error ? e.message : 'Failed to load screen'));
  }, [editProjectId, editScreenId, editLoaded, editLoadError, loadForEdit]);

  useEffect(() => {
    if (jobId && !searchParams.has('job_id')) {
      setSearchParams({ job_id: jobId });
    }
  }, [jobId, searchParams, setSearchParams]);

  // Reset save state when the current screen/result changes
  useEffect(() => {
    if (result) {
      setSaveSuccess(false);
      setSaveError(null);
    }
  }, [result?.screen_id, result?.project_id]);

  const handleSubmit = async (promptText: string) => {
    await submitJob(promptText);
  };

  const handleReset = () => {
    reset();
    setSearchParams({});
  };

  const handleRetry = () => {
    if (prompt) submitJob(prompt);
  };

  const handleSave = async () => {
    if (!result) return;
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    const ok = await saveScreen({ screen_id: result.screen_id, project_id: result.project_id });
    setIsSaving(false);
    if (ok.success) setSaveSuccess(true);
    else setSaveError(ok.error ?? 'Failed to save');
  };

  const isBuilding = status === 'submitting' || status === 'streaming';
  const isEditMode = Boolean(editProjectId && editScreenId);
  const showBuilder = status === 'idle' && !initialJobId && !isEditMode;
  const showProgress = isBuilding || status === 'error';
  const showEvolution = status === 'complete' && result;
  const showEditError = isEditMode && editLoadError;
  const showEditLoading = isEditMode && !editLoaded && !editLoadError;
  const isSubmitting = status === 'submitting';

  return (
    <div className="flex-1 flex flex-col">
      <AnimatePresence mode="wait">
        {showEditLoading && (
          <motion.div
            key="edit-loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex items-center justify-center"
          >
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Sparkles className="h-8 w-8 animate-pulse" />
              <p className="text-sm">Loading screen for editing…</p>
            </div>
          </motion.div>
        )}
        {showEditError && (
          <motion.div
            key="edit-error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex items-center justify-center p-6"
          >
            <div className="flex flex-col items-center gap-4 text-center max-w-md">
              <p className="text-sm text-destructive">{editLoadError}</p>
              <Button variant="outline" size="sm" onClick={() => setSearchParams({})}>
                Back to Create
              </Button>
            </div>
          </motion.div>
        )}
        {showBuilder && (
          <motion.div
            key="builder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative flex-1"
          >
            <section className="relative overflow-hidden py-16 md:py-24">
              <div className="absolute inset-0 bg-hero-pattern opacity-50" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
              <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-info/10 rounded-full blur-3xl" />

              <div className="relative container mx-auto px-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center mb-12"
                >
                  <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                    Build UI Screens with <span className="gradient-text">AI</span>
                  </h1>
                  <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                    Describe your screen in natural language and let AI generate
                    production-ready Angular components in minutes.
                  </p>
                </motion.div>

                <PromptInput onSubmit={handleSubmit} isSubmitting={isSubmitting} />

                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-16 max-w-4xl mx-auto"
                >
                  {features.map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      className="glass-card p-4 md:p-6 text-center"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mx-auto mb-3">
                        <feature.icon className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-medium mb-1">{feature.title}</h3>
                      <p className="text-xs text-muted-foreground">{feature.description}</p>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </section>
          </motion.div>
        )}

        {showProgress && (
          <motion.div
            key="progress"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="container mx-auto px-4 py-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <PromptDisplay prompt={prompt} />
                <div className="lg:hidden">
                  {isBuilding && <LiveLogFeed logs={logs} className="flex-1" />}
                </div>
              </div>
              <div className="space-y-6">
                {isBuilding && <ProgressIndicator isActive={true} />}
                {isBuilding && (
                  <div className="hidden lg:block">
                    <LiveLogFeed logs={logs} className="flex-1" />
                  </div>
                )}
                {status === 'error' && error && (
                  <ErrorDisplay error={error} onRetry={handleRetry} onBack={handleReset} />
                )}
              </div>
            </div>
          </motion.div>
        )}

        {showEvolution && (
          <motion.div
            key="evolution"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            <div className="flex-1 flex flex-col lg:flex-row min-h-0">
              <div className="lg:w-[35%] lg:min-w-[320px] lg:max-w-[480px] border-r border-border flex flex-col h-[50vh] lg:h-[calc(100vh-3rem)]">
                <ChatPanel
                  messages={chatMessages}
                  isUpdating={isUpdating}
                  onSendMessage={submitUpdate}
                  originalPrompt={prompt}
                  className="flex-1 rounded-none border-0"
                />
              </div>
              <div className="flex-1 flex flex-col h-[50vh] lg:h-[calc(100vh-3rem)]">
                {viewMode === 'preview' ? (
                  <div className="flex flex-col h-full">
                    <div className="flex items-center px-3 py-2 border-b border-border bg-card/30 shrink-0">
                      <ViewModeToggle mode={viewMode} onChange={setViewMode} />
                    </div>
                    <div className="flex-1 min-h-0">
                      <PreviewIframe
                        result={result}
                        className="flex-1 rounded-none border-0 border-l-0"
                        onSave={handleSave}
                        isSaving={isSaving}
                        saveSuccess={saveSuccess}
                        saveError={saveError}
                      />
                    </div>
                  </div>
                ) : (
                  <EditorView
                    projectId={result.project_id}
                    screenId={result.screen_id}
                    previewUrl={result.public_url}
                    initialMode={viewMode}
                  />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
