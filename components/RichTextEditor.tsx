'use client';

import React, { useEffect, useRef, useState } from 'react';

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
};

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Enter text…',
  minHeight = 150,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    justifyLeft: false,
    justifyCenter: false,
    justifyRight: false,
    justifyFull: false,
    insertUnorderedList: false,
    insertOrderedList: false,
  });
  const [currentBlock, setCurrentBlock] = useState('p');

  // Sync value into editor only when content changes externally
  useEffect(() => {
    if (editorRef.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value]);

  const updateFormatStates = () => {
    if (typeof document === 'undefined') return;
    try {
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strikeThrough: document.queryCommandState('strikeThrough'),
        justifyLeft: document.queryCommandState('justifyLeft'),
        justifyCenter: document.queryCommandState('justifyCenter'),
        justifyRight: document.queryCommandState('justifyRight'),
        justifyFull: document.queryCommandState('justifyFull'),
        insertUnorderedList: document.queryCommandState('insertUnorderedList'),
        insertOrderedList: document.queryCommandState('insertOrderedList'),
      });

      const blockVal = document.queryCommandValue('formatBlock');
      if (blockVal) {
        setCurrentBlock(blockVal.toLowerCase().replace(/[<>]/g, ''));
      }
    } catch {}
  };

  const exec = (command: string, val: string | undefined = undefined) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, val);
    updateFormatStates();
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      onChange(html);
    }
    updateFormatStates();
  };

  const handleBlockChange = (tag: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    if (tag === 'p') {
      document.execCommand('formatBlock', false, '<p>');
    } else if (tag === 'h1' || tag === 'h2' || tag === 'h3') {
      document.execCommand('formatBlock', false, `<${tag}>`);
    } else if (tag === 'small') {
      document.execCommand('fontSize', false, '1');
    }
    setCurrentBlock(tag);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const btnStyle = (active: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 28,
    height: 28,
    padding: '0 6px',
    borderRadius: 6,
    border: '1px solid',
    borderColor: active ? '#FFD700' : 'rgba(0,0,0,0.1)',
    background: active ? '#FFF9D2' : '#FFFFFF',
    color: active ? '#0A0A0F' : '#374151',
    fontWeight: active ? 700 : 500,
    fontSize: 12,
    fontFamily: 'Inter, sans-serif',
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'all 140ms ease',
  });

  return (
    <div
      style={{
        border: '1px solid rgba(0,0,0,0.14)',
        borderRadius: 10,
        overflow: 'hidden',
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Toolbar ────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 4,
          padding: '6px 8px',
          background: '#F9FAFB',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
        }}
      >
        {/* Block / Font Size selector */}
        <select
          value={currentBlock}
          onChange={(e) => handleBlockChange(e.target.value)}
          style={{
            height: 28,
            padding: '0 8px',
            borderRadius: 6,
            border: '1px solid rgba(0,0,0,0.12)',
            background: '#fff',
            fontSize: 12,
            fontFamily: 'Inter, sans-serif',
            color: '#111827',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="p">Normal (14px)</option>
          <option value="h1">Heading 1 (24px)</option>
          <option value="h2">Heading 2 (20px)</option>
          <option value="h3">Heading 3 (17px)</option>
          <option value="small">Small text (12px)</option>
        </select>

        <div style={{ width: 1, height: 18, background: 'rgba(0,0,0,0.12)', margin: '0 2px' }} />

        {/* Font styling: Bold, Italic, Underline, Strikethrough */}
        <button
          type="button"
          title="Bold"
          style={btnStyle(activeFormats.bold)}
          onMouseDown={(e) => { e.preventDefault(); exec('bold'); }}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          title="Italic"
          style={btnStyle(activeFormats.italic)}
          onMouseDown={(e) => { e.preventDefault(); exec('italic'); }}
        >
          <em>I</em>
        </button>
        <button
          type="button"
          title="Underline"
          style={btnStyle(activeFormats.underline)}
          onMouseDown={(e) => { e.preventDefault(); exec('underline'); }}
        >
          <u>U</u>
        </button>
        <button
          type="button"
          title="Strikethrough"
          style={btnStyle(activeFormats.strikeThrough)}
          onMouseDown={(e) => { e.preventDefault(); exec('strikeThrough'); }}
        >
          <s>S</s>
        </button>

        <div style={{ width: 1, height: 18, background: 'rgba(0,0,0,0.12)', margin: '0 2px' }} />

        {/* Text Orientation / Alignment */}
        <button
          type="button"
          title="Align Left"
          style={btnStyle(activeFormats.justifyLeft)}
          onMouseDown={(e) => { e.preventDefault(); exec('justifyLeft'); }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="17" y1="10" x2="3" y2="10" />
            <line x1="21" y1="6" x2="3" y2="6" />
            <line x1="21" y1="14" x2="3" y2="14" />
            <line x1="17" y1="18" x2="3" y2="18" />
          </svg>
        </button>
        <button
          type="button"
          title="Align Center"
          style={btnStyle(activeFormats.justifyCenter)}
          onMouseDown={(e) => { e.preventDefault(); exec('justifyCenter'); }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="10" x2="6" y2="10" />
            <line x1="21" y1="6" x2="3" y2="6" />
            <line x1="21" y1="14" x2="3" y2="14" />
            <line x1="18" y1="18" x2="6" y2="18" />
          </svg>
        </button>
        <button
          type="button"
          title="Align Right"
          style={btnStyle(activeFormats.justifyRight)}
          onMouseDown={(e) => { e.preventDefault(); exec('justifyRight'); }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="21" y1="10" x2="7" y2="10" />
            <line x1="21" y1="6" x2="3" y2="6" />
            <line x1="21" y1="14" x2="3" y2="14" />
            <line x1="21" y1="18" x2="7" y2="18" />
          </svg>
        </button>
        <button
          type="button"
          title="Justify"
          style={btnStyle(activeFormats.justifyFull)}
          onMouseDown={(e) => { e.preventDefault(); exec('justifyFull'); }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="21" y1="10" x2="3" y2="10" />
            <line x1="21" y1="6" x2="3" y2="6" />
            <line x1="21" y1="14" x2="3" y2="14" />
            <line x1="21" y1="18" x2="3" y2="18" />
          </svg>
        </button>

        <div style={{ width: 1, height: 18, background: 'rgba(0,0,0,0.12)', margin: '0 2px' }} />

        {/* Lists */}
        <button
          type="button"
          title="Bullet List"
          style={btnStyle(activeFormats.insertUnorderedList)}
          onMouseDown={(e) => { e.preventDefault(); exec('insertUnorderedList'); }}
        >
          • List
        </button>
        <button
          type="button"
          title="Numbered List"
          style={btnStyle(activeFormats.insertOrderedList)}
          onMouseDown={(e) => { e.preventDefault(); exec('insertOrderedList'); }}
        >
          1. List
        </button>

        <div style={{ width: 1, height: 18, background: 'rgba(0,0,0,0.12)', margin: '0 2px' }} />

        {/* Colors */}
        <button
          type="button"
          title="Gold accent"
          style={{ ...btnStyle(false), color: '#D4AF37' }}
          onMouseDown={(e) => { e.preventDefault(); exec('foreColor', '#D4AF37'); }}
        >
          ● Gold
        </button>
        <button
          type="button"
          title="Dark text"
          style={{ ...btnStyle(false), color: '#0A0A0F' }}
          onMouseDown={(e) => { e.preventDefault(); exec('foreColor', '#0A0A0F'); }}
        >
          ● Dark
        </button>

        <div style={{ width: 1, height: 18, background: 'rgba(0,0,0,0.12)', margin: '0 2px' }} />

        {/* Clear formatting */}
        <button
          type="button"
          title="Clear formatting"
          style={btnStyle(false)}
          onMouseDown={(e) => { e.preventDefault(); exec('removeFormat'); }}
        >
          ✕ Clear
        </button>
      </div>

      {/* ── Editor contentEditable Area ─────────────────────────── */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyUp={updateFormatStates}
        onMouseUp={updateFormatStates}
        onBlur={handleInput}
        data-placeholder={placeholder}
        style={{
          padding: '12px 14px',
          minHeight,
          outline: 'none',
          fontFamily: 'Inter, sans-serif',
          fontSize: 14,
          lineHeight: 1.7,
          color: '#111827',
          background: '#fff',
          overflowY: 'auto',
        }}
      />

      <style jsx>{`
        div[contentEditable]:empty:before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          pointer-events: none;
        }
        div[contentEditable] h1 {
          font-size: 24px;
          font-weight: 700;
          margin: 12px 0 8px;
          line-height: 1.25;
        }
        div[contentEditable] h2 {
          font-size: 20px;
          font-weight: 700;
          margin: 10px 0 6px;
          line-height: 1.3;
        }
        div[contentEditable] h3 {
          font-size: 17px;
          font-weight: 600;
          margin: 8px 0 4px;
          line-height: 1.35;
        }
        div[contentEditable] p {
          margin: 0 0 8px;
        }
        div[contentEditable] ul, div[contentEditable] ol {
          margin: 4px 0 8px 24px;
          padding: 0;
        }
      `}</style>
    </div>
  );
}
