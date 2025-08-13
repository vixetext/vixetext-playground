import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  WheelEvent,
} from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { EditorView, keymap } from '@codemirror/view';
import { Extension } from '@codemirror/state';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { yaml } from '@codemirror/lang-yaml';
import { bibtex } from '@citedrive/codemirror-lang-bibtex';

const cmBaseTheme = EditorView.theme({
  '&': { height: '100%' },
  '.cm-editor': { height: '100%' },
  '.cm-scroller': { overflow: 'auto', lineHeight: '1.55', overscrollBehavior: 'contain' },
  '.cm-content': {
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: '14px',
  },
});

export interface EditorProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  fileName?: string;
}

/**
 * Retorna a extensão de linguagem adequada conforme o nome do arquivo.
 */
function getLanguageExtension(fileName?: string): Extension {
  const name = (fileName || '').toLowerCase();
  if (name.endsWith('.yaml') || name.endsWith('.yml') || name === 'configuracao.yaml') return yaml();
  if (name.endsWith('.bib') || name === 'referencias.bib') return bibtex();
  return markdown({ base: markdownLanguage, codeLanguages: languages });
}

/**
 * Componente de editor baseado em CodeMirror com detecção de tema, troca dinâmica
 * de linguagem por arquivo e API via ref compatível com um HTMLTextAreaElement.
 */
const Editor = forwardRef<HTMLTextAreaElement, EditorProps>(({ value, onChange, fileName }, ref) => {
  const viewRef = useRef<EditorView | null>(null);
  const [isDark, setIsDark] = useState<boolean>(() => document.documentElement.classList.contains('dark'));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const obs = new MutationObserver(() => setIsDark(document.documentElement.classList.contains('dark')));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const languageExt = useMemo<Extension>(() => getLanguageExtension(fileName), [fileName]);

  const extensions = useMemo<Extension[]>(() => [
    cmBaseTheme,
    history(),
    keymap.of([...defaultKeymap, ...historyKeymap]),
    languageExt,
    EditorView.lineWrapping,
    EditorView.theme(
      {
        '&': { backgroundColor: 'transparent' },
        '.cm-gutters': { backgroundColor: 'transparent', borderRight: '1px solid var(--tw-prose-hr, rgba(0,0,0,0.08))' },
      },
      { dark: isDark }
    ),
  ], [isDark, languageExt]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const onFocusIn = () => setIsFocused(true);
    const onFocusOut = (e: FocusEvent) => {
      if (view.dom && !view.dom.contains(e.relatedTarget as Node)) setIsFocused(false);
    };
    view.dom.addEventListener('focusin', onFocusIn);
    view.dom.addEventListener('focusout', onFocusOut);
    return () => {
      view.dom.removeEventListener('focusin', onFocusIn);
      view.dom.removeEventListener('focusout', onFocusOut);
    };
  }, [viewRef.current]);

  /**
   * Exponibiliza um subconjunto da API de HTMLTextAreaElement para compatibilidade com toolbars.
   */
  useImperativeHandle(ref, () => {
    const view = viewRef.current!;
    const api: any = {
      focus: () => view && view.focus(),
      get selectionStart() { return view ? view.state.selection.main.from : 0; },
      get selectionEnd() { return view ? view.state.selection.main.to : 0; },
      setSelectionRange: (start: number, end: number) => {
        if (!view) return;
        view.dispatch({ selection: { anchor: start, head: end } });
        view.focus();
      },
      get value() { return value; },
    };
    return api as HTMLTextAreaElement;
  }, [value]);

  /**
   * Adapta o onChange do CodeMirror para o formato esperado (event.target.value).
   */
  const handleChange = (next: string) => {
    const evt = { target: { value: next } } as unknown as React.ChangeEvent<HTMLTextAreaElement>;
    onChange(evt);
  };

  /**
   * Permite rolagem via roda do mouse somente quando o editor está focado.
   */
  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    if (!isFocused) return;
    const scroller = viewRef.current?.scrollDOM;
    if (!scroller) return;
    scroller.scrollTop += e.deltaY;
    scroller.scrollLeft += e.deltaX;
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      onWheel={handleWheel}
      className="h-full w-full overflow-y-scroll rounded border border-gray-200 dark:border-gray-700"
    >
      <CodeMirror
        value={value}
        onChange={handleChange}
        height="100%"
        basicSetup={{
          lineNumbers: true,
          highlightActiveLine: true,
          highlightActiveLineGutter: true,
          bracketMatching: true,
          autocompletion: true,
        }}
        theme={isDark ? 'dark' : 'light'}
        extensions={extensions}
        onCreateEditor={(view) => { viewRef.current = view; }}
        className="border-0 bg-white p-0 text-gray-900 dark:bg-gray-900 dark:text-gray-100"
      />
    </div>
  );
});

Editor.displayName = 'Editor';
export default Editor;
