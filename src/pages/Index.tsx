import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/Header';
import { PromptInput } from '@/components/PromptInput';
import { PromptDisplay } from '@/components/PromptDisplay';
import { LiveLogFeed } from '@/components/LiveLogFeed';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { PreviewIframe } from '@/components/PreviewIframe';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { useJobGeneration } from '@/hooks/useJobGeneration';
import { Sparkles, Layers, Zap, Code2 } from 'lucide-react';

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered",
    description: "Natural language to UI screens",
  },
  {
    icon: Layers,
    title: "Production Ready",
    description: "Clean, maintainable code output",
  },
  {
    icon: Zap,
    title: "Fast Generation",
    description: "Complete screens in minutes",
  },
  {
    icon: Code2,
    title: "Angular Apps",
    description: "Full Angular component generation",
  },
];

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const jobGeneration = useJobGeneration();
  const [initialJobId] = useState(() => searchParams.get('job_id'));

  const {
    status,
    jobId,
    prompt,
    logs,
    result,
    error,
    submitJob,
    reconnect,
    reset,
  } = jobGeneration;

  // Handle URL job_id on mount
  useEffect(() => {
    if (initialJobId && status === 'idle') {
      // Try to reconnect to an existing job
      reconnect(initialJobId);
    }
  }, [initialJobId, status, reconnect]);

  // Update URL when job starts
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
    if (prompt) {
      submitJob(prompt);
    }
  };

  const isBuilding = status === 'submitting' || status === 'streaming';
  const showBuilder = status === 'idle' && !initialJobId;
  const showProgress = isBuilding || status === 'complete' || status === 'error';
  const isSubmitting = status === 'submitting';

  return (
    <div className="min-h-screen bg-background">
      <Header showReset={showProgress} onReset={handleReset} />

      <main className="pt-16">
        <AnimatePresence mode="wait">
          {showBuilder ? (
            <motion.div
              key="builder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative"
            >
              {/* Hero section */}
              <section className="relative overflow-hidden py-20 md:py-32">
                {/* Background pattern */}
                <div className="absolute inset-0 bg-hero-pattern opacity-50" />
                
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />

                {/* Glow effects */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-info/10 rounded-full blur-3xl" />

                <div className="relative container mx-auto px-4">
                  {/* Hero text */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                  >
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                      Build UI Screens with{' '}
                      <span className="gradient-text">AI</span>
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                      Describe your screen in natural language and let AI generate 
                      production-ready Angular components in minutes.
                    </p>
                  </motion.div>

                  {/* Prompt input */}
                  <PromptInput
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                  />

                  {/* Features grid */}
                  <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-20 max-w-4xl mx-auto"
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
                        <p className="text-xs text-muted-foreground">
                          {feature.description}
                        </p>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              </section>
            </motion.div>
          ) : (
            <motion.div
              key="progress"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="container mx-auto px-4 py-8"
            >
              {/* Split view - Prompt left, Progress/Preview right */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left side - Prompt display */}
                <div className="space-y-6">
                  <PromptDisplay prompt={prompt} />
                  
                  {/* Show logs on mobile below prompt */}
                  <div className="lg:hidden">
                    {isBuilding && (
                      <LiveLogFeed logs={logs} className="flex-1" />
                    )}
                  </div>
                </div>

                {/* Right side - Status / Logs / Preview */}
                <div className="space-y-6">
                  {/* Progress indicator */}
                  {isBuilding && (
                    <ProgressIndicator isActive={true} />
                  )}

                  {/* Live logs - desktop */}
                  {isBuilding && (
                    <div className="hidden lg:block">
                      <LiveLogFeed logs={logs} className="flex-1" />
                    </div>
                  )}

                  {/* Error display */}
                  {status === 'error' && error && (
                    <ErrorDisplay
                      error={error}
                      onRetry={handleRetry}
                      onBack={handleReset}
                    />
                  )}

                  {/* Result preview */}
                  {status === 'complete' && result && (
                    <PreviewIframe result={result} />
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-background/50 backdrop-blur-sm py-6 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>AI Screen Builder — Generate production-ready UI screens with natural language</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
