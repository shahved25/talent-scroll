import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Upload, Video, FileText, ArrowLeft } from "lucide-react";

const CandidateSubmission = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    skills: "",
  });
  
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resumeFile || !videoFile) {
      toast({
        title: "Missing files",
        description: "Please upload both resume and video",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload resume
      const resumeExt = resumeFile.name.split('.').pop();
      const resumePath = `${crypto.randomUUID()}.${resumeExt}`;
      const { error: resumeError } = await supabase.storage
        .from('resumes')
        .upload(resumePath, resumeFile);

      if (resumeError) throw resumeError;

      // Upload video
      const videoExt = videoFile.name.split('.').pop();
      const videoPath = `${crypto.randomUUID()}.${videoExt}`;
      const { error: videoError } = await supabase.storage
        .from('videos')
        .upload(videoPath, videoFile);

      if (videoError) throw videoError;

      // Get public URLs
      const { data: { publicUrl: resumeUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(resumePath);

      const { data: { publicUrl: videoUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(videoPath);

      // Insert candidate
      const { error: insertError } = await supabase
        .from('candidates')
        .insert({
          name: formData.name,
          role: formData.role,
          resume_url: resumeUrl,
          video_url: videoUrl,
          skill_tags: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
        });

      if (insertError) throw insertError;

      toast({
        title: "Success!",
        description: "Your profile has been submitted successfully",
      });

      navigate('/');
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Error",
        description: "Failed to submit your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="bg-card border border-border rounded-lg p-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Submit Your Profile</h1>
          <p className="text-muted-foreground mb-8">
            Share your information to get discovered by potential employers
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role/Title</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                required
                placeholder="UI/UX Designer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills">Skills (comma-separated)</Label>
              <Textarea
                id="skills"
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                placeholder="Figma, Adobe XD, UI Design, Prototyping"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resume">Resume (PDF)</Label>
              <div className="relative">
                <Input
                  id="resume"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                  required
                  className="cursor-pointer"
                />
                <FileText className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
              {resumeFile && (
                <p className="text-sm text-muted-foreground">{resumeFile.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="video">Introduction Video (MP4, MOV)</Label>
              <div className="relative">
                <Input
                  id="video"
                  type="file"
                  accept="video/*"
                  onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                  required
                  className="cursor-pointer"
                />
                <Video className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
              {videoFile && (
                <p className="text-sm text-muted-foreground">{videoFile.name}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? (
                <>Submitting...</>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Submit Profile
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CandidateSubmission;
