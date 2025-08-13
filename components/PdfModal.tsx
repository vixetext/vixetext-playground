import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader, X, Download, Maximize2, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, StretchHorizontal, ListTree } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import { compilePdf } from '../api/compilePdf';

import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type TocItem = { title: string; pageNumber: number | null; items?: TocItem[] };

export interface PdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  indexMd: string;
  configuracaoYaml: string;
  referenciasBib: string;
}

/**
 * Exibe um modal com pré-visualização de PDF gerado no backend, suporte a zoom,
 * navegação por páginas e sumário (TOC) quando disponível.
 */
export default function PdfModal({ isOpen, onClose, indexMd, configuracaoYaml, referenciasBib }: PdfModalProps) {
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const [viewerWidth, setViewerWidth] = useState(0);
  const [docProxy, setDocProxy] = useState<any>(null);
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [origW, setOrigW] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [interacting, setInteracting] = useState(false);
  const [showToc, setShowToc] = useState(false);
  const [toc, setToc] = useState<TocItem[] | null>(null);
  const [tocLoading, setTocLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState<string>('document.pdf');

  /**
   * Compila o PDF quando o modal abre e gerencia o ciclo de vida do Blob URL.
   */
  useEffect(() => {
    if (!isOpen) return;
    const ctrl = new AbortController();

    setIsLoading(true);
    setError(null);
    setPdfBlob(null);
    setObjectUrl((old) => { if (old) URL.revokeObjectURL(old); return null; });

    compilePdf({ indexMd, configuracaoYaml, referenciasBib }, ctrl.signal)
      .then(({ blob, fileName }) => {
        setPdfBlob(blob);
        if (fileName) setDownloadName(fileName);
        const url = URL.createObjectURL(blob);
        setObjectUrl(url);
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return;
        setError(err?.message || 'Falha ao compilar o PDF.');
      })
      .finally(() => setIsLoading(false));

    return () => {
      ctrl.abort();
      setObjectUrl((old) => { if (old) URL.revokeObjectURL(old); return null; });
    };
  }, [isOpen, indexMd, configuracaoYaml, referenciasBib]);

  /**
   * Observa redimensionamentos do container para recalcular o ajuste de largura.
   */
  useEffect(() => {
    if (!isOpen) return;
    const el = viewerRef.current;
    if (!el) return;
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setViewerWidth(el.clientWidth));
    };
    setViewerWidth(el.clientWidth);
    const ro = new ResizeObserver(onResize);
    ro.observe(el);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [showToc, isOpen]);

  const baseScale = useMemo(() => {
    if (!origW || viewerWidth <= 0) return 1;
    return viewerWidth / origW;
  }, [origW, viewerWidth]);

  const effectiveScale = useMemo(() => {
    const raw = (baseScale || 1) * (zoom || 1);
    if (!Number.isFinite(raw)) return 1;
    return Math.min(5, Math.max(0.25, raw));
  }, [baseScale, zoom]);

  /**
   * Executa uma ação visual marcando o estado de interação por um curto período.
   */
  const withInteraction = useCallback((fn: () => void) => {
    setInteracting(true);
    fn();
    window.setTimeout(() => setInteracting(false), 200);
  }, []);

  /**
   * Aumenta o zoom em passos de 0.1 até o limite.
   */
  const zoomIn = useCallback(() => withInteraction(() => setZoom((z) => Math.min(3, Number((z + 0.1).toFixed(2))))), [withInteraction]);

  /**
   * Diminui o zoom em passos de 0.1 até o limite.
   */
  const zoomOut = useCallback(() => withInteraction(() => setZoom((z) => Math.max(0.5, Number((z - 0.1).toFixed(2))))), [withInteraction]);

  /**
   * Ajusta o zoom para caber na largura do container.
   */
  const fitWidth = useCallback(() => withInteraction(() => setZoom(1)), [withInteraction]);

  /**
   * Vai para a página anterior respeitando limites.
   */
  const prevPage = useCallback(() => withInteraction(() => setPageNumber((p) => Math.max(1, p - 1))), [withInteraction]);

  /**
   * Vai para a próxima página respeitando limites.
   */
  const nextPage = useCallback(() => withInteraction(() => setPageNumber((p) => Math.min(numPages, p + 1))), [withInteraction, numPages]);

  /**
   * Carrega o sumário (TOC) do PDF, quando solicitado e ainda não carregado.
   */
  useEffect(() => {
    if (!showToc || !docProxy || toc) return;
    let cancelled = false;
    (async () => {
      try {
        setTocLoading(true);
        const outline = await docProxy.getOutline();
        if (cancelled) return;
        if (!outline) { setToc([]); setTocLoading(false); return; }

        const destToPage = async (dest: any): Promise<number | null> => {
          try {
            const explicit = Array.isArray(dest) ? dest : await docProxy.getDestination(dest);
            if (!explicit?.length) return null;
            const ref = explicit[0];
            const index = await docProxy.getPageIndex(ref);
            return index + 1;
          } catch { return null; }
        };

        const mapItems = async (items: any[]): Promise<TocItem[]> => {
          const out: TocItem[] = [];
          for (const it of items) {
            out.push({
              title: (it.title || '').trim(),
              pageNumber: it.dest ? await destToPage(it.dest) : null,
              items: it.items ? await mapItems(it.items) : [],
            });
          }
          return out;
        };

        setToc(await mapItems(outline));
      } finally {
        if (!cancelled) setTocLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [showToc, docProxy, toc]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-2 sm:p-3" aria-modal="true" role="dialog">
      <div className="relative flex flex-col w-[98vw] h-[98vh] bg-gray-100 dark:bg-gray-800 rounded-xl shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-300 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{isLoading ? 'Gerando PDF…' : 'Pré-visualização do PDF'}</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!objectUrl}
              onClick={() => objectUrl && window.open(objectUrl, '_blank', 'noopener,noreferrer')}
              className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
              title="Abrir em nova aba"
              aria-label="Abrir em nova aba"
            >
              <Maximize2 size={18} />
            </button>

            <a
              href={objectUrl ?? '#'}
              download={downloadName}
              className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
              aria-disabled={!objectUrl}
              onClick={(e) => { if (!objectUrl) e.preventDefault(); }}
              title="Baixar PDF"
              aria-label="Baixar PDF"
            >
              <Download size={18} />
            </a>

            <button type="button" onClick={onClose} className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700" title="Fechar" aria-label="Fechar">
              <X size={18} />
            </button>
          </div>
        </div>

        {!isLoading && (
          <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200">
            <button type="button" onClick={zoomOut} className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700" title="Diminuir zoom" aria-label="Diminuir zoom">
              <ZoomOut size={18} />
            </button>
            <button type="button" onClick={zoomIn} className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700" title="Aumentar zoom" aria-label="Aumentar zoom">
              <ZoomIn size={18} />
            </button>
            <button type="button" onClick={fitWidth} className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700" title="Ajustar à largura" aria-label="Ajustar à largura">
              <StretchHorizontal size={18} />
            </button>

            <div className="mx-3 h-5 w-px bg-gray-300 dark:bg-gray-700" />

            <button type="button" onClick={() => setShowToc((s) => !s)} className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700" title="Exibir/ocultar sumário" aria-label="Exibir ou ocultar sumário">
              <ListTree size={18} />
            </button>

            <div className="mx-3 h-5 w-px bg-gray-300 dark:bg-gray-700" />

            <button type="button" onClick={prevPage} disabled={pageNumber <= 1} className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50" title="Página anterior" aria-label="Página anterior">
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm tabular-nums">Página <strong>{pageNumber}</strong> de <strong>{numPages || '—'}</strong></span>
            <button type="button" onClick={nextPage} disabled={pageNumber >= numPages} className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50" title="Próxima página" aria-label="Próxima página">
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-hidden flex">
          {showToc && (
            <aside className="w-72 shrink-0 border-r border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-auto p-3">
              <h3 className="font-medium mb-2 text-gray-800 dark:text-gray-100">Sumário</h3>
              {tocLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <Loader size={16} className="animate-spin" /> Carregando…
                </div>
              ) : toc && toc.length > 0 ? (
                <ul className="space-y-1">
                  {toc.map((it, i) => (
                    <li key={i}>
                      <TocNode item={it} level={0} onJump={(p) => withInteraction(() => setPageNumber(p))} current={pageNumber} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-300">Este PDF não possui sumário.</p>
              )}
            </aside>
          )}

          <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
            <div ref={viewerRef} className="w-full h-full">
              {isLoading ? (
                <LoaderBlock text="Compilando PDF…" />
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-full text-red-600 dark:text-red-400"><p>{error}</p></div>
              ) : pdfBlob ? (
                <Document
                  file={pdfBlob}
                  onLoadSuccess={(doc) => { setDocProxy(doc); setNumPages(doc.numPages); setPageNumber(1); }}
                  onLoadError={() => setError('Falha ao abrir o PDF gerado.')}
                  loading={<LoaderBlock text="Carregando PDF…" />}
                  className="flex justify-center"
                >
                  <Page
                    pageNumber={pageNumber}
                    scale={effectiveScale}
                    renderTextLayer={!interacting}
                    renderAnnotationLayer={!interacting}
                    onLoadSuccess={(page) => {
                      const w = (page as any).originalWidth ?? (page as any).width;
                      if (!origW && w) setOrigW(w);
                    }}
                    className="bg-white shadow-sm mx-auto"
                  />
                </Document>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-600 dark:text-gray-400"><p>Aguardando PDF…</p></div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Exibe um estado de carregamento consistente com ícone e texto.
 */
function LoaderBlock({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-gray-600 dark:text-gray-400">
      <Loader size={32} className="animate-spin mb-3" />
      <p>{text}</p>
    </div>
  );
}

/**
 * Mostra um item do sumário com indentação, estado ativo e ação de pular para a página.
 */
function TocNode({ item, level, onJump, current }: { item: TocItem; level: number; onJump: (p: number) => void; current: number }) {
  const hasChildren = !!item.items?.length;
  const active = item.pageNumber === current;
  return (
    <>
      <button
        type="button"
        disabled={!item.pageNumber}
        onClick={() => item.pageNumber && onJump(item.pageNumber)}
        className={`w-full text-left px-2 py-1 rounded ${item.pageNumber ? 'hover:bg-gray-200 dark:hover:bg-gray-700' : 'opacity-60 cursor-default'} ${active ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
        style={{ paddingLeft: 8 + level * 12 }}
        title={item.pageNumber ? `Ir para página ${item.pageNumber}` : 'Sem destino'}
        aria-label={item.pageNumber ? `Ir para página ${item.pageNumber}` : 'Sem destino'}
      >
        <span className="block truncate">{item.title || '(sem título)'}</span>
        <span className="text-xs opacity-70">{item.pageNumber ? `p. ${item.pageNumber}` : 'sem página'}</span>
      </button>
      {hasChildren && (
        <ul className="mt-1 space-y-1">
          {item.items!.map((child, i) => (
            <li key={i}>
              <TocNode item={child} level={level + 1} onJump={onJump} current={current} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
