import { useState, useRef, useEffect } from "react";
import { ChevronLeft, Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Candidate {
  id: string;
  name: string;
  category: string;
  portfolioUrl: string;
  thumbnailUrl: string | null;
  skillTags: string[];
  resumeScore: number | null;
  videoScore: number | null;
  englishProficiency: number | null;
}

interface PortfolioPanelProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate;
}

const PortfolioPanel = ({ isOpen, onClose, candidate }: PortfolioPanelProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [dragStartX, setDragStartX] = useState<number>(0);
  const [currentDragX, setCurrentDragX] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [iframeLoading, setIframeLoading] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setPageNumber(1);
      setIframeLoading(true);
    } else {
      document.body.style.overflow = "unset";
      setCurrentDragX(0);
      setIsDragging(false);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleShortlist = async () => {
    if (isShortlisted) {
      toast.info("Already shortlisted");
      return;
    }

    try {
      const { error } = await supabase.from("shortlisted_candidates").insert({
        candidate_name: candidate.name,
        candidate_role: candidate.category,
        video_url: "",
        resume_url: "",
        thumbnail_url: candidate.thumbnailUrl,
        skill_tags: candidate.skillTags,
      });

      if (error) throw error;

      setIsShortlisted(true);
      toast.success(`${candidate.name} shortlisted!`);
    } catch (error) {
      console.error("Error shortlisting:", error);
      toast.error("Failed to shortlist candidate");
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setDragStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - dragStartX;
    if (diff < 0) {
      setCurrentDragX(diff);
    }
  };

  const handleTouchEnd = () => {
    if (currentDragX < -100) {
      onClose();
    }
    setCurrentDragX(0);
    setIsDragging(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragStartX(e.clientX);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const currentX = e.clientX;
    const diff = currentX - dragStartX;
    if (diff < 0) {
      setCurrentDragX(diff);
    }
  };

  const handleMouseUp = () => {
    if (currentDragX < -100) {
      onClose();
    }
    setCurrentDragX(0);
    setIsDragging(false);
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const isPortfolioPDF = (url: string) => url.toLowerCase().endsWith('.pdf');

  if (!isOpen || !candidate.portfolioUrl) return null;

  const isPDF = isPortfolioPDF(candidate.portfolioUrl);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed inset-y-0 right-0 z-50 w-full md:w-[600px] bg-background shadow-2xl transform transition-transform duration-300 ease-out animate-slide-in-right overflow-hidden"
        style={{
          transform: `translateX(${currentDragX}px)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Animated particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-secondary/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/3 left-1/4 w-40 h-40 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        </div>

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/50 bg-background/95 backdrop-blur-md p-4 shadow-lg">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-secondary/20 hover:scale-110 transition-all duration-300"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div className="flex-1 ml-4">
            <h2 className="text-xl font-bold text-foreground">{candidate.name}</h2>
            <p className="text-sm text-muted-foreground font-mono">{candidate.category}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShortlist}
            disabled={isShortlisted}
            className={`ml-4 ${
              isShortlisted
                ? "bg-accent/20 border-accent text-accent"
                : "hover:bg-accent/10 hover:border-accent hover:text-accent"
            } transition-all duration-300`}
          >
            <Heart
              className={`mr-2 h-4 w-4 ${isShortlisted ? "fill-current" : ""}`}
            />
            {isShortlisted ? "Shortlisted" : "Shortlist"}
          </Button>
        </div>

        {/* Swipe indicator */}
        {isDragging && currentDragX < -20 && (
          <div className="absolute top-1/2 right-8 transform -translate-y-1/2 text-muted-foreground animate-pulse z-20">
            <ChevronLeft className="h-8 w-8" />
          </div>
        )}

        {/* Content */}
        <div className="relative h-[calc(100vh-80px)] overflow-auto bg-gradient-to-b from-background to-background/90">
          {/* Portfolio label */}
          <div className="sticky top-0 z-10 px-6 py-3 bg-secondary/10 backdrop-blur-sm border-b border-secondary/20">
            <h3 className="text-sm font-bold text-secondary tracking-wider font-mono">
              PORTFOLIO
            </h3>
          </div>

          {/* PDF Viewer or Iframe */}
          <div className="p-6">
            {isPDF ? (
              <>
                <Document
                  file={candidate.portfolioUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  loading={
                    <div className="flex items-center justify-center p-12 text-muted-foreground">
                      <Loader2 className="h-8 w-8 animate-spin mr-3" />
                      <span className="font-mono">LOADING_PORTFOLIO...</span>
                    </div>
                  }
                  error={
                    <div className="text-center p-12 text-destructive">
                      <p className="font-mono">ERROR_LOADING_PORTFOLIO</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Failed to load portfolio document
                      </p>
                    </div>
                  }
                  className="flex flex-col items-center"
                >
                  <Page
                    pageNumber={pageNumber}
                    className="shadow-2xl rounded-lg overflow-hidden border border-border/50 mb-6"
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    width={Math.min(window.innerWidth - 48, 552)}
                  />
                </Document>

                {/* PDF Controls */}
                {numPages > 0 && (
                  <div className="sticky bottom-6 flex items-center justify-center gap-4 mt-6 p-4 bg-secondary/20 backdrop-blur-md rounded-full border border-secondary/40 shadow-lg mx-auto w-fit">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                      disabled={pageNumber <= 1}
                      className="text-secondary hover:bg-secondary/30"
                    >
                      Previous
                    </Button>
                    <p className="text-sm font-mono text-secondary px-4">
                      {pageNumber} / {numPages}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
                      disabled={pageNumber >= numPages}
                      className="text-secondary hover:bg-secondary/30"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="relative w-full h-[calc(100vh-200px)] rounded-lg overflow-hidden border border-border/50 shadow-2xl bg-background">
                {iframeLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
                    <Loader2 className="h-8 w-8 animate-spin text-secondary mr-3" />
                    <span className="font-mono text-muted-foreground">LOADING_PORTFOLIO...</span>
                  </div>
                )}
                <iframe
                  src={candidate.portfolioUrl}
                  className="w-full h-full"
                  title={`${candidate.name}'s Portfolio`}
                  sandbox="allow-scripts allow-same-origin allow-popups"
                  onLoad={() => setIframeLoading(false)}
                  onError={() => {
                    setIframeLoading(false);
                    toast.error("Failed to load portfolio website");
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PortfolioPanel;
