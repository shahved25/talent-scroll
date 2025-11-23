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
        {/* Resume Score */}
        {resumeScore && (
          <Card className="p-4 border-2 border-primary/30 bg-card/50 backdrop-blur-sm hover:border-primary hover:shadow-[0_0_20px_hsl(160_100%_45%/0.2)] transition-all duration-300 animate-slide-in-left">
            <div className="flex items-center gap-3 mb-3">
              <FileText className="h-5 w-5 text-primary" />
              <span className="text-sm font-mono text-muted-foreground">RESUME ANALYSIS</span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`text-4xl font-bold ${getScoreColor(resumeScore).split(' ')[0]}`}>
                {resumeScore}
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">/100</span>
                <Badge className={`${getScoreColor(resumeScore)} backdrop-blur-sm font-mono text-xs`}>
                  {resumeScore >= 80 ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
                  {resumeScore >= 80 ? "STRONG" : resumeScore >= 60 ? "GOOD" : "WEAK"}
                </Badge>
              </div>
            </div>
          </Card>
        )}

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
