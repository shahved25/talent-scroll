import { useState, useRef, useEffect } from "react";
import { Heart, FileText, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Candidate } from "@/data/mockData";

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

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play().catch(console.error);
      } else {
        videoRef.current.pause();
      }
    }
  }, [isActive]);

  const handleDoubleTap = async (e: React.TouchEvent | React.MouseEvent) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTapTime.current;

    if (tapLength < 300 && tapLength > 0) {
      // Double tap detected
      e.preventDefault();
      await handleShortlist();
    }

    lastTapTime.current = currentTime;
  };

  const handleShortlist = async () => {
    if (isShortlisted) {
      toast.info("Already shortlisted");
      return;
    }

    try {
      const { error } = await supabase.from("shortlisted_candidates").insert({
        candidate_name: candidate.name,
        candidate_role: candidate.role,
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

  const handleSwipe = () => {
    const swipeDistance = touchEndX.current - touchStartX.current;
    if (swipeDistance > 100) {
      // Swipe right detected
      onSwipeRight();
    }
  };

  return (
    <div
      className="relative h-screen w-full snap-start snap-always overflow-hidden bg-black"
      onTouchStart={handleTouchStart}
      onTouchEnd={(e) => {
        handleTouchEnd(e);
        handleDoubleTap(e);
      }}
      onDoubleClick={handleDoubleTap}
    >
      {/* Video */}
      <video
        ref={videoRef}
        src={candidate.videoUrl}
        className="h-full w-full object-cover"
        loop
        playsInline
        muted
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70" />

      {/* Heart Animation */}
      {showHeartAnimation && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Heart className="h-32 w-32 fill-heart text-heart animate-heart-pop drop-shadow-2xl" />
        </div>
      )}

      {/* Candidate Info */}
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        <h2 className="mb-2 text-3xl font-bold drop-shadow-lg">{candidate.name}</h2>
        <p className="mb-4 text-lg text-white/90 drop-shadow-md">{candidate.role}</p>
        
        {/* Skill Tags */}
        <div className="mb-6 flex flex-wrap gap-2">
          {candidate.skillTags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="bg-white/20 text-white backdrop-blur-sm border-white/30"
            >
              {tag}
            </Badge>
          ))}
        </div>

        {/* Instructions */}
        <div className="flex items-center justify-between text-sm text-white/80">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            <span>Double tap to shortlist</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Swipe right for resume</span>
          </div>
        </div>
      </div>

      {/* Shortlist Indicator */}
      {isShortlisted && (
        <div className="absolute top-6 right-6 flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-white shadow-lg">
          <Heart className="h-5 w-5 fill-current" />
          <span className="font-medium">Shortlisted</span>
        </div>
      )}

      {/* Resume Button (visible on desktop) */}
      <button
        onClick={onSwipeRight}
        className="absolute bottom-24 right-6 hidden md:flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition-transform hover:scale-110"
      >
        <FileText className="h-6 w-6" />
      </button>
    </div>
  );
};

export default VideoPlayer;
