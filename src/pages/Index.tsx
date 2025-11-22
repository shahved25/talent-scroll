import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Users, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

const categoryIcons: Record<string, string> = {
  "ui-designer": "🎨",
  "backend-engineer": "⚙️",
  "frontend-developer": "💻",
  "product-manager": "📊",
  "data-scientist": "📈",
  "devops-engineer": "🔧",
};

const categoryColors: Record<string, string> = {
  "ui-designer": "from-primary via-secondary to-accent",
  "backend-engineer": "from-secondary via-primary to-accent",
  "frontend-developer": "from-primary via-accent to-secondary",
  "product-manager": "from-accent via-secondary to-primary",
  "data-scientist": "from-secondary via-accent to-primary",
  "devops-engineer": "from-primary via-secondary to-accent",
};

const Index = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string }>>([]);

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

  return (
    <div className="min-h-screen bg-background">
      {/* Cyber grid background */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#0a4b3c10_1px,transparent_1px),linear-gradient(to_bottom,#0a4b3c10_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      
      {/* Header */}
      <header className="relative border-b border-primary/20 bg-background/50 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 border border-primary/50 animate-glow-pulse">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-primary tracking-wider">TALENT_SCOUT</h1>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate("/submit")}
              className="gap-2 font-mono"
            >
              <Upload className="h-4 w-4" />
              <span>UPLOAD</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/shortlist")}
              className="gap-2 font-mono"
            >
              <Heart className="h-4 w-4" />
              <span>SHORTLIST</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative container mx-auto px-6 py-16">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-5xl font-bold text-primary tracking-tight animate-fade-in">
            FIND YOUR NEXT HIRE
          </h2>
          <p className="text-lg text-muted-foreground font-mono">
            &gt; SELECT_ROLE_TO_BROWSE_CANDIDATES
          </p>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Card
              key={category.id}
              className="group relative cursor-pointer overflow-hidden border-2 border-primary/30 bg-card/50 backdrop-blur-sm transition-all hover:scale-105 hover:border-primary hover:shadow-[0_0_30px_hsl(160_100%_45%/0.3)]"
              onClick={() => navigate(`/feed/${category.slug}`)}
            >
              <div className={`relative h-40 bg-gradient-to-br ${categoryColors[category.slug] || 'from-primary to-secondary'} flex items-center justify-center text-7xl transition-transform group-hover:scale-110 overflow-hidden`}>
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.05)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] group-hover:animate-[shimmer_2s_infinite]" />
                <span className="relative z-10 drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                  {categoryIcons[category.slug] || "👤"}
                </span>
              </div>
              <div className="relative p-6 border-t border-primary/20">
                <h3 className="text-xl font-bold text-primary mb-1 tracking-wide">
                  {category.name.toUpperCase()}
                </h3>
                <p className="text-sm text-muted-foreground font-mono flex items-center gap-2">
                  <span className="text-primary">&gt;</span>
                  Browse candidates
                </p>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Index;
