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

  const {
    status, jobId, prompt, logs, result, error,
    chatMessages, isUpdating,
    submitJob, submitUpdate, reconnect, reset,
  } = jobGeneration;

  useEffect(() => {
    if (initialJobId && status === 'idle') {
      reconnect(initialJobId);
    }
  }, [initialJobId, status, reconnect]);

  useEffect(() => {
    if (jobId && !searchParams.has('job_id')) {
      setSearchParams({ job_id: jobId });
    }
  }, [jobId, searchParams, setSearchParams]);

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

  const isBuilding = status === 'submitting' || status === 'streaming';
  const showBuilder = status === 'idle' && !initialJobId;
  const showProgress = isBuilding || status === 'error';
  const showEvolution = status === 'complete' && result;
  const isSubmitting = status === 'submitting';

  return (
    <div className="flex-1 flex flex-col">
      <AnimatePresence mode="wait">
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
                <PreviewIframe
                  result={result}
                  className="flex-1 rounded-none border-0 border-l-0"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
