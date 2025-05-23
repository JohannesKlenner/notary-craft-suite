
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center animate-fade-in">
        <h1 className="text-7xl font-bold text-primary mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-6">
          Diese Seite wurde nicht gefunden
        </p>
        <Button onClick={() => navigate('/dashboard')}>
          Zurück zum Dashboard
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
