import { BookOpen, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DocsPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documentation</h1>
          <p className="text-sm text-muted-foreground">Learn how to use AI Screen Builder</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="glass-card p-6">
          <h2 className="font-semibold mb-2">Getting Started</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Describe your UI screen in natural language using the Create App page. The AI will generate
            a full Angular application that you can preview, iterate on, and deploy.
          </p>
        </div>

        <div className="glass-card p-6">
          <h2 className="font-semibold mb-2">How Credits Work</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Each generation consumes credits based on complexity. Check your remaining credits in the
            sidebar. If a generation requires more credits than available, you'll see a detailed message.
          </p>
        </div>

        <div className="glass-card p-6">
          <h2 className="font-semibold mb-2">Iterating on Screens</h2>
          <p className="text-sm text-muted-foreground mb-4">
            After generating a screen, use the chat panel to refine it. Describe changes like
            "Add a dark mode toggle" or "Make the layout responsive" and the AI will update the screen.
          </p>
        </div>
      </div>
    </div>
  );
}
