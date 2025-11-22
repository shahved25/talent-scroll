import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, X, ChevronLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Document, Page, pdfjs } from 'react-pdf';
import { AspectRatio } from "@/components/ui/aspect-ratio";
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
        className={`fixed inset-0 z-50 w-full bg-black shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <div className="flex-1 text-center">
            <h2 className="text-xl font-semibold text-white drop-shadow-lg">
              {candidate.name}
            </h2>
            <p className="text-sm text-white/90 drop-shadow-md">{candidate.category}</p>
          </div>

          <Button 
            onClick={handleShortlist} 
            className="gap-2 bg-primary text-primary-foreground hover:scale-110 transition-transform"
          >
            <Heart className="h-4 w-4" />
            <span className="hidden sm:inline">Shortlist</span>
          </Button>
        </div>

        {/* PDF Viewer - Centered 9:16 */}
        <div className="h-screen w-full flex items-center justify-center bg-black">
          <div className="w-full max-w-[56.25vh] px-4">
            <AspectRatio ratio={9 / 16}>
              <div className="h-full w-full overflow-auto bg-white rounded-xl">
                <Document
                  file={candidate.resumeUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  loading={
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  }
                  error={
                    <div className="flex items-center justify-center h-full text-destructive p-4 text-center">
                      <p>Failed to load PDF. Please try again.</p>
                    </div>
                  }
                  className="h-full"
                >
                  {Array.from(new Array(numPages), (el, index) => (
                    <Page
                      key={`page_${index + 1}`}
                      pageNumber={index + 1}
                      className="mb-2"
                      width={Math.min(window.innerWidth * 0.9, 600)}
                    />
                  ))}
                </Document>
              </div>
            </AspectRatio>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResumePanel;
