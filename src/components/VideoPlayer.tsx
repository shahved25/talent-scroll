import { useState, useRef, useEffect } from "react";
import { Heart, FileText, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface Candidate {
  id: string;
  name: string;
  category: string;
  videoUrl: string;
  resumeUrl: string;
  thumbnailUrl: string | null;
  skillTags: string[];
}

interface VideoPlayerProps {
  candidate: Candidate;
  isActive: boolean;
  onSwipeRight: () => void;
}

const VideoPlayer = ({ candidate, isActive, onSwipeRight }: VideoPlayerProps) => {
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const lastTapTime = useRef<number>(0);
  const isDragging = useRef<boolean>(false);
  const mouseStartX = useRef<number>(0);

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play().catch(console.error);
      } else {
        videoRef.current.pause();
      }
    }
  }, [isActive]);

  const handleDoubleTap = async (e: React.TouchEvent) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTapTime.current;

    if (tapLength < 300 && tapLength > 0) {
      // Double tap detected
      e.preventDefault();
      await handleShortlist();
    }

    lastTapTime.current = currentTime;
  };

  const handleDoubleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    await handleShortlist();
  };

  const handleShortlist = async () => {
    if (isShortlisted) {
      toast.info("Already shortlisted");
      return;
    }

    try {
      const { error } = await supabase.from("shortlisted_candidates").insert({
        candidate_name: candidate.name,
        candidate_role: candidate.category,
        video_url: candidate.videoUrl,
        resume_url: candidate.resumeUrl,
        thumbnail_url: candidate.thumbnailUrl,
        skill_tags: candidate.skillTags,
      });

      if (error) throw error;

      setIsShortlisted(true);
      setShowHeartAnimation(true);
      toast.success(`${candidate.name} shortlisted!`);

      setTimeout(() => setShowHeartAnimation(false), 800);
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
    mouseStartX.current = e.clientX;
    isDragging.current = true;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    
    const currentX = e.clientX;
    const distance = currentX - mouseStartX.current;
    
    // Visual feedback could be added here (e.g., slight translation)
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    
    const currentX = e.clientX;
    const distance = currentX - mouseStartX.current;
    
    isDragging.current = false;
    
    if (distance > 100) {
      // Drag right detected
      onSwipeRight();
    }
  };

  const handleSwipe = () => {
    const swipeDistance = touchEndX.current - touchStartX.current;
    if (swipeDistance > 100) {
      // Swipe right detected
      onSwipeRight();
    }
  };

  return (
    <div
      className="relative h-screen w-full snap-start snap-always overflow-hidden bg-black cursor-pointer flex items-center justify-center group"
      onTouchStart={handleTouchStart}
      onTouchEnd={(e) => {
        handleTouchEnd(e);
        handleDoubleTap(e);
      }}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        isDragging.current = false;
      }}
    >
      {/* Animated particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/30 rounded-full animate-ping-slow" />
        <div className="absolute bottom-1/3 right-1/3 w-3 h-3 bg-secondary/30 rounded-full animate-ping-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-2/3 right-1/4 w-2 h-2 bg-accent/30 rounded-full animate-ping-slow" style={{ animationDelay: '2s' }} />
      </div>
      
      <div className="w-full max-w-[56.25vh] px-4">
        <AspectRatio ratio={9 / 16}>
          {/* Video */}
          <video
            ref={videoRef}
            src={candidate.videoUrl}
            className="absolute inset-0 h-full w-full object-cover rounded-xl group-hover:scale-[1.02] transition-transform duration-500"
            loop
            playsInline
          />

          {/* Gradient Overlay with animation */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70 rounded-xl animate-fade-in" />

          {/* Heart Animation */}
          {showHeartAnimation && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative">
                <Heart className="h-32 w-32 fill-heart text-heart animate-heart-pop drop-shadow-2xl" />
                <div className="absolute inset-0 h-32 w-32">
                  <div className="absolute inset-0 rounded-full border-4 border-heart animate-ping-slow" />
                </div>
              </div>
            </div>
          )}

          {/* Candidate Info */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white bg-gradient-to-t from-black via-black/80 to-transparent">
            <h2 className="mb-2 text-3xl font-bold drop-shadow-lg text-primary tracking-wide">{candidate.name}</h2>
            <p className="mb-4 text-lg text-secondary/90 drop-shadow-md font-mono">{candidate.category}</p>
            
            {/* Skill Tags */}
            <div className="mb-6 flex flex-wrap gap-2">
              {candidate.skillTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="bg-primary/20 text-primary backdrop-blur-sm border border-primary/40 font-mono text-xs"
                >
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Instructions */}
            <div className="flex items-center justify-between text-sm text-muted-foreground font-mono">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-accent" />
                <span>DOUBLE_TAP</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-secondary" />
                <span>SWIPE_RIGHT</span>
              </div>
            </div>
          </div>

          {/* Shortlist Indicator */}
          {isShortlisted && (
            <div className="absolute top-6 right-6 flex items-center gap-2 rounded-full bg-accent/90 backdrop-blur-sm px-4 py-2 text-white shadow-[0_0_20px_hsl(280_100%_60%/0.5)] border border-accent animate-glow-pulse">
              <Heart className="h-5 w-5 fill-current" />
              <span className="font-medium font-mono tracking-wide">SHORTLISTED</span>
            </div>
          )}

          {/* Resume Button (visible on desktop) */}
          <button
            onClick={onSwipeRight}
            className="absolute bottom-24 right-6 hidden md:flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_30px_hsl(160_100%_45%/0.5)] transition-all duration-300 hover:scale-110 hover:shadow-[0_0_40px_hsl(160_100%_45%/0.7)] animate-float group"
          >
            <FileText className="h-6 w-6 group-hover:animate-pulse" />
            <div className="absolute inset-0 rounded-full border-2 border-primary/50 animate-ping-slow" />
          </button>
        </AspectRatio>
      </div>
    </div>
  );
};

export default VideoPlayer;
