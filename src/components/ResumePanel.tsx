import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, X, ChevronLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Candidate {
  id: string;
  name: string;
  category: string;
  videoUrl: string;
  resumeUrl: string;
  thumbnailUrl: string | null;
  skillTags: string[];
}

interface ResumePanelProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
}

const ResumePanel = ({ isOpen, onClose, candidate }: ResumePanelProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!candidate) return null;

  const handleShortlist = async () => {
    try {
      const { error } = await supabase.from("shortlisted_candidates").insert({
        candidate_name: candidate.name,
        candidate_role: candidate.category,
        video_url: candidate.videoUrl,
        resume_url: candidate.resumeUrl,
        thumbnail_url: candidate.thumbnailUrl,
        skill_tags: candidate.skillTags,
      });

      if (error) {
        if (error.code === "23505") {
          toast.info("Already shortlisted");
        } else {
          throw error;
        }
      } else {
        toast.success(`${candidate.name} shortlisted!`);
      }
    } catch (error) {
      console.error("Error shortlisting:", error);
      toast.error("Failed to shortlist candidate");
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    handleSwipe();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    touchStartX.current = e.clientX;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    touchEndX.current = e.clientX;
    handleSwipe();
  };

  const handleSwipe = () => {
    const swipeDistance = touchStartX.current - touchEndX.current;
    if (swipeDistance > 100) {
      // Swipe left detected - close panel
      onClose();
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sliding Panel */}
      <div
        ref={panelRef}
        className={`fixed inset-y-0 right-0 z-50 w-full bg-background shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-background/95 backdrop-blur-sm px-6 py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="gap-2"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <div className="flex-1 text-center">
            <h2 className="text-xl font-semibold text-foreground">
              {candidate.name}
            </h2>
            <p className="text-sm text-muted-foreground">{candidate.category}</p>
          </div>

          <Button onClick={handleShortlist} className="gap-2">
            <Heart className="h-4 w-4" />
            <span className="hidden sm:inline">Shortlist</span>
          </Button>
        </div>

        {/* PDF Viewer */}
        <div className="h-[calc(100vh-73px)] w-full overflow-auto bg-muted/30 flex flex-col items-center py-4">
          <Document
            file={candidate.resumeUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            }
            error={
              <div className="flex items-center justify-center h-full text-destructive">
                <p>Failed to load PDF. Please try again.</p>
              </div>
            }
          >
            {Array.from(new Array(numPages), (el, index) => (
              <Page
                key={`page_${index + 1}`}
                pageNumber={index + 1}
                className="mb-4 shadow-lg"
                width={Math.min(window.innerWidth - 32, 800)}
              />
            ))}
          </Document>
          {numPages > 0 && (
            <div className="sticky bottom-4 mt-4 bg-background/95 backdrop-blur-sm px-4 py-2 rounded-full border border-border">
              <p className="text-sm text-muted-foreground">
                {numPages} {numPages === 1 ? 'page' : 'pages'}
              </p>
            </div>
          )}
        </div>

        {/* Swipe hint */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none">
          <div className="flex items-center gap-2 text-sm">
            <ChevronLeft className="h-4 w-4 animate-pulse" />
            <span className="hidden sm:inline">Swipe or drag left to close</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResumePanel;
