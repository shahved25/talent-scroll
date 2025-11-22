import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import VideoPlayer from "@/components/VideoPlayer";
import ResumePanel from "@/components/ResumePanel";
import { supabase } from "@/integrations/supabase/client";

interface Candidate {
  id: string;
  name: string;
  category: string;
  videoUrl: string;
  resumeUrl: string;
  thumbnailUrl: string | null;
  skillTags: string[];
  resumeScore: number | null;
  videoScore: number | null;
}

const VideoFeed = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCandidates = async () => {
      if (!category) return;

      const { data: categoryData } = await supabase
        .from('categories')
        .select('id, name')
        .eq('slug', category)
        .single();

      if (!categoryData) return;

      const { data } = await supabase
        .from('candidates')
        .select('id, name, video_url, resume_url, thumbnail_url, skill_tags, resume_score, video_score')
        .eq('category_id', categoryData.id);

      if (data) {
        const formattedCandidates = data.map((candidate) => ({
          id: candidate.id,
          name: candidate.name,
          category: categoryData.name,
          videoUrl: candidate.video_url,
          resumeUrl: candidate.resume_url,
          thumbnailUrl: candidate.thumbnail_url,
          skillTags: candidate.skill_tags || [],
          resumeScore: candidate.resume_score,
          videoScore: candidate.video_score,
        }));
        setCandidates(formattedCandidates);
      }
    };

    fetchCandidates();
  }, [category]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const scrollPosition = container.scrollTop;
    const videoHeight = window.innerHeight;
    const newIndex = Math.round(scrollPosition / videoHeight);
    
    if (newIndex !== currentIndex && newIndex < candidates.length) {
      setCurrentIndex(newIndex);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [currentIndex, candidates.length]);

  if (candidates.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background overflow-hidden">
        {/* Animated background */}
        <div className="fixed inset-0 bg-[linear-gradient(to_right,#0a4b3c10_1px,transparent_1px),linear-gradient(to_bottom,#0a4b3c10_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        <div className="fixed top-1/3 right-1/3 w-72 h-72 bg-accent/20 rounded-full blur-3xl animate-float" />
        
        <div className="relative text-center animate-bounce-in">
          <div className="mb-8 relative">
            <div className="text-8xl animate-float">🎥</div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-40 h-40 border-2 border-primary/30 rounded-full animate-ping-slow" />
            </div>
          </div>
          <p className="text-xl text-muted-foreground font-mono mb-6 animate-slide-up-fade">
            &gt; NO_CANDIDATES_FOUND
          </p>
          <Button onClick={() => navigate("/")} className="animate-scale-in" style={{ animationDelay: '0.3s' }}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            BACK_TO_CATEGORIES
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/3 right-1/4 w-40 h-40 bg-secondary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      </div>
      
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/70 via-black/40 to-transparent backdrop-blur-sm animate-slide-up">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          className="text-white hover:bg-white/20 hover:scale-110 transition-all duration-300 animate-scale-in"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/shortlist")}
          className="text-white hover:bg-white/20 hover:scale-110 transition-all duration-300 animate-scale-in relative"
          style={{ animationDelay: '0.1s' }}
        >
          <Heart className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-ping-slow" />
        </Button>
      </header>

      {/* Video Feed */}
      <div
        ref={containerRef}
        className="h-full w-full snap-y snap-mandatory overflow-y-scroll"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {candidates.map((candidate, index) => (
          <VideoPlayer
            key={candidate.id}
            candidate={candidate}
            isActive={index === currentIndex}
            onSwipeRight={() => setShowResumeModal(true)}
          />
        ))}
      </div>

      {/* Resume Panel */}
      <ResumePanel
        isOpen={showResumeModal}
        onClose={() => setShowResumeModal(false)}
        candidate={candidates[currentIndex]}
      />

      {/* Hide scrollbar */}
      <style>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default VideoFeed;
