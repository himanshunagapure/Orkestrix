import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const examplePrompts = [
  {
    title: "Dashboard",
    prompt: "Create a modern analytics dashboard with sidebar navigation, charts showing sales data, and a top metrics bar with key performance indicators",
  },
  {
    title: "Login Page",
    prompt: "Design a clean login page with email and password fields, social login buttons for Google and GitHub, and a forgot password link",
  },
  {
    title: "E-commerce",
    prompt: "Build a product listing page with a grid of product cards, filters sidebar, search bar, and pagination controls",
  },
  {
    title: "Settings",
    prompt: "Create a user settings page with tabs for profile, notifications, security, and billing sections",
  },
];

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  isSubmitting: boolean;
}

export function PromptInput({ onSubmit, isSubmitting }: PromptInputProps) {
  const [prompt, setPrompt] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 300)}px`;
    }
  }, [prompt]);

  const handleSubmit = () => {
    if (prompt.trim() && !isSubmitting) {
      onSubmit(prompt.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      handleSubmit();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="w-full max-w-3xl mx-auto"
    >
      {/* Main input card */}
      <div className="glass-card p-1 glow-strong">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe the UI screen you want to generate..."
            disabled={isSubmitting}
            rows={4}
            className={cn(
              "w-full resize-none rounded-lg bg-background p-4 pb-16 text-foreground",
              "placeholder:text-muted-foreground/60",
              "focus:outline-none focus:ring-0",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-all duration-200"
            )}
            aria-label="Prompt input"
          />
          
          {/* Bottom bar inside textarea */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between p-3 bg-gradient-to-t from-background via-background to-transparent">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                ⌘ Enter
              </kbd>
              <span>to generate</span>
            </div>
            
            <Button
              variant="hero"
              size="lg"
              onClick={handleSubmit}
              disabled={!prompt.trim() || isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <Zap className="h-4 w-4 animate-pulse" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Example prompts */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-6"
      >
        <p className="text-sm text-muted-foreground mb-3 text-center">Try an example:</p>
        <div className="flex flex-wrap justify-center gap-2">
          {examplePrompts.map((example) => (
            <button
              key={example.title}
              onClick={() => setPrompt(example.prompt)}
              disabled={isSubmitting}
              className={cn(
                "rounded-full border border-border/50 bg-card/50 px-4 py-2",
                "text-sm text-muted-foreground",
                "hover:bg-card hover:text-foreground hover:border-border",
                "transition-all duration-200",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {example.title}
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
