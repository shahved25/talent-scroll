import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Play, FileText, Trash2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ResumePanel from "@/components/ResumePanel";

interface ShortlistedCandidate {
  id: string;
  candidate_name: string;
  candidate_role: string;
  video_url: string;
  resume_url: string;
  thumbnail_url?: string;
  skill_tags: string[];
  created_at: string;
  resume_score?: number | null;
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
      <div className="flex min-h-screen items-center justify-center bg-background overflow-hidden">
        {/* Animated background */}
        <div className="fixed inset-0 bg-[linear-gradient(to_right,#0a4b3c10_1px,transparent_1px),linear-gradient(to_bottom,#0a4b3c10_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        <div className="fixed top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="fixed bottom-1/4 right-1/4 w-80 h-80 bg-secondary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        
        <div className="relative text-center">
          <div className="relative mb-6">
            <div className="w-24 h-24 mx-auto border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin" style={{ animationDirection: 'reverse' }} />
            </div>
          </div>
          <p className="text-lg text-muted-foreground font-mono animate-pulse">LOADING_SHORTLIST...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Animated cyber grid background */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#0a4b3c10_1px,transparent_1px),linear-gradient(to_bottom,#0a4b3c10_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      
      {/* Floating orbs */}
      <div className="fixed top-20 right-10 w-64 h-64 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '0s' }} />
      <div className="fixed bottom-20 left-10 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
      
      {/* Header */}
      <header className="relative border-b border-primary/20 bg-background/50 backdrop-blur-md animate-slide-up">
        <div className="container mx-auto flex items-center gap-4 px-6 py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="hover:bg-primary/10 hover:scale-110 transition-all duration-300 animate-scale-in"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-primary tracking-wider font-mono animate-slide-in-left" style={{ animationDelay: '0.1s' }}>
            SHORTLIST_({candidates.length})
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative container mx-auto px-6 py-8">
        {candidates.length === 0 ? (
          <div className="flex min-h-[60vh] items-center justify-center animate-fade-in">
            <div className="text-center">
              <div className="mb-6 relative">
                <Heart className="h-24 w-24 text-primary/20 mx-auto animate-pulse" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 border-2 border-primary/30 rounded-full animate-ping-slow" />
                </div>
              </div>
              <p className="text-xl text-muted-foreground mb-4 font-mono animate-slide-up-fade">
                &gt; NO_CANDIDATES_SHORTLISTED
              </p>
              <Button onClick={() => navigate("/")} className="animate-bounce-in" style={{ animationDelay: '0.3s' }}>
                BROWSE_CANDIDATES
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {candidates.map((candidate, index) => (
              <Card 
                key={candidate.id} 
                className="overflow-hidden group border-2 border-primary/30 bg-card/50 backdrop-blur-sm hover:border-primary hover:shadow-[0_0_30px_hsl(160_100%_45%/0.2)] transition-all duration-500 animate-scale-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Thumbnail */}
                <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                  {candidate.thumbnail_url ? (
                    <img
                      src={candidate.thumbnail_url}
                      alt={candidate.candidate_name}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 animate-gradient-x">
                      <span className="text-6xl animate-float">👤</span>
                    </div>
                  )}
                  
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 border-2 border-primary/0 group-hover:border-primary/50 transition-all duration-500 pointer-events-none" />
                </div>

                {/* Info */}
                <div className="p-6 border-t border-primary/20 relative">
                  {/* Animated corner accent */}
                  <div className="absolute top-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-transparent group-hover:w-full transition-all duration-500" />
                  
                  <h3 className="text-xl font-bold text-primary mb-1 tracking-wide group-hover:text-secondary transition-colors duration-300">
                    {candidate.candidate_name.toUpperCase()}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 font-mono">
                    &gt; {candidate.candidate_role}
                  </p>

                  {/* Skill Tags */}
                  <div className="mb-4 flex flex-wrap gap-2">
                    {candidate.skill_tags.slice(0, 3).map((tag, tagIndex) => (
                      <Badge 
                        key={tag} 
                        variant="secondary" 
                        className="text-xs bg-primary/20 text-primary border border-primary/40 font-mono hover:bg-primary/30 transition-all duration-300 animate-fade-in"
                        style={{ animationDelay: `${(index * 0.05) + (tagIndex * 0.1)}s` }}
                      >
                        {tag}
                      </Badge>
                    ))}
                    {candidate.skill_tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs bg-secondary/20 text-secondary border border-secondary/40 font-mono animate-fade-in" style={{ animationDelay: `${(index * 0.05) + 0.4}s` }}>
                        +{candidate.skill_tags.length - 3}
                      </Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2 font-mono hover:scale-105 transition-all duration-300"
                      onClick={() => window.open(candidate.video_url, "_blank")}
                    >
                      <Play className="h-4 w-4" />
                      PLAY
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2 font-mono hover:scale-105 transition-all duration-300"
                      onClick={() => handleViewResume(candidate)}
                    >
                      <FileText className="h-4 w-4" />
                      VIEW
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 hover:scale-110 hover:rotate-12 transition-all duration-300"
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

      {/* Resume Panel */}
      {selectedCandidate && (
        <ResumePanel
          isOpen={showResumeModal}
          onClose={() => {
            setShowResumeModal(false);
            setSelectedCandidate(null);
          }}
          candidate={{
            id: selectedCandidate.id,
            name: selectedCandidate.candidate_name,
            category: selectedCandidate.candidate_role,
            videoUrl: selectedCandidate.video_url,
            resumeUrl: selectedCandidate.resume_url,
            thumbnailUrl: selectedCandidate.thumbnail_url,
            skillTags: selectedCandidate.skill_tags,
            resumeScore: selectedCandidate.resume_score || null,
          }}
        />
      )}
    </div>
  );
};

export default Shortlist;
