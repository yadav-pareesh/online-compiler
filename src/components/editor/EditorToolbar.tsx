import React from 'react';
import { FileCode, Type, WrapText } from 'lucide-react';

interface EditorToolbarProps {
  code: string;
  fontSize: number;
  onChangeFontSize: (size: number) => void;
  lineWrapping: boolean;
  onToggleLineWrapping: () => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  code,
  fontSize,
  onChangeFontSize,
  lineWrapping,
  onToggleLineWrapping,
}) => {
  const lineCount = code.split('\n').length;
  const charCount = code.length;

  return (
    <div className="h-9 px-3 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 flex items-center justify-between text-xs text-slate-600 dark:text-zinc-400 select-none">
      <div className="flex items-center gap-2">
        <FileCode className="w-3.5 h-3.5 text-amber-500" />
        <span className="font-semibold text-slate-800 dark:text-zinc-200 font-mono">
          main.js
        </span>
        <span className="text-[11px] text-slate-400 dark:text-zinc-500">
          ({lineCount} lines, {charCount} chars)
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Line wrapping toggle */}
        <button
          onClick={onToggleLineWrapping}
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors ${
            lineWrapping
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-medium'
              : 'hover:bg-slate-200/60 dark:hover:bg-zinc-800'
          }`}
          title="Toggle line wrapping"
          aria-label="Toggle editor line wrapping"
        >
          <WrapText className="w-3.5 h-3.5" />
          <span className="text-[11px] hidden sm:inline">Wrap</span>
        </button>

        {/* Font size */}
        <div className="flex items-center gap-1">
          <Type className="w-3.5 h-3.5" />
          <select
            value={fontSize}
            onChange={(e) => onChangeFontSize(Number(e.target.value))}
            className="bg-transparent text-xs text-slate-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
            aria-label="Select editor font size"
          >
            <option value={12}>12px</option>
            <option value={14}>14px</option>
            <option value={16}>16px</option>
            <option value={18}>18px</option>
          </select>
        </div>
      </div>
    </div>
  );
};
