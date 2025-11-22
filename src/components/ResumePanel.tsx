import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, X, ChevronLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Document, Page, pdfjs } from 'react-pdf';
import { ResumeScore } from "@/components/ResumeScore";
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
      {/* Backdrop with animated overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-all duration-500 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      >
        {/* Animated particles in backdrop */}
        <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-primary/40 rounded-full animate-ping-slow" />
        <div className="absolute bottom-1/3 right-1/4 w-3 h-3 bg-secondary/40 rounded-full animate-ping-slow" style={{ animationDelay: '1s' }} />
      </div>

      {/* Sliding Panel */}
      <div
        ref={panelRef}
        className={`fixed inset-y-0 right-0 z-50 w-full bg-background shadow-2xl transition-all duration-500 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } animate-slide-in-right`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-primary/20 bg-background/95 backdrop-blur-md px-6 py-4 animate-fade-in">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="gap-2 hover:scale-110 transition-transform duration-300"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <div className="flex-1 text-center animate-scale-in" style={{ animationDelay: '0.1s' }}>
            <h2 className="text-xl font-bold text-primary tracking-wide">
              {candidate.name.toUpperCase()}
            </h2>
            <p className="text-sm text-muted-foreground font-mono">&gt; {candidate.category}</p>
          </div>

          <Button 
            onClick={handleShortlist} 
            className="gap-2 hover:scale-110 transition-all duration-300 animate-scale-in relative overflow-hidden group"
            style={{ animationDelay: '0.2s' }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-accent via-primary to-accent bg-[length:200%_100%] animate-gradient-x opacity-0 group-hover:opacity-30 transition-opacity duration-500" />
            <Heart className="h-4 w-4 relative z-10" />
            <span className="hidden sm:inline relative z-10">SHORTLIST</span>
          </Button>
        </div>

        {/* PDF Viewer */}
        <div className="h-[calc(100vh-73px)] w-full overflow-auto bg-muted/30 flex flex-col items-center py-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <Document
            file={candidate.resumeUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex items-center justify-center h-full">
                <div className="relative">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-primary/20 animate-ping-slow" />
                </div>
              </div>
            }
            error={
              <div className="flex items-center justify-center h-full text-destructive animate-bounce-in">
                <p className="font-mono">&gt; FAILED_TO_LOAD_PDF</p>
              </div>
            }
          >
            {Array.from(new Array(numPages), (el, index) => (
              <div
                key={`page_${index + 1}`}
                className="animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <Page
                  pageNumber={index + 1}
                  className="mb-4 shadow-[0_0_30px_hsl(160_100%_45%/0.1)] border-2 border-primary/20 rounded-lg overflow-hidden hover:scale-105 transition-transform duration-500"
                  width={Math.min(window.innerWidth - 32, 800)}
                />
              </div>
            ))}
          </Document>
          {numPages > 0 && (
            <div className="sticky bottom-4 mt-4 bg-background/95 backdrop-blur-sm px-6 py-3 rounded-full border-2 border-primary/30 shadow-[0_0_20px_hsl(160_100%_45%/0.2)] animate-bounce-in">
              <p className="text-sm text-primary font-mono font-bold">
                {numPages} {numPages === 1 ? 'PAGE' : 'PAGES'}
              </p>
            </div>
          )}
        </div>

        {/* Swipe hint with animation */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none animate-slide-in-left">
          <div className="flex items-center gap-2 text-sm font-mono">
            <ChevronLeft className="h-4 w-4 animate-pulse" />
            <span className="hidden sm:inline">&lt; SWIPE_TO_CLOSE</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResumePanel;
