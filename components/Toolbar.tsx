import React from 'react';
import { Bold, Italic, Heading1, Heading2, Heading3, Quote, List, ListOrdered, Code, Link, Image, Minus } from 'lucide-react';

export type ToolbarAction =
  | 'bold'
  | 'italic'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'quote'
  | 'ul'
  | 'ol'
  | 'code'
  | 'link'
  | 'image'
  | 'hr';

export interface ToolbarProps {
  onFormat: (type: ToolbarAction, payload?: unknown) => void;
}

interface ActionButtonProps {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}

/**
 * Renderiza um botão de ação da toolbar com acessibilidade e estilos consistentes.
 */
function ActionButton({ title, onClick, children }: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="p-2 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
    >
      {children}
    </button>
  );
}

/**
 * Exibe um divisor vertical para agrupar ações relacionadas.
 */
function Divider() {
  return <div className="h-5 w-px bg-gray-300 dark:bg-gray-600 mx-1" />;
}

/**
 * Barra de ferramentas para formatação Markdown com ações como negrito, títulos e listas.
 */
export default function Toolbar({ onFormat }: ToolbarProps) {
  return (
    <div className="flex-shrink-0 flex items-center space-x-1 p-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
      <ActionButton title="Bold" onClick={() => onFormat('bold')}>
        <Bold size={18} />
      </ActionButton>
      <ActionButton title="Italic" onClick={() => onFormat('italic')}>
        <Italic size={18} />
      </ActionButton>

      <Divider />

      <ActionButton title="Heading 1" onClick={() => onFormat('h1')}>
        <Heading1 size={18} />
      </ActionButton>
      <ActionButton title="Heading 2" onClick={() => onFormat('h2')}>
        <Heading2 size={18} />
      </ActionButton>
      <ActionButton title="Heading 3" onClick={() => onFormat('h3')}>
        <Heading3 size={18} />
      </ActionButton>

      <Divider />

      <ActionButton title="Blockquote" onClick={() => onFormat('quote')}>
        <Quote size={18} />
      </ActionButton>
      <ActionButton title="Unordered List" onClick={() => onFormat('ul')}>
        <List size={18} />
      </ActionButton>
      <ActionButton title="Ordered List" onClick={() => onFormat('ol')}>
        <ListOrdered size={18} />
      </ActionButton>

      <Divider />

      <ActionButton title="Code" onClick={() => onFormat('code')}>
        <Code size={18} />
      </ActionButton>
      <ActionButton title="Link" onClick={() => onFormat('link')}>
        <Link size={18} />
      </ActionButton>
      <ActionButton title="Image" onClick={() => onFormat('image')}>
        <Image size={18} />
      </ActionButton>
      <ActionButton title="Horizontal Rule" onClick={() => onFormat('hr')}>
        <Minus size={18} />
      </ActionButton>
    </div>
  );
}
