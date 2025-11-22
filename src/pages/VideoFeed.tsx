import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import VideoPlayer from "@/components/VideoPlayer";
import ResumePanel from "@/components/ResumePanel";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Candidate {
  id: string;
  name: string;
  role: string;
  videoUrl: string;
  resumeUrl: string;
  thumbnailUrl?: string;
  skillTags: string[];
}

const VideoFeed = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCandidates = async () => {
      if (!category) return;
      
      setLoading(true);
      try {
        // First get the category ID from the slug
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', category)
          .single();

        if (categoryError) throw categoryError;

        // Then get candidate IDs from the junction table
        const { data: candidateCategoryData, error: junctionError } = await supabase
          .from('candidate_categories')
          .select('candidate_id')
          .eq('category_id', categoryData.id);

        if (junctionError) throw junctionError;

        if (!candidateCategoryData || candidateCategoryData.length === 0) {
          setCandidates([]);
          setLoading(false);
          return;
        }

        const candidateIds = candidateCategoryData.map(cc => cc.candidate_id);

        // Finally get the full candidate data
        const { data: candidatesData, error: candidatesError } = await supabase
          .from('candidates')
          .select('*')
          .in('id', candidateIds);

        if (candidatesError) throw candidatesError;

        // Transform to match our interface
        const transformedCandidates: Candidate[] = (candidatesData || []).map(c => ({
          id: c.id,
          name: c.name,
          role: c.role,
          videoUrl: c.video_url,
          resumeUrl: c.resume_url,
          thumbnailUrl: c.thumbnail_url || undefined,
          skillTags: c.skill_tags || []
        }));

        setCandidates(transformedCandidates);
      } catch (error) {
        console.error('Error fetching candidates:', error);
        toast({
          title: "Error",
          description: "Failed to load candidates",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, [category, toast]);

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-xl text-muted-foreground">Loading candidates...</p>
        </div>
      </div>
    );
  }

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
