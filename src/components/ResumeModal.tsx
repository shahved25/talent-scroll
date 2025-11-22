import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Candidate } from "@/data/mockData";

interface ResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
}

const ResumeModal = ({ isOpen, onClose, candidate }: ResumeModalProps) => {
  if (!candidate) return null;

  const handleShortlist = async () => {
    try {
      const { error } = await supabase.from("shortlisted_candidates").insert({
        candidate_name: candidate.name,
        candidate_role: candidate.role,
        video_url: candidate.videoUrl,
        resume_url: candidate.resumeUrl,
        thumbnail_url: candidate.thumbnailUrl,
        skill_tags: candidate.skillTags,
      });

      if (error) {
        // Check if already shortlisted
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">{candidate.name}</DialogTitle>
              <p className="text-muted-foreground mt-1">{candidate.role}</p>
            </div>
            <Button onClick={handleShortlist} className="gap-2">
              <Heart className="h-4 w-4" />
              Shortlist
            </Button>
          </div>
        </DialogHeader>
        
        {/* PDF Viewer */}
        <div className="flex-1 overflow-hidden px-6 pb-6">
          <iframe
            src={candidate.resumeUrl}
            className="h-full w-full rounded-lg border"
            title={`${candidate.name}'s Resume`}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResumeModal;
