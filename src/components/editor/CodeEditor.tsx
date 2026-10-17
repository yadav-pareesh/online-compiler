import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { EditorView } from '@codemirror/view';

interface CodeEditorProps {
  code: string;
  onChange: (value: string) => void;
  onRun?: () => void;
  isDark?: boolean;
  fontSize?: number;
  lineWrapping?: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  onChange,
  onRun,
  isDark = true,
  fontSize = 14,
  lineWrapping = false,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onRun?.();
    }
  };

  const extensions = [
    javascript({ jsx: true, typescript: false }),
    ...(lineWrapping ? [EditorView.lineWrapping] : []),
  ];

  return (
    <div
      className="h-full w-full flex flex-col overflow-hidden text-left"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Code Editor"
    >
      <div className="flex-1 overflow-auto bg-white dark:bg-[#18181b] border-r border-slate-200 dark:border-zinc-800">
        <CodeMirror
          value={code}
          height="100%"
          extensions={extensions}
          theme={isDark ? 'dark' : 'light'}
          onChange={onChange}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightSpecialChars: true,
            history: true,
            foldGutter: true,
            drawSelection: true,
            dropCursor: true,
            allowMultipleSelections: false,
            indentOnInput: true,
            syntaxHighlighting: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            rectangularSelection: true,
            crosshairCursor: true,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
            closeBracketsKeymap: true,
            defaultKeymap: true,
            searchKeymap: true,
            historyKeymap: true,
            foldKeymap: true,
            completionKeymap: true,
            lintKeymap: true,
          }}
          style={{
            fontSize: `${fontSize}px`,
            fontFamily: 'JetBrains Mono, Menlo, Consolas, Monaco, monospace',
            height: '100%',
          }}
        />
      </div>
    </div>
  );
};
