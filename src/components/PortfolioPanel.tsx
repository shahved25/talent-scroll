import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, ChevronLeft, ExternalLink, Loader2, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
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
  portfolioUrls: string[] | null;
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
  const [screenshots, setScreenshots] = useState<Record<string, string>>({});
  const [loadingScreenshots, setLoadingScreenshots] = useState<Record<string, boolean>>({});
  const [errorScreenshots, setErrorScreenshots] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      if (candidate?.portfolioUrls) {
        loadScreenshots(candidate.portfolioUrls);
      }
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, candidate]);

  const loadScreenshots = async (urls: string[]) => {
    const newLoadingState: Record<string, boolean> = {};
    urls.forEach(url => {
      newLoadingState[url] = true;
    });
    setLoadingScreenshots(newLoadingState);

    for (const url of urls) {
      try {
        const { data, error } = await supabase.functions.invoke('generate-screenshot', {
          body: { url }
        });

        if (error) throw error;

        // Handle graceful fallback from edge function
        if (data.fallback || !data.screenshotUrl) {
          console.log('Screenshot unavailable for', url, '- using fallback');
          setErrorScreenshots(prev => ({
            ...prev,
            [url]: true
          }));
        } else {
          setScreenshots(prev => ({
            ...prev,
            [url]: data.screenshotUrl
          }));
        }
        
        setLoadingScreenshots(prev => ({
          ...prev,
          [url]: false
        }));
      } catch (error) {
        console.error('Error loading screenshot for', url, error);
        setErrorScreenshots(prev => ({
          ...prev,
          [url]: true
        }));
        setLoadingScreenshots(prev => ({
          ...prev,
          [url]: false
        }));
      }
    }
  };

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

  const getDomainName = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return url;
    }
  };

  const portfolioUrls = candidate.portfolioUrls || [];

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-all duration-500 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      >
        <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-primary/40 rounded-full animate-ping-slow" />
        <div className="absolute bottom-1/3 right-1/4 w-3 h-3 bg-secondary/40 rounded-full animate-ping-slow" style={{ animationDelay: '1s' }} />
      </div>

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
            <Badge variant="secondary" className="mt-2 bg-primary/10 text-primary border border-primary/30">
              <Briefcase className="h-3 w-3 mr-1" />
              {portfolioUrls.length} {portfolioUrls.length === 1 ? 'PROJECT' : 'PROJECTS'}
            </Badge>
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

        <div className="h-[calc(100vh-73px)] w-full overflow-auto bg-muted/30 p-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          {portfolioUrls.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center animate-bounce-in">
              <div className="text-6xl mb-4 animate-float">🚀</div>
              <p className="text-xl text-muted-foreground font-mono">&gt; NO_PROJECTS_SHOWCASED_YET</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
              {portfolioUrls.map((url, index) => (
                <div
                  key={url}
                  className="group relative bg-card border-2 border-primary/20 rounded-lg overflow-hidden hover:border-primary/50 transition-all duration-500 hover:scale-105 hover:shadow-[0_0_30px_hsl(160_100%_45%/0.3)] animate-scale-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    {loadingScreenshots[url] ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative">
                          <Loader2 className="h-12 w-12 animate-spin text-primary" />
                          <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-primary/20 animate-ping-slow" />
                        </div>
                      </div>
                    ) : errorScreenshots[url] ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/50">
                        <div className="text-4xl">🌐</div>
                        <p className="text-sm text-muted-foreground font-mono">&gt; PREVIEW_UNAVAILABLE</p>
                      </div>
                    ) : screenshots[url] ? (
                      <img
                        src={screenshots[url]}
                        alt={`Screenshot of ${getDomainName(url)}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : null}
                    
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  <div className="p-4 bg-card/95 backdrop-blur-sm">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-mono text-primary font-semibold truncate">
                          {getDomainName(url)}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {url}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => window.open(url, '_blank')}
                        className="gap-2 hover:scale-110 transition-all duration-300 relative overflow-hidden group/btn"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-gradient-x opacity-0 group-hover/btn:opacity-30 transition-opacity duration-500" />
                        <span className="relative z-10">VISIT</span>
                        <ExternalLink className="h-3 w-3 relative z-10" />
                      </Button>
                    </div>
                  </div>

                  <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-2 h-2 rounded-full bg-primary animate-ping-slow" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

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