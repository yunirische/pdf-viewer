import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from 'pdfjs-dist';

GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

export type SourceEvidence = {
  raw_id: string;
  page: number;
  bbox: [number, number, number, number] | null;
  raw_text: string;
  source_type: string;
  extractor: string;
};

type HighlightRect = {
  id: string;
  left: number;
  top: number;
  width: number;
  height: number;
  label: string;
};

type Props = {
  pdfUrl: string;
  page: number | null;
  sources: SourceEvidence[];
  onPageChange: (page: number) => void;
};

export function PdfSourceViewer({ pdfUrl, page, sources, onPageChange }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pageCount, setPageCount] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [pageHeight, setPageHeight] = useState(0);
  const [highlightRects, setHighlightRects] = useState<HighlightRect[]>([]);

  const selectedPage = page ?? 1;

  const pageSources = useMemo(
    () => sources.filter((source) => source.page === selectedPage),
    [sources, selectedPage],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setDoc(null);
    if (!pdfUrl) {
      setLoading(false);
      return;
    }

    getDocument(pdfUrl)
      .promise.then((loaded) => {
        if (cancelled) {
          loaded.destroy();
          return;
        }
        setDoc(loaded);
        setPageCount(loaded.numPages);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [pdfUrl]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }
    const element = containerRef.current;
    const update = () => setContainerWidth(element.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!doc || !selectedPage || containerWidth <= 0) {
      return;
    }

    const render = async () => {
      const pdfPage = await doc.getPage(selectedPage);
      const baseViewport = pdfPage.getViewport({ scale: 1 });
      const scale = Math.max(0.75, (containerWidth - 24) / baseViewport.width);
      const viewport = pdfPage.getViewport({ scale });

      const canvas = canvasRef.current;
      if (!canvas) return;
      const context = canvas.getContext('2d');
      if (!context) return;

      const outputScale = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      context.setTransform(outputScale, 0, 0, outputScale, 0, 0);

      await pdfPage.render({
        canvas,
        canvasContext: context,
        viewport,
      }).promise;

      if (cancelled) {
        return;
      }

      setPageHeight(viewport.height);

      const rects: HighlightRect[] = [];
      for (const source of pageSources) {
        if (!source.bbox) continue;
        const [x0, y0, x1, y1] = source.bbox;
        const [leftX, topY, rightX, bottomY] = viewport.convertToViewportRectangle([x0, y0, x1, y1]);
        const left = Math.min(leftX, rightX);
        const top = Math.min(topY, bottomY);
        const width = Math.abs(rightX - leftX);
        const height = Math.abs(bottomY - topY);
        rects.push({
          id: source.raw_id,
          left,
          top,
          width,
          height,
          label: source.extractor,
        });
      }
      setHighlightRects(rects);
    };

    render().catch((err: unknown) => {
      if (!cancelled) {
        setError(err instanceof Error ? err.message : String(err));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [doc, selectedPage, containerWidth, pageSources]);

  const goToPage = (delta: number) => {
    if (!pageCount) return;
    const next = Math.min(pageCount, Math.max(1, selectedPage + delta));
    onPageChange(next);
  };

  return (
    <div className="pdf-viewer-shell">
      <div className="pdf-viewer-toolbar">
        <button className="btn btn-secondary" onClick={() => goToPage(-1)} disabled={!pageCount}>
          <ChevronLeft size={16} />
          Prev
        </button>
        <button className="btn btn-secondary" onClick={() => goToPage(1)} disabled={!pageCount}>
          Next
          <ChevronRight size={16} />
        </button>
        <button className="btn btn-secondary" onClick={() => onPageChange(1)} disabled={!pageCount}>
          <RotateCcw size={16} />
          First page
        </button>
        <span className="badge badge-gray">page {selectedPage}{pageCount ? ` / ${pageCount}` : ''}</span>
        <span className="badge badge-gray">{pageSources.length} source hits</span>
      </div>

      <div ref={containerRef} className="pdf-viewer-frame">
        {loading ? <div className="pdf-state">Loading PDF...</div> : null}
        {error ? <div className="pdf-state error">{error}</div> : null}
        {!loading && !error && doc ? (
          <div className="pdf-stage" style={{ height: `${pageHeight}px` }}>
            <canvas ref={canvasRef} className="pdf-canvas" />
            <div className="pdf-overlay">
              {highlightRects.map((rect) => (
                <div
                  key={rect.id}
                  className="pdf-highlight"
                  style={{
                    left: `${rect.left}px`,
                    top: `${rect.top}px`,
                    width: `${rect.width}px`,
                    height: `${rect.height}px`,
                  }}
                  title={rect.label}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
