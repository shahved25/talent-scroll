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
        .select('id')
        .eq('slug', category)
        .single();

      if (!categoryData) return;

      const { data } = await supabase
        .from('candidate_categories')
        .select(`
          candidates (
            id,
            name,
            video_url,
            resume_url,
            thumbnail_url,
            skill_tags
          ),
          categories (
            name
          )
        `)
        .eq('category_id', categoryData.id);

      if (data) {
        const formattedCandidates = data
          .filter(item => item.candidates)
          .map((item: any) => ({
            id: item.candidates.id,
            name: item.candidates.name,
            category: item.categories?.name || '',
            videoUrl: item.candidates.video_url,
            resumeUrl: item.candidates.resume_url,
            thumbnailUrl: item.candidates.thumbnail_url,
            skillTags: item.candidates.skill_tags || [],
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-xl text-muted-foreground">No candidates found</p>
          <Button onClick={() => navigate("/")} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Categories
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          className="text-white hover:bg-white/20"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/shortlist")}
          className="text-white hover:bg-white/20"
        >
          <Heart className="h-6 w-6" />
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
