import { useNavigate } from "react-router-dom";
import { Heart, Users, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const defaultIcons = ["🎨", "⚙️", "💻", "📊", "📈", "🔧"];
const defaultColors = [
  "from-purple-500 to-pink-500",
  "from-blue-500 to-cyan-500",
  "from-green-500 to-teal-500",
  "from-orange-500 to-red-500",
  "from-indigo-500 to-purple-500",
  "from-yellow-500 to-orange-500",
];

const Index = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string; icon: string; color: string }>>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from("categories").select("*");
      if (data) {
        const formattedCategories = data.map((cat, index) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          icon: defaultIcons[index % defaultIcons.length],
          color: defaultColors[index % defaultColors.length],
        }));
        setCategories(formattedCategories);
      }
    };
    fetchCategories();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
              <Users className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Recruiter TikTok</h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate("/submit")}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              <span>Submit Profile</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/shortlist")}
              className="gap-2"
            >
              <Heart className="h-4 w-4 text-accent" />
              <span>Shortlist</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-4xl font-bold text-foreground">
            Find Your Next Hire
          </h2>
          <p className="text-lg text-muted-foreground">
            Select a role to browse candidate videos
          </p>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Card
              key={category.id}
              className="group cursor-pointer overflow-hidden border-2 transition-all hover:scale-105 hover:shadow-xl"
              onClick={() => navigate(`/feed/${category.slug}`)}
            >
              <div className={`h-32 bg-gradient-to-br ${category.color} flex items-center justify-center text-6xl transition-transform group-hover:scale-110`}>
                {category.icon}
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-foreground">
                  {category.name}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Browse candidates →
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
