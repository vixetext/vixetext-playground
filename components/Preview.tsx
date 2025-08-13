import React, { forwardRef } from 'react';

export interface PreviewProps {
  htmlContent: string;
}

/**
 * Exibe conteúdo HTML já processado dentro de um contêiner rolável com estilos de tipografia.
 */
const Preview = forwardRef<HTMLDivElement, PreviewProps>(function Preview({ htmlContent }, ref) {
  return (
    <div className="h-full overflow-y-auto bg-white dark:bg-gray-800 transition-colors duration-300">
      <div
        ref={ref}
        className="prose dark:prose-invert max-w-none p-6"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
});

export default Preview;
