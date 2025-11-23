import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Heart, ChevronLeft, ExternalLink, Folder } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import CandidateInsights from "@/components/CandidateInsights";

interface Candidate {
  id: string;
  name: string;
  category: string;
  videoUrl: string;
  resumeUrl: string;
  thumbnailUrl: string | null;
  skillTags: string[];
  resumeScore: number | null;
  videoScore?: number | null;
  portfolioUrls: string[];
}

interface PortfolioPanelProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
}

const PortfolioPanel = ({ isOpen, onClose, candidate }: PortfolioPanelProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

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
      onClose();
    }
  };

  const getGradientForUrl = (url: string, index: number) => {
    const gradients = [
      "from-violet-500/20 via-purple-500/20 to-fuchsia-500/20",
      "from-cyan-500/20 via-blue-500/20 to-indigo-500/20",
      "from-emerald-500/20 via-teal-500/20 to-cyan-500/20",
      "from-orange-500/20 via-red-500/20 to-pink-500/20",
      "from-lime-500/20 via-green-500/20 to-emerald-500/20",
      "from-amber-500/20 via-yellow-500/20 to-orange-500/20",
    ];
    return gradients[index % gradients.length];
  };

  const getDomainFromUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url;
    }
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
            <p className="text-sm text-muted-foreground font-mono mb-3">&gt; {candidate.category}</p>
            <CandidateInsights 
              resumeScore={candidate.resumeScore} 
              videoScore={candidate.videoScore || null}
              className="max-w-2xl mx-auto"
            />
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

        {/* Portfolio Content */}
        <div className="h-[calc(100vh-73px)] w-full overflow-auto bg-muted/30 px-4 py-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="max-w-7xl mx-auto">
            <div className="mb-8 text-center animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <div className="inline-flex items-center gap-3 mb-2">
                <Folder className="h-8 w-8 text-accent animate-float" />
                <h3 className="text-3xl font-bold text-foreground tracking-tight">PROJECT PORTFOLIO</h3>
              </div>
              <p className="text-muted-foreground font-mono mt-2">
                &gt; {candidate.portfolioUrls.length} {candidate.portfolioUrls.length === 1 ? 'PROJECT' : 'PROJECTS'}
              </p>
            </div>

            {candidate.portfolioUrls.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 animate-bounce-in">
                <div className="text-6xl mb-4 animate-float">📂</div>
                <p className="text-xl text-muted-foreground font-mono">
                  &gt; NO_PROJECTS_SUBMITTED
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {candidate.portfolioUrls.map((url, index) => (
                  <div
                    key={index}
                    className="group relative overflow-hidden rounded-xl border-2 border-primary/20 bg-gradient-to-br shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:border-primary/50 animate-scale-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Gradient Background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${getGradientForUrl(url, index)} opacity-50 group-hover:opacity-70 transition-opacity duration-500`} />
                    
                    {/* Animated border glow */}
                    <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="absolute inset-0 rounded-xl border-2 border-primary/50 animate-pulse" />
                    </div>

                    {/* Content */}
                    <div className="relative p-6 flex flex-col h-full min-h-[200px] backdrop-blur-sm">
                      {/* Project number badge */}
                      <div className="absolute top-3 right-3 w-10 h-10 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/40 flex items-center justify-center font-mono font-bold text-primary animate-spin-slow">
                        {index + 1}
                      </div>

                      <div className="flex-1 flex flex-col justify-center mb-4">
                        <div className="mb-3">
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background/50 backdrop-blur-sm border border-primary/30 mb-3">
                            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                            <span className="text-xs font-mono text-muted-foreground">LIVE</span>
                          </div>
                        </div>
                        
                        <h4 className="text-lg font-bold text-foreground mb-2 break-all group-hover:text-primary transition-colors duration-300">
                          {getDomainFromUrl(url)}
                        </h4>
                        
                        <p className="text-xs text-muted-foreground font-mono break-all line-clamp-2 opacity-70 group-hover:opacity-100 transition-opacity duration-300">
                          {url}
                        </p>
                      </div>

                      <Button
                        onClick={() => window.open(url, '_blank')}
                        className="w-full gap-2 hover:gap-3 transition-all duration-300 bg-primary/90 hover:bg-primary relative overflow-hidden group/btn"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-gradient-x opacity-0 group-hover/btn:opacity-30 transition-opacity duration-500" />
                        <span className="relative z-10">VISIT PROJECT</span>
                        <ExternalLink className="h-4 w-4 relative z-10 group-hover/btn:rotate-12 transition-transform duration-300" />
                      </Button>
                    </div>

                    {/* Hover particles */}
                    <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-accent/50 rounded-full animate-ping-slow" />
                      <div className="absolute bottom-1/3 right-1/3 w-1 h-1 bg-primary/50 rounded-full animate-ping-slow" style={{ animationDelay: '0.5s' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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

export default PortfolioPanel;
