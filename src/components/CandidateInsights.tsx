import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Brain, FileText, Video, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";

interface CandidateInsightsProps {
  resumeScore: number | null;
  videoScore: number | null;
  className?: string;
}

const CandidateInsights = ({ resumeScore, videoScore, className = "" }: CandidateInsightsProps) => {
  const calculateOverallScore = () => {
    if (resumeScore && videoScore) {
      return Math.round((resumeScore * 0.5) + (videoScore * 0.5));
    }
    return resumeScore || videoScore || null;
  };

  const overallScore = calculateOverallScore();

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500 border-green-500/50 bg-green-500/10";
    if (score >= 60) return "text-yellow-500 border-yellow-500/50 bg-yellow-500/10";
    return "text-red-500 border-red-500/50 bg-red-500/10";
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return "A+";
    if (score >= 80) return "A";
    if (score >= 70) return "B";
    if (score >= 60) return "C";
    return "D";
  };

  const hasAnyScore = resumeScore || videoScore;

  if (!hasAnyScore) {
    return (
      <Card className={`p-6 border-2 border-primary/30 bg-card/50 backdrop-blur-sm ${className}`}>
        <div className="flex items-center gap-3 text-muted-foreground">
          <Brain className="h-6 w-6 animate-pulse" />
          <div>
            <p className="font-mono text-sm">AI Analysis in progress...</p>
            <p className="text-xs">Scores will appear here once processing is complete</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Individual Scores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      </div>

      {/* AI Badge */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground font-mono animate-fade-in">
        <Brain className="h-3 w-3" />
        <span>Powered by Groq AI Analysis</span>
      </div>
    </div>
  );
};

export default CandidateInsights;
