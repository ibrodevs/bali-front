'use client';

import React, { useEffect, useRef, useState } from 'react';

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
};

const FONT_FAMILIES = [
  { label: 'Inter (Default)', value: 'Inter, sans-serif' },
  { label: 'Sora (Display)', value: 'Sora, sans-serif' },
  { label: 'Arial (Sans)', value: 'Arial, sans-serif' },
  { label: 'Georgia (Serif)', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { label: 'Courier New (Mono)', value: '"Courier New", Courier, monospace' },
  { label: 'Trebuchet MS', value: '"Trebuchet MS", sans-serif' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
];

const FONT_SIZES = [
  { label: '11px (Tiny)', value: '11' },
  { label: '12px (Small)', value: '12' },
  { label: '14px (Normal)', value: '14' },
  { label: '16px (Medium)', value: '16' },
  { label: '18px (Large)', value: '18' },
  { label: '20px (H4 / Subtitle)', value: '20' },
  { label: '24px (H3)', value: '24' },
  { label: '28px (H2)', value: '28' },
  { label: '32px (H1)', value: '32' },
  { label: '36px (Display)', value: '36' },
  { label: '48px (Hero)', value: '48' },
];

function isContentEmpty(html: string): boolean {
  if (!html) return true;
  const stripped = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  return stripped.length === 0;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Enter text…',
  minHeight = 160,
}: RichTextEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const lastEmittedRef = useRef<string>(value || '');

  const [hasContent, setHasContent] = useState(() => !isContentEmpty(value));
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
  const [currentFont, setCurrentFont] = useState('Inter, sans-serif');
  const [currentFontSize, setCurrentFontSize] = useState('14');
  const [editorHeight, setEditorHeight] = useState<number>(minHeight);
  const [isCodeView, setIsCodeView] = useState(false);
  const [wordCount, setWordCount] = useState({ words: 0, chars: 0 });

  const computeCounts = (text: string) => {
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const chars = trimmed.length;
    setWordCount({ words, chars });
  };

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
        const clean = blockVal.toLowerCase().replace(/[<>]/g, '');
        if (['p', 'h1', 'h2', 'h3', 'blockquote'].includes(clean)) {
          setCurrentBlock(clean);
        }
      }
    } catch {}
  };

  // Mount native contentEditable element.
  // Using a native DOM element completely decouples rich text editing from React's
  // virtual DOM reconciliation, guaranteeing 100% reliable native typing in all browsers.
  useEffect(() => {
    if (!containerRef.current) return;

    const el = document.createElement('div');
    el.contentEditable = 'true';
    el.spellcheck = true;
    el.style.width = '100%';
    el.style.minHeight = `${minHeight}px`;
    el.style.height = editorHeight ? `${editorHeight}px` : 'auto';
    el.style.padding = '14px 16px';
    el.style.outline = 'none';
    el.style.fontFamily = 'Inter, sans-serif';
    el.style.fontSize = '14px';
    el.style.lineHeight = '1.75';
    el.style.color = '#111827';
    el.style.background = 'transparent';
    el.style.overflowY = 'auto';
    el.style.boxSizing = 'border-box';
    el.style.cursor = 'text';

    const initial = value || '<p><br></p>';
    el.innerHTML = initial;
    editorRef.current = el;
    containerRef.current.appendChild(el);
    computeCounts(el.innerText || '');

    const handleInput = () => {
      const html = el.innerHTML;
      const empty = isContentEmpty(html);
      setHasContent(!empty);
      const emitted = empty ? '' : html;
      lastEmittedRef.current = emitted;
      onChange(emitted);
      computeCounts(el.innerText || '');
      updateFormatStates();
    };

    const handleKeyUp = () => {
      updateFormatStates();
    };

    const handleMouseUp = () => {
      updateFormatStates();
    };

    el.addEventListener('input', handleInput);
    el.addEventListener('keyup', handleKeyUp);
    el.addEventListener('mouseup', handleMouseUp);

    return () => {
      el.removeEventListener('input', handleInput);
      el.removeEventListener('keyup', handleKeyUp);
      el.removeEventListener('mouseup', handleMouseUp);
      if (containerRef.current && containerRef.current.contains(el)) {
        containerRef.current.removeChild(el);
      }
      editorRef.current = null;
    };
  }, []);

  // Sync external changes (e.g. switching articles, form reset) into editor
  useEffect(() => {
    if (editorRef.current && value !== lastEmittedRef.current) {
      const currentHtml = editorRef.current.innerHTML;
      const normalizedCurrent = isContentEmpty(currentHtml) ? '' : currentHtml;
      const normalizedNext = isContentEmpty(value) ? '' : value;

      if (normalizedCurrent !== normalizedNext) {
        editorRef.current.innerHTML = normalizedNext || '<p><br></p>';
        lastEmittedRef.current = normalizedNext;
        setHasContent(!isContentEmpty(normalizedNext));
        computeCounts(editorRef.current.innerText || '');
      }
    }
  }, [value]);

  const exec = (command: string, val: string | undefined = undefined) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, val);
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const empty = isContentEmpty(html);
      setHasContent(!empty);
      const emitted = empty ? '' : html;
      lastEmittedRef.current = emitted;
      onChange(emitted);
      computeCounts(editorRef.current.innerText || '');
    }
    updateFormatStates();
  };

  const handleBlockChange = (tag: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    if (tag === 'p') {
      document.execCommand('formatBlock', false, '<p>');
    } else if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'blockquote') {
      document.execCommand('formatBlock', false, `<${tag}>`);
    }
    setCurrentBlock(tag);
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const empty = isContentEmpty(html);
      setHasContent(!empty);
      const emitted = empty ? '' : html;
      lastEmittedRef.current = emitted;
      onChange(emitted);
      computeCounts(editorRef.current.innerText || '');
    }
  };

  const applyFontFamily = (fontFamilyValue: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand('fontName', false, fontFamilyValue);

    // Replace any legacy <font face="..."> with clean <span style="font-family: ...">
    const fonts = editorRef.current.querySelectorAll('font[face]');
    fonts.forEach((f) => {
      const span = document.createElement('span');
      span.style.fontFamily = fontFamilyValue;
      span.innerHTML = f.innerHTML;
      f.parentNode?.replaceChild(span, f);
    });

    const html = editorRef.current.innerHTML;
    const empty = isContentEmpty(html);
    setHasContent(!empty);
    const emitted = empty ? '' : html;
    lastEmittedRef.current = emitted;
    onChange(emitted);
    setCurrentFont(fontFamilyValue);
    updateFormatStates();
  };

  const applyFontSize = (sizePx: string | number) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const sel = window.getSelection();

    if (sel && !sel.isCollapsed && sel.rangeCount > 0) {
      document.execCommand('fontSize', false, '7');
      const fonts = editorRef.current.querySelectorAll('font[size="7"]');
      fonts.forEach((f) => {
        const span = document.createElement('span');
        span.style.fontSize = `${sizePx}px`;
        span.innerHTML = f.innerHTML;
        f.parentNode?.replaceChild(span, f);
      });
    } else {
      editorRef.current.style.fontSize = `${sizePx}px`;
    }

    const html = editorRef.current.innerHTML;
    const empty = isContentEmpty(html);
    setHasContent(!empty);
    const emitted = empty ? '' : html;
    lastEmittedRef.current = emitted;
    onChange(emitted);
    setCurrentFontSize(String(sizePx));
    updateFormatStates();
  };

  const stepFontSize = (delta: number) => {
    const current = parseInt(currentFontSize, 10) || 14;
    const next = Math.max(10, Math.min(72, current + delta));
    applyFontSize(next);
  };

  const toggleCodeView = () => {
    if (isCodeView) {
      setIsCodeView(false);
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = value || '<p><br></p>';
          lastEmittedRef.current = value || '';
          setHasContent(!isContentEmpty(value));
          computeCounts(editorRef.current.innerText || '');
        }
      }, 0);
    } else {
      setIsCodeView(true);
    }
  };

  const handleHeightPreset = (h: number) => {
    setEditorHeight(h);
    if (editorRef.current) {
      editorRef.current.style.height = `${h}px`;
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
    transition: 'all 120ms ease',
  });

  const selectStyle: React.CSSProperties = {
    height: 28,
    padding: '0 6px',
    borderRadius: 6,
    border: '1px solid rgba(0,0,0,0.12)',
    background: '#fff',
    fontSize: 12,
    fontFamily: 'Inter, sans-serif',
    color: '#111827',
    cursor: 'pointer',
    outline: 'none',
  };

  const divider = (
    <div style={{ width: 1, height: 18, background: 'rgba(0,0,0,0.12)', margin: '0 2px' }} />
  );

  return (
    <div
      style={{
        border: '1px solid rgba(0,0,0,0.14)',
        borderRadius: 10,
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {/* ── Toolbar ────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 5,
          padding: '6px 8px',
          background: '#F9FAFB',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
        }}
      >
        {/* Paragraph / Heading block */}
        <select
          value={currentBlock}
          onChange={(e) => handleBlockChange(e.target.value)}
          style={selectStyle}
          disabled={isCodeView}
          title="Format Block"
        >
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="blockquote">Quote</option>
        </select>

        {divider}

        {/* Font Family (Шрифт) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, paddingLeft: 2 }}>Font:</span>
          <select
            value={currentFont}
            onChange={(e) => applyFontFamily(e.target.value)}
            style={{ ...selectStyle, maxWidth: 130 }}
            disabled={isCodeView}
            title="Font Family (Шрифт)"
          >
            {FONT_FAMILIES.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>

        {divider}

        {/* Font Size (Размер шрифта) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, paddingLeft: 2 }}>Size:</span>
          <select
            value={currentFontSize}
            onChange={(e) => applyFontSize(e.target.value)}
            style={{ ...selectStyle, width: 68 }}
            disabled={isCodeView}
            title="Font Size (Размер шрифта)"
          >
            {FONT_SIZES.map((s) => (
              <option key={s.value} value={s.value}>{s.value}px</option>
            ))}
          </select>
          <button
            type="button"
            title="Decrease font size (-2px)"
            style={{ ...btnStyle(false), minWidth: 22, padding: '0 4px', fontSize: 11 }}
            disabled={isCodeView}
            onMouseDown={(e) => { e.preventDefault(); stepFontSize(-2); }}
          >
            A-
          </button>
          <button
            type="button"
            title="Increase font size (+2px)"
            style={{ ...btnStyle(false), minWidth: 22, padding: '0 4px', fontSize: 11 }}
            disabled={isCodeView}
            onMouseDown={(e) => { e.preventDefault(); stepFontSize(2); }}
          >
            A+
          </button>
        </div>

        {divider}

        {/* Inline styles: Bold, Italic, Underline, Strikethrough */}
        <button
          type="button"
          title="Bold (Ctrl+B)"
          style={btnStyle(activeFormats.bold)}
          disabled={isCodeView}
          onMouseDown={(e) => { e.preventDefault(); exec('bold'); }}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          title="Italic (Ctrl+I)"
          style={btnStyle(activeFormats.italic)}
          disabled={isCodeView}
          onMouseDown={(e) => { e.preventDefault(); exec('italic'); }}
        >
          <em>I</em>
        </button>
        <button
          type="button"
          title="Underline (Ctrl+U)"
          style={btnStyle(activeFormats.underline)}
          disabled={isCodeView}
          onMouseDown={(e) => { e.preventDefault(); exec('underline'); }}
        >
          <u>U</u>
        </button>
        <button
          type="button"
          title="Strikethrough"
          style={btnStyle(activeFormats.strikeThrough)}
          disabled={isCodeView}
          onMouseDown={(e) => { e.preventDefault(); exec('strikeThrough'); }}
        >
          <s>S</s>
        </button>

        {divider}

        {/* Text Alignment */}
        <button
          type="button"
          title="Align Left"
          style={btnStyle(activeFormats.justifyLeft)}
          disabled={isCodeView}
          onMouseDown={(e) => { e.preventDefault(); exec('justifyLeft'); }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
          disabled={isCodeView}
          onMouseDown={(e) => { e.preventDefault(); exec('justifyCenter'); }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
          disabled={isCodeView}
          onMouseDown={(e) => { e.preventDefault(); exec('justifyRight'); }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
          disabled={isCodeView}
          onMouseDown={(e) => { e.preventDefault(); exec('justifyFull'); }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="21" y1="10" x2="3" y2="10" />
            <line x1="21" y1="6" x2="3" y2="6" />
            <line x1="21" y1="14" x2="3" y2="14" />
            <line x1="21" y1="18" x2="3" y2="18" />
          </svg>
        </button>

        {divider}

        {/* Lists */}
        <button
          type="button"
          title="Bullet List"
          style={btnStyle(activeFormats.insertUnorderedList)}
          disabled={isCodeView}
          onMouseDown={(e) => { e.preventDefault(); exec('insertUnorderedList'); }}
        >
          • List
        </button>
        <button
          type="button"
          title="Numbered List"
          style={btnStyle(activeFormats.insertOrderedList)}
          disabled={isCodeView}
          onMouseDown={(e) => { e.preventDefault(); exec('insertOrderedList'); }}
        >
          1. List
        </button>

        {divider}

        {/* Text Colors */}
        <button
          type="button"
          title="Gold accent (#D4AF37)"
          style={{ ...btnStyle(false), color: '#D4AF37' }}
          disabled={isCodeView}
          onMouseDown={(e) => { e.preventDefault(); exec('foreColor', '#D4AF37'); }}
        >
          ● Gold
        </button>
        <button
          type="button"
          title="Dark text (#0A0A0F)"
          style={{ ...btnStyle(false), color: '#0A0A0F' }}
          disabled={isCodeView}
          onMouseDown={(e) => { e.preventDefault(); exec('foreColor', '#0A0A0F'); }}
        >
          ● Dark
        </button>
        <button
          type="button"
          title="Red accent (#DC2626)"
          style={{ ...btnStyle(false), color: '#DC2626' }}
          disabled={isCodeView}
          onMouseDown={(e) => { e.preventDefault(); exec('foreColor', '#DC2626'); }}
        >
          ● Red
        </button>

        {/* Highlight / Background */}
        <button
          type="button"
          title="Highlight Yellow"
          style={{ ...btnStyle(false), background: '#FEF08A', color: '#854D0E', borderColor: '#FDE047' }}
          disabled={isCodeView}
          onMouseDown={(e) => { e.preventDefault(); exec('hiliteColor', '#FEF08A'); }}
        >
          Highlight
        </button>

        {divider}

        {/* Undo / Redo */}
        <button
          type="button"
          title="Undo (Ctrl+Z)"
          style={btnStyle(false)}
          disabled={isCodeView}
          onMouseDown={(e) => { e.preventDefault(); exec('undo'); }}
        >
          ↺
        </button>
        <button
          type="button"
          title="Redo (Ctrl+Y)"
          style={btnStyle(false)}
          disabled={isCodeView}
          onMouseDown={(e) => { e.preventDefault(); exec('redo'); }}
        >
          ↻
        </button>

        {/* Clear formatting */}
        <button
          type="button"
          title="Clear formatting"
          style={{ ...btnStyle(false), color: '#DC2626' }}
          disabled={isCodeView}
          onMouseDown={(e) => { e.preventDefault(); exec('removeFormat'); }}
        >
          ✕ Clear
        </button>

        <div style={{ flex: 1 }} />

        {/* View Code / Visual toggle button */}
        <button
          type="button"
          title={isCodeView ? 'Switch to Visual Editor' : 'Switch to HTML Code View'}
          style={{
            ...btnStyle(isCodeView),
            fontFamily: 'monospace',
            fontSize: 11,
            fontWeight: 700,
            padding: '0 8px',
          }}
          onClick={toggleCodeView}
        >
          {isCodeView ? '✎ Visual' : '< > HTML'}
        </button>
      </div>

      {/* ── Editor Area ─────────────────────────────────────────── */}
      <div style={{ position: 'relative', minHeight, background: '#fff' }}>
        {/* Floating placeholder */}
        {!hasContent && !isCodeView && (
          <div
            style={{
              position: 'absolute',
              top: 14,
              left: 16,
              color: '#9CA3AF',
              pointerEvents: 'none',
              fontFamily: currentFont || 'Inter, sans-serif',
              fontSize: `${currentFontSize}px`,
              lineHeight: 1.75,
              userSelect: 'none',
              zIndex: 1,
            }}
          >
            {placeholder}
          </div>
        )}

        {/* Native contentEditable container */}
        <div
          ref={containerRef}
          style={{
            display: isCodeView ? 'none' : 'block',
            minHeight,
            resize: 'vertical',
            overflow: 'auto',
          }}
        />

        {/* HTML textarea */}
        {isCodeView && (
          <textarea
            value={value}
            onChange={(e) => {
              const html = e.target.value;
              lastEmittedRef.current = html;
              onChange(html);
              computeCounts(html);
              setHasContent(!isContentEmpty(html));
            }}
            placeholder="Write HTML markup here…"
            style={{
              width: '100%',
              minHeight,
              height: editorHeight ? `${editorHeight}px` : undefined,
              padding: '14px 16px',
              fontFamily: 'Consolas, Monaco, "Courier New", monospace',
              fontSize: 13,
              lineHeight: 1.6,
              border: 'none',
              outline: 'none',
              resize: 'vertical',
              background: '#1F2937',
              color: '#F9FAFB',
              boxSizing: 'border-box',
              display: 'block',
            }}
          />
        )}
      </div>

      {/* ── Status bar & Height Controls ─────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '6px 12px',
          background: '#FAFAFA',
          borderTop: '1px solid rgba(0,0,0,0.06)',
          borderBottomLeftRadius: 10,
          borderBottomRightRadius: 10,
          fontSize: 11,
          fontFamily: 'Inter, sans-serif',
          color: '#6B7280',
          userSelect: 'none',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span>{wordCount.words} words · {wordCount.chars} characters</span>
          <span style={{ color: '#9CA3AF' }}>|</span>
          <span style={{ color: '#9CA3AF' }}>Drag ⤡ corner to resize</span>
        </div>

        {/* Height Presets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#9CA3AF' }}>Height:</span>
          {[
            { label: 'Compact', h: 160 },
            { label: 'Medium', h: 280 },
            { label: 'Tall', h: 460 },
          ].map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => handleHeightPreset(preset.h)}
              style={{
                background: editorHeight === preset.h ? '#E5E7EB' : 'transparent',
                border: '1px solid rgba(0,0,0,0.1)',
                borderRadius: 4,
                padding: '2px 7px',
                fontSize: 10,
                fontWeight: editorHeight === preset.h ? 700 : 500,
                color: editorHeight === preset.h ? '#111827' : '#6B7280',
                cursor: 'pointer',
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}




