import { useState } from 'react';
import { ChevronRight, ChevronDown, FileText, Folder, FolderOpen } from 'lucide-react';
import type { FileTreeNode } from '@/lib/editorApi';
import { cn } from '@/lib/utils';

interface FileTreeProps {
  tree: FileTreeNode[];
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
}

export function FileTree({ tree, selectedPath, onSelectFile }: FileTreeProps) {
  return (
    <div className="text-sm select-none overflow-auto h-full py-1">
      {tree.map((node) => (
        <TreeNode key={node.path} node={node} depth={0} selectedPath={selectedPath} onSelectFile={onSelectFile} />
      ))}
    </div>
  );
}

function TreeNode({ node, depth, selectedPath, onSelectFile }: { node: FileTreeNode; depth: number; selectedPath: string | null; onSelectFile: (p: string) => void }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const isDir = node.type === 'directory';
  const isSelected = node.path === selectedPath;

  const handleClick = () => {
    if (isDir) setExpanded(!expanded);
    else onSelectFile(node.path);
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className={cn(
          'flex items-center gap-1.5 w-full text-left px-2 py-1 hover:bg-accent/50 rounded-sm transition-colors text-xs',
          isSelected && 'bg-accent text-accent-foreground',
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {isDir ? (
          <>
            {expanded ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
            {expanded ? <FolderOpen className="h-3.5 w-3.5 shrink-0 text-primary" /> : <Folder className="h-3.5 w-3.5 shrink-0 text-primary" />}
          </>
        ) : (
          <>
            <span className="w-3.5 shrink-0" />
            <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </>
        )}
        <span className="truncate">{node.name}</span>
      </button>
      {isDir && expanded && node.children?.map((child) => (
        <TreeNode key={child.path} node={child} depth={depth + 1} selectedPath={selectedPath} onSelectFile={onSelectFile} />
      ))}
    </div>
  );
}
