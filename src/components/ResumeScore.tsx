import { Badge } from "@/components/ui/badge";

interface ResumeScoreProps {
  score: number | null;
  variant?: "compact" | "detailed";
  className?: string;
}

const ResumeScore = ({ score, variant = "compact", className = "" }: ResumeScoreProps) => {
  if (score === null) {
    return null;
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500 border-green-500/50 bg-green-500/10";
    if (score >= 60) return "text-yellow-500 border-yellow-500/50 bg-yellow-500/10";
    return "text-red-500 border-red-500/50 bg-red-500/10";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "EXCELLENT";
    if (score >= 60) return "GOOD";
    return "NEEDS WORK";
  };

  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Badge 
          className={`${getScoreColor(score)} backdrop-blur-sm font-mono text-xs px-3 py-1 animate-fade-in`}
        >
          RESUME SCORE: {score}/100
        </Badge>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-3">
        <div className={`text-4xl font-bold ${getScoreColor(score).split(' ')[0]} animate-scale-in`}>
          {score}
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground font-mono">RESUME SCORE</span>
          <Badge 
            className={`${getScoreColor(score)} backdrop-blur-sm font-mono text-xs w-fit`}
          >
            {getScoreLabel(score)}
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default ResumeScore;
