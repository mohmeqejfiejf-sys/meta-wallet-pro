import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import { FadeIn, ScaleIn } from "@/components/PageTransition";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen animated-bg noise-overlay relative overflow-hidden flex items-center justify-center">
      {/* Animated Orbs */}
      <div className="orb w-[500px] h-[500px] bg-destructive/10 -top-32 -left-32" />
      <div className="orb w-[400px] h-[400px] bg-secondary/10 -bottom-32 -right-32" style={{ animationDelay: '-3s' }} />
      
      {/* Grid Pattern */}
      <div className="fixed inset-0 grid-pattern opacity-20 pointer-events-none" />

      <div className="relative z-10 text-center px-4">
        <FadeIn>
          <div className="mb-8">
            <span className="font-display text-[150px] md:text-[200px] font-bold gradient-text leading-none">
              404
            </span>
          </div>
        </FadeIn>

        <ScaleIn delay={0.2}>
          <div className="glass-card p-8 max-w-md mx-auto">
            <h1 className="font-display text-2xl font-bold mb-4">Page Not Found</h1>
            <p className="text-muted-foreground mb-8">
              The page you're looking for doesn't exist or has been moved.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => navigate(-1)} 
                variant="outline"
                className="rounded-xl"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
              <Button 
                onClick={() => navigate("/")} 
                className="btn-glow rounded-xl"
              >
                <Home className="w-4 h-4 mr-2" />
                Return Home
              </Button>
            </div>
          </div>
        </ScaleIn>

        <FadeIn delay={0.4} className="mt-8">
          <p className="text-sm text-muted-foreground">
            Lost? Try searching or go back to the homepage.
          </p>
        </FadeIn>
      </div>
    </div>
  );
};

export default NotFound;
