import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Play, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ResumeModal from "@/components/ResumeModal";

interface ShortlistedCandidate {
  id: string;
  candidate_name: string;
  candidate_role: string;
  video_url: string;
  resume_url: string;
  thumbnail_url?: string;
  skill_tags: string[];
  created_at: string;
}

const Shortlist = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<ShortlistedCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<ShortlistedCandidate | null>(null);
  const [showResumeModal, setShowResumeModal] = useState(false);

  useEffect(() => {
    fetchShortlistedCandidates();
  }, []);

  const fetchShortlistedCandidates = async () => {
    try {
      const { data, error } = await supabase
        .from("shortlisted_candidates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCandidates(data || []);
    } catch (error) {
      console.error("Error fetching shortlist:", error);
      toast.error("Failed to load shortlist");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id: string, name: string) => {
    try {
      const { error } = await supabase
        .from("shortlisted_candidates")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setCandidates(candidates.filter((c) => c.id !== id));
      toast.success(`${name} removed from shortlist`);
    } catch (error) {
      console.error("Error removing candidate:", error);
      toast.error("Failed to remove candidate");
    }
  };

  const handleViewResume = (candidate: ShortlistedCandidate) => {
    setSelectedCandidate(candidate);
    setShowResumeModal(true);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-lg text-muted-foreground">Loading shortlist...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center gap-4 px-6 py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">
            Shortlist ({candidates.length})
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {candidates.length === 0 ? (
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-center">
              <p className="text-xl text-muted-foreground mb-4">
                No candidates shortlisted yet
              </p>
              <Button onClick={() => navigate("/")}>
                Browse Candidates
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {candidates.map((candidate) => (
              <Card key={candidate.id} className="overflow-hidden group">
                {/* Thumbnail */}
                <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                  {candidate.thumbnail_url ? (
                    <img
                      src={candidate.thumbnail_url}
                      alt={candidate.candidate_name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                      <span className="text-6xl">👤</span>
                    </div>
                  )}
                  
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/0 transition-all group-hover:bg-black/40" />
                </div>

                {/* Info */}
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-foreground mb-1">
                    {candidate.candidate_name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {candidate.candidate_role}
                  </p>

                  {/* Skill Tags */}
                  <div className="mb-4 flex flex-wrap gap-2">
                    {candidate.skill_tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {candidate.skill_tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{candidate.skill_tags.length - 3}
                      </Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => window.open(candidate.video_url, "_blank")}
                    >
                      <Play className="h-4 w-4" />
                      Video
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => handleViewResume(candidate)}
                    >
                      <FileText className="h-4 w-4" />
                      Resume
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() =>
                        handleRemove(candidate.id, candidate.candidate_name)
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Resume Modal */}
      {selectedCandidate && (
        <ResumeModal
          isOpen={showResumeModal}
          onClose={() => {
            setShowResumeModal(false);
            setSelectedCandidate(null);
          }}
          candidate={{
            id: selectedCandidate.id,
            name: selectedCandidate.candidate_name,
            role: selectedCandidate.candidate_role,
            category: "",
            videoUrl: selectedCandidate.video_url,
            resumeUrl: selectedCandidate.resume_url,
            thumbnailUrl: selectedCandidate.thumbnail_url,
            skillTags: selectedCandidate.skill_tags,
          }}
        />
      )}
    </div>
  );
};

export default Shortlist;
