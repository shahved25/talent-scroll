import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Upload, Video, FileText, ArrowLeft } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CandidateSubmission = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  
  const [formData, setFormData] = useState({
    name: "",
    skills: "",
    categoryId: "",
  });
  
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (data) setCategories(data);
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.categoryId) {
      toast({
        title: "Missing category",
        description: "Please select a category",
        variant: "destructive",
      });
      return;
    }
    
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
      const { data: candidateData, error: insertError } = await supabase
        .from('candidates')
        .insert({
          name: formData.name,
          category_id: formData.categoryId,
          resume_url: resumeUrl,
          video_url: videoUrl,
          skill_tags: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Analyze resume and video with Lovable AI in parallel
      const selectedCategory = categories.find(c => c.id === formData.categoryId);
      if (candidateData && selectedCategory) {
        try {
          // Start both analyses in parallel
          const [resumeAnalysis, videoAnalysis] = await Promise.allSettled([
            supabase.functions.invoke('analyze-resume', {
              body: {
                resumeUrl,
                candidateName: formData.name,
                category: selectedCategory.name,
              }
            }),
            supabase.functions.invoke('transcribe-and-grade-video', {
              body: {
                videoUrl,
                candidateName: formData.name,
                category: selectedCategory.name,
              }
            })
          ]);

          const updates: any = {};

          // Handle resume score
          if (resumeAnalysis.status === 'fulfilled' && resumeAnalysis.value.data?.score) {
            updates.resume_score = resumeAnalysis.value.data.score;
          }

          // Handle video score
          if (videoAnalysis.status === 'fulfilled' && videoAnalysis.value.data?.score) {
            updates.video_score = videoAnalysis.value.data.score;
          }

          // Update candidate with both scores
          if (Object.keys(updates).length > 0) {
            await supabase
              .from('candidates')
              .update(updates)
              .eq('id', candidateData.id);
          }
        } catch (error) {
          console.error('Error analyzing resume/video:', error);
          // Continue even if analysis fails
        }
      }

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
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Animated cyber grid background */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#0a4b3c10_1px,transparent_1px),linear-gradient(to_bottom,#0a4b3c10_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      
      {/* Floating orbs */}
      <div className="fixed top-1/4 right-1/4 w-72 h-72 bg-secondary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '0.5s' }} />
      <div className="fixed bottom-1/4 left-1/4 w-64 h-64 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
      
      <div className="relative container mx-auto px-4 py-8 max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6 hover:bg-primary/10 hover:scale-105 transition-all duration-300 animate-slide-in-left"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          <span className="font-mono">BACK</span>
        </Button>

        <div className="bg-card/50 backdrop-blur-sm border-2 border-primary/30 rounded-lg p-8 hover:border-primary/50 transition-all duration-500 relative overflow-hidden animate-scale-in">
          {/* Animated corner accents */}
          <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-primary/40 animate-pulse" />
          <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-primary/40 animate-pulse" style={{ animationDelay: '0.5s' }} />
          
          <h1 className="text-3xl font-bold text-primary mb-2 tracking-wide animate-slide-up-fade">SUBMIT_PROFILE</h1>
          <p className="text-muted-foreground mb-8 font-mono animate-fade-in" style={{ animationDelay: '0.2s' }}>
            &gt; Upload_credentials_for_discovery
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2 animate-slide-up-fade" style={{ animationDelay: '0.3s' }}>
              <Label htmlFor="name" className="text-primary font-mono">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="John Doe"
                className="border-primary/30 focus:border-primary transition-all duration-300"
              />
            </div>

            <div className="space-y-2 animate-slide-up-fade" style={{ animationDelay: '0.4s' }}>
              <Label htmlFor="category" className="text-primary font-mono">Category</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                required
              >
                <SelectTrigger id="category" className="border-primary/30 focus:border-primary transition-all duration-300">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="bg-card/95 backdrop-blur-sm border-primary/30 z-50">
                  {categories.map((category) => (
                    <SelectItem 
                      key={category.id} 
                      value={category.id}
                      className="hover:bg-primary/10 focus:bg-primary/20 cursor-pointer transition-all duration-200"
                    >
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 animate-slide-up-fade" style={{ animationDelay: '0.5s' }}>
              <Label htmlFor="skills" className="text-primary font-mono">Skills (comma-separated)</Label>
              <Textarea
                id="skills"
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                placeholder="Figma, Adobe XD, UI Design, Prototyping"
                rows={3}
                className="border-primary/30 focus:border-primary transition-all duration-300"
              />
            </div>

            <div className="space-y-2 animate-slide-up-fade" style={{ animationDelay: '0.6s' }}>
              <Label htmlFor="resume" className="text-primary font-mono">Resume (PDF)</Label>
              <div className="relative group">
                <Input
                  id="resume"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                  required
                  className="cursor-pointer border-primary/30 focus:border-primary transition-all duration-300 group-hover:border-primary/50"
                />
                <FileText className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none group-hover:text-primary transition-colors duration-300" />
              </div>
              {resumeFile && (
                <p className="text-sm text-primary font-mono animate-fade-in flex items-center gap-2">
                  <span className="animate-pulse">✓</span> {resumeFile.name}
                </p>
              )}
            </div>

            <div className="space-y-2 animate-slide-up-fade" style={{ animationDelay: '0.7s' }}>
              <Label htmlFor="video" className="text-primary font-mono">Introduction Video (MP4, MOV)</Label>
              <div className="relative group">
                <Input
                  id="video"
                  type="file"
                  accept="video/*"
                  onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                  required
                  className="cursor-pointer border-primary/30 focus:border-primary transition-all duration-300 group-hover:border-primary/50"
                />
                <Video className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none group-hover:text-primary transition-colors duration-300" />
              </div>
              {videoFile && (
                <p className="text-sm text-primary font-mono animate-fade-in flex items-center gap-2">
                  <span className="animate-pulse">✓</span> {videoFile.name}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full font-mono tracking-wide relative overflow-hidden group animate-bounce-in"
              size="lg"
              style={{ animationDelay: '0.8s' }}
            >
              {/* Button glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%] animate-gradient-x opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
              
              {isSubmitting ? (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    UPLOADING...
                  </div>
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4 group-hover:animate-bounce" />
                  SUBMIT_PROFILE
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
