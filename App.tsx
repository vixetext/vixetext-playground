import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

import { FILE_NAMES, INITIAL_FILE_CONTENTS } from './constants';
import Header from './components/Header';
import Editor from './components/Editor';
import Preview from './components/Preview';
import PdfModal from './components/PdfModal';
import FileTabs from './components/FileTabs';
import Toolbar from './components/Toolbar';

type HistoryState = { past: string[]; present: string; future: string[] };

type FormatAction =
  | 'bold'
  | 'italic'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'quote'
  | 'code'
  | 'link'
  | 'image'
  | 'ul'
  | 'ol'
  | 'hr';

/**
 * Inicializa o estado de histórico para cada arquivo conhecido.
 */
function initHistories(): Record<string, HistoryState> {
  return FILE_NAMES.reduce((acc, fileName) => {
    acc[fileName] = { past: [], present: INITIAL_FILE_CONTENTS[fileName], future: [] };
    return acc;
  }, {} as Record<string, HistoryState>);
}

/**
 * Componente principal do editor com editor, preview, abas, toolbar e geração de PDF via modal.
 */
export default function App() {
  const [history, setHistory] = useState<Record<string, HistoryState>>(initHistories);
  const [activeFile, setActiveFile] = useState<string>(FILE_NAMES[0]);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState<boolean>(true);
  const [isGeneratingPdf] = useState<boolean>(false);
  const [isPdfOpen, setIsPdfOpen] = useState<boolean>(false);

  const previewRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const isMarkdownActive = activeFile === 'Index.md';
  const currentContent = history[activeFile]?.present ?? '';
  const canUndo = (history[activeFile]?.past.length ?? 0) > 0;
  const canRedo = (history[activeFile]?.future.length ?? 0) > 0;

  /**
   * Alterna a classe global de tema escuro.
   */
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [isDarkMode]);

  /**
   * Registra alterações de conteúdo no histórico do arquivo ativo.
   */
  const recordChange = useCallback((newContent: string, fromUndoRedo = false) => {
    if (fromUndoRedo) {
      setHistory(prev => ({
        ...prev,
        [activeFile]: { ...prev[activeFile], present: newContent },
      }));
      return;
    }
    setHistory(prev => {
      const h = prev[activeFile];
      if (h.present === newContent) return prev;
      return {
        ...prev,
        [activeFile]: { past: [...h.past, h.present], present: newContent, future: [] },
      };
    });
  }, [activeFile]);

  /**
   * Manipula mudanças vindas do componente Editor.
   */
  const handleContentChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    recordChange(event.target.value);
  }, [recordChange]);

  /**
   * Desfaz a última alteração no arquivo ativo.
   */
  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    setHistory(prev => {
      const h = prev[activeFile];
      const previous = h.past[h.past.length - 1];
      return {
        ...prev,
        [activeFile]: {
          past: h.past.slice(0, -1),
          present: previous,
          future: [h.present, ...h.future],
        },
      };
    });
  }, [activeFile, canUndo]);

  /**
   * Refaz a próxima alteração no arquivo ativo.
   */
  const handleRedo = useCallback(() => {
    if (!canRedo) return;
    setHistory(prev => {
      const h = prev[activeFile];
      const next = h.future[0];
      return {
        ...prev,
        [activeFile]: {
          past: [...h.past, h.present],
          present: next,
          future: h.future.slice(1),
        },
      };
    });
  }, [activeFile, canRedo]);

  /**
   * Atalhos de teclado para desfazer/refazer.
   */
  const onKeyDown = useCallback((event: KeyboardEvent) => {
    const isMac = navigator.platform.toUpperCase().includes('MAC');
    const isCtrl = isMac ? event.metaKey : event.ctrlKey;
    if (isCtrl && event.key === 'z') {
      event.preventDefault();
      if (event.shiftKey) handleRedo();
      else handleUndo();
    } else if (isCtrl && event.key === 'y' && !isMac) {
      event.preventDefault();
      handleRedo();
    }
  }, [handleUndo, handleRedo]);

  /**
   * Registra e remove listeners globais de teclado.
   */
  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onKeyDown]);

  /**
   * Aplica formatações Markdown sobre a seleção do editor conforme a ação solicitada.
   */
  const handleFormat = useCallback((type: FormatAction) => {
    const textarea = editorRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    const selectedText = value.substring(start, end);

    let newContent = value;
    let selStart = start;
    let selEnd = end;

    const wrap = (pre: string, suf: string, placeholder: string) => {
      const text = selectedText || placeholder;
      const rep = `${pre}${text}${suf}`;
      newContent = value.slice(0, start) + rep + value.slice(end);
      selStart = start + pre.length;
      selEnd = selStart + text.length;
    };

    const linePrefix = (prefix: string, placeholder: string) => {
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const text = selectedText || placeholder;
      newContent = value.slice(0, lineStart) + `${prefix}${text}` + value.slice(end);
      selStart = lineStart + prefix.length;
      selEnd = selStart + text.length;
    };

    const list = (ordered: boolean) => {
      const text = selectedText || 'List item';
      const lines = text.split('\n');
      const out = lines.map((line, i) => (ordered ? `${i + 1}.` : '*') + ` ${line}`).join('\n');
      newContent = value.slice(0, start) + out + value.slice(end);
      selStart = start;
      selEnd = start + out.length;
    };

    switch (type) {
      case 'bold': wrap('**', '**', 'bold text'); break;
      case 'italic': wrap('*', '*', 'italic text'); break;
      case 'h1': linePrefix('# ', 'Heading 1'); break;
      case 'h2': linePrefix('## ', 'Heading 2'); break;
      case 'h3': linePrefix('### ', 'Heading 3'); break;
      case 'quote': linePrefix('> ', 'Quote'); break;
      case 'code': wrap('`', '`', 'code'); break;
      case 'link': wrap('[', '](https://)', 'link text'); break;
      case 'image': {
        const rep = '![alt text](https://)';
        newContent = value.slice(0, start) + rep + value.slice(end);
        selStart = start + 2;
        selEnd = start + 11;
        break;
      }
      case 'ul': list(false); break;
      case 'ol': list(true); break;
      case 'hr': {
        const rep = (start === 0 ? '' : '\n') + '---\n';
        newContent = value.slice(0, start) + rep + value.slice(end);
        selStart = selEnd = start + rep.length;
        break;
      }
      default: return;
    }

    recordChange(newContent);

    setTimeout(() => {
      const el = editorRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(selStart, selEnd);
    }, 0);
  }, [recordChange]);

  /**
   * Alterna a visibilidade do preview quando o arquivo atual é Markdown.
   */
  const togglePreview = useCallback(() => {
    if (isMarkdownActive) setIsPreviewVisible(v => !v);
  }, [isMarkdownActive]);

  /**
   * Alterna o tema escuro claro.
   */
  const toggleDarkMode = useCallback(() => setIsDarkMode(v => !v), []);

  /**
   * Abre a modal responsável por gerar e exibir o PDF.
   */
  const generatePdf = useCallback(() => {
    setIsPdfOpen(true);
  }, []);

  /**
   * Fecha a modal de PDF e limpa estados transitórios.
   */
  const closePdfModal = useCallback(() => {
    setIsPdfOpen(false);
  }, []);

  /**
   * Converte o conteúdo Markdown atual em HTML sanitizado.
   */
  const parsedHtml = useMemo(() => {
    if (!isMarkdownActive) return '';
    const raw = marked.parse(currentContent) as string;
    return DOMPurify.sanitize(raw);
  }, [isMarkdownActive, currentContent]);

  const showPreview = isPreviewVisible && isMarkdownActive;

  const indexMdContent = history['Index.md']?.present ?? '';
  const configuracaoYamlContent = history['configuracao.yaml']?.present ?? '';
  const referenciasBibContent = history['referencias.bib']?.present ?? '';

  return (
    <div className="flex flex-col h-screen font-sans bg-gray-100 dark:bg-gray-800">
      <Header
        onTogglePreview={togglePreview}
        isPreviewVisible={isPreviewVisible}
        onGeneratePdf={generatePdf}
        isGeneratingPdf={isGeneratingPdf}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        isMarkdownActive={isMarkdownActive}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      <main className="flex-grow flex flex-col overflow-hidden">
        <FileTabs files={FILE_NAMES} activeFile={activeFile} onTabClick={setActiveFile} />
        <div className="flex-grow flex overflow-hidden min-h-0">
          <div className={`transition-all duration-300 h-full min-h-0 flex flex-col bg-white dark:bg-gray-900 ${showPreview ? 'w-1/2' : 'w-full'}`}>
            {isMarkdownActive && <Toolbar onFormat={handleFormat} />}
            <div className="flex-grow relative min-h-0">
              <Editor ref={editorRef} value={currentContent} onChange={handleContentChange} fileName={activeFile} />
            </div>
          </div>

          <div className={`transition-all duration-300 h-full overflow-hidden border-l border-gray-200 dark:border-gray-700 ${showPreview ? 'w-1/2' : 'w-0'}`}>
            <Preview ref={previewRef} htmlContent={parsedHtml} />
          </div>
        </div>
      </main>

      {isPdfOpen && (
        <PdfModal
          isOpen={isPdfOpen}
          onClose={closePdfModal}
          indexMd={indexMdContent}
          configuracaoYaml={configuracaoYamlContent}
          referenciasBib={referenciasBibContent}
        />
      )}
    </div>
  );
}
