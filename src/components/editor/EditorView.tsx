import { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { FileTree } from './FileTree';
import { CodeEditorPane } from './CodeEditorPane';
import { BackendFunctionsList } from './BackendFunctionsList';
import { ViewModeToggle, type ViewMode } from './ViewModeToggle';
import {
  initEditor,
  readEditorFile,
  writeEditorFile,
  getScreenFunctions,
  updateBackendFunction,
  type EditorSession,
  type FileTreeNode,
  type ScreenFunction,
} from '@/lib/editorApi';

interface EditorViewProps {
  projectId: string;
  screenId: string;
  previewUrl?: string;
  /** If provided, this view mode will be the initial mode */
  initialMode?: ViewMode;
}

export function EditorView({ projectId, screenId, previewUrl, initialMode = 'preview' }: EditorViewProps) {
  const [mode, setMode] = useState<ViewMode>(initialMode);
  const [session, setSession] = useState<EditorSession | null>(null);
  const [fileTree, setFileTree] = useState<FileTreeNode[]>([]);
  const [functions, setFunctions] = useState<ScreenFunction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // File editor state
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(false);

  // Backend function editor state
  const [selectedFn, setSelectedFn] = useState<ScreenFunction | null>(null);

  // Init editor session when switching to angular mode
  useEffect(() => {
    if (mode === 'angular' && !session) {
      setLoading(true);
      setError(null);
      initEditor(screenId)
        .then((s) => {
          setSession(s);
          setFileTree(s.file_tree);
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [mode, session, screenId]);

  // Load backend functions when switching to backend mode
  useEffect(() => {
    if (mode === 'backend' && functions.length === 0) {
      setLoading(true);
      setError(null);
      getScreenFunctions(projectId, screenId)
        .then(setFunctions)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [mode, functions.length, projectId, screenId]);

  // Load file content when a file is selected
  useEffect(() => {
    if (!selectedFilePath || !session) return;
    setFileLoading(true);
    readEditorFile(session.session_id, selectedFilePath)
      .then(setFileContent)
      .catch((e) => toast.error(e.message))
      .finally(() => setFileLoading(false));
  }, [selectedFilePath, session]);

  const handleSaveFile = useCallback(async (content: string) => {
    if (!session || !selectedFilePath) return;
    await writeEditorFile(session.session_id, selectedFilePath, content);
    toast.success('File saved');
  }, [session, selectedFilePath]);

  const handleSaveFunction = useCallback(async (sourceCode: string) => {
    if (!selectedFn) return;
    await updateBackendFunction(projectId, selectedFn.function_id, sourceCode);
    toast.success('Function updated');
    // Refresh function in list
    setFunctions((prev) =>
      prev.map((f) => f.function_id === selectedFn.function_id ? { ...f, source_code: sourceCode } : f)
    );
  }, [selectedFn, projectId]);

  return (
    <div className="flex flex-col h-full">
      {/* Mode toggle */}
      <div className="flex items-center px-3 py-2 border-b border-border bg-card/30 shrink-0">
        <ViewModeToggle mode={mode} onChange={setMode} />
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 relative">
        {/* Preview */}
        {mode === 'preview' && (
          previewUrl ? (
            <iframe
              src={previewUrl}
              className="w-full h-full border-0"
              title="Screen preview"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              No preview URL available
            </div>
          )
        )}

        {/* Angular code */}
        {mode === 'angular' && (
          loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <span>{error}</span>
            </div>
          ) : (
            <div className="flex h-full">
              {/* File tree sidebar */}
              <div className="w-56 shrink-0 border-r border-border bg-card/30 overflow-hidden">
                <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold border-b border-border">
                  Files
                </div>
                <FileTree tree={fileTree} selectedPath={selectedFilePath} onSelectFile={setSelectedFilePath} />
              </div>
              {/* Editor */}
              <div className="flex-1 min-w-0">
                {!selectedFilePath && (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                    Select a file to view and edit
                  </div>
                )}
                {selectedFilePath && fileLoading && (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                )}
                {selectedFilePath && !fileLoading && fileContent !== null && (
                  <CodeEditorPane
                    key={selectedFilePath}
                    filePath={selectedFilePath}
                    content={fileContent}
                    onSave={handleSaveFile}
                  />
                )}
              </div>
            </div>
          )
        )}

        {/* Backend functions */}
        {mode === 'backend' && (
          loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <span>{error}</span>
            </div>
          ) : (
            <div className="flex h-full">
              {/* Functions list sidebar */}
              <div className="w-56 shrink-0 border-r border-border bg-card/30 overflow-hidden">
                <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold border-b border-border">
                  Functions
                </div>
                <BackendFunctionsList
                  functions={functions}
                  selectedId={selectedFn?.function_id ?? null}
                  onSelect={setSelectedFn}
                />
              </div>
              {/* Editor */}
              <div className="flex-1 min-w-0">
                {!selectedFn && (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                    Select a function to view and edit
                  </div>
                )}
                {selectedFn && (
                  <CodeEditorPane
                    key={selectedFn.function_id}
                    filePath={`${selectedFn.function_id}.py`}
                    content={selectedFn.source_code}
                    onSave={handleSaveFunction}
                    language="python"
                  />
                )}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
