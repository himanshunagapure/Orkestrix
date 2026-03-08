import { useState, useRef, useCallback } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Save, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CodeEditorPaneProps {
  filePath: string;
  content: string;
  onSave: (content: string) => Promise<void>;
  language?: string;
  className?: string;
  /** When set, show Rebuild button next to Save (e.g. Angular mode). */
  onRebuild?: () => void;
  rebuilding?: boolean;
}

function inferLanguage(path: string): string {
  if (path.endsWith('.ts')) return 'typescript';
  if (path.endsWith('.js')) return 'javascript';
  if (path.endsWith('.html')) return 'html';
  if (path.endsWith('.scss') || path.endsWith('.css')) return 'scss';
  if (path.endsWith('.json')) return 'json';
  if (path.endsWith('.yaml') || path.endsWith('.yml')) return 'yaml';
  return 'plaintext';
}

export function CodeEditorPane({ filePath, content, onSave, language, className, onRebuild, rebuilding }: CodeEditorPaneProps) {
  const [currentContent, setCurrentContent] = useState(content);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const editorRef = useRef<any>(null);
  const isDirty = currentContent !== content;

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaved(false);
    try {
      await onSave(currentContent);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // toast is handled by parent
    } finally {
      setSaving(false);
    }
  }, [currentContent, onSave]);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-card/50 shrink-0">
        <span className="text-xs text-muted-foreground font-mono truncate">{filePath}</span>
        <div className="flex items-center gap-2">
          {isDirty && <span className="text-[10px] text-warning">Unsaved</span>}
          {saved && <span className="text-[10px] text-success">Saved</span>}
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" disabled={saving || !isDirty} onClick={handleSave}>
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            Save
          </Button>
          {onRebuild != null && (
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" disabled={rebuilding} onClick={onRebuild}>
              {rebuilding ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              Rebuild
            </Button>
          )}
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language={language ?? inferLanguage(filePath)}
          value={currentContent}
          theme="vs-dark"
          onChange={(v) => setCurrentContent(v ?? '')}
          onMount={handleEditorMount}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
            tabSize: 2,
          }}
        />
      </div>
    </div>
  );
}
