import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Loader2, TrendingUp, Award, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ResumeScoreProps {
  resumeUrl: string;
  candidateName: string;
  category: string;
  variant?: "compact" | "detailed";
}

interface Analysis {
  overall_score: number;
  technical_skills_score: number;
  experience_score: number;
  education_score: number;
  projects_score: number;
  presentation_score: number;
  strengths: string[];
  improvements: string[];
  summary: string;
}

export const ResumeScore = ({ resumeUrl, candidateName, category, variant = "compact" }: ResumeScoreProps) => {
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const analyzeResume = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: funcError } = await supabase.functions.invoke('analyze-resume', {
          body: { resumeUrl, candidateName, category }
        });

        if (funcError) throw funcError;
        if (!data.success) throw new Error(data.error || 'Analysis failed');

        setAnalysis(data.analysis);
      } catch (err) {
        console.error('Error analyzing resume:', err);
        setError(err instanceof Error ? err.message : 'Failed to analyze resume');
      } finally {
        setLoading(false);
      }
    };

    analyzeResume();
  }, [resumeUrl, candidateName, category]);

  if (loading) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-muted/30 backdrop-blur-sm rounded-lg border border-primary/20 animate-pulse">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground font-mono">ANALYZING_RESUME...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-destructive/10 backdrop-blur-sm rounded-lg border border-destructive/30 animate-fade-in">
        <AlertCircle className="h-5 w-5 text-destructive" />
        <span className="text-sm text-destructive font-mono">{error}</span>
      </div>
    );
  }

  if (!analysis) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-primary";
    if (score >= 70) return "text-secondary";
    if (score >= 60) return "text-accent";
    return "text-muted-foreground";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { label: "EXCEPTIONAL", color: "bg-primary/20 text-primary border-primary/40" };
    if (score >= 70) return { label: "STRONG", color: "bg-secondary/20 text-secondary border-secondary/40" };
    if (score >= 60) return { label: "GOOD", color: "bg-accent/20 text-accent border-accent/40" };
    return { label: "NEEDS_WORK", color: "bg-muted text-muted-foreground border-muted-foreground/40" };
  };

  const badge = getScoreBadge(analysis.overall_score);

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-card/50 backdrop-blur-sm rounded-lg border-2 border-primary/30 hover:border-primary/50 transition-all duration-300 animate-scale-in group">
        <div className="relative">
          <Award className="h-6 w-6 text-primary animate-glow-pulse" />
          <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping-slow" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-2xl font-bold ${getScoreColor(analysis.overall_score)} tracking-wider`}>
              {analysis.overall_score}
            </span>
            <span className="text-sm text-muted-foreground font-mono">/100</span>
          </div>
          <Badge variant="secondary" className={`text-xs ${badge.color} font-mono border`}>
            {badge.label}
          </Badge>
        </div>
        <TrendingUp className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
    );
  }

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm border-2 border-primary/30 animate-scale-in space-y-6">
      {/* Overall Score */}
      <div className="text-center space-y-3 pb-6 border-b border-primary/20">
        <div className="relative inline-block">
          <div className={`text-6xl font-bold ${getScoreColor(analysis.overall_score)} animate-bounce-in`}>
            {analysis.overall_score}
          </div>
          <div className="absolute -inset-4 rounded-full border-2 border-primary/20 animate-ping-slow" />
        </div>
        <Badge variant="secondary" className={`text-sm ${badge.color} font-mono border px-4 py-1`}>
          {badge.label}
        </Badge>
        <p className="text-sm text-muted-foreground max-w-md mx-auto font-mono">
          {analysis.summary}
        </p>
      </div>

      {/* Detailed Scores */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-primary tracking-wide font-mono mb-4">BREAKDOWN</h4>
        {[
          { label: "Technical Skills", score: analysis.technical_skills_score, max: 40 },
          { label: "Experience", score: analysis.experience_score, max: 25 },
          { label: "Education", score: analysis.education_score, max: 15 },
          { label: "Projects", score: analysis.projects_score, max: 15 },
          { label: "Presentation", score: analysis.presentation_score, max: 5 },
        ].map((item, index) => (
          <div key={item.label} className="space-y-1 animate-slide-in-left" style={{ animationDelay: `${index * 0.1}s` }}>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground font-mono">{item.label}</span>
              <span className="text-primary font-bold font-mono">{item.score}/{item.max}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-1000 ease-out"
                style={{ width: `${(item.score / item.max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Strengths */}
      {analysis.strengths.length > 0 && (
        <div className="space-y-2 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <h4 className="text-sm font-bold text-primary tracking-wide font-mono">STRENGTHS</h4>
          <ul className="space-y-2">
            {analysis.strengths.map((strength, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-foreground">
                <span className="text-primary mt-1">+</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Improvements */}
      {analysis.improvements.length > 0 && (
        <div className="space-y-2 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <h4 className="text-sm font-bold text-accent tracking-wide font-mono">AREAS_TO_IMPROVE</h4>
          <ul className="space-y-2">
            {analysis.improvements.map((improvement, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="text-accent mt-1">-</span>
                <span>{improvement}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
};
