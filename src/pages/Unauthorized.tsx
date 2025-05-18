
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center animate-fade-in">
        <ShieldAlert className="mx-auto h-24 w-24 text-primary mb-4" />
        <h1 className="text-3xl font-bold mb-4">Zugriff verweigert</h1>
        <p className="text-xl text-muted-foreground mb-6">
          Sie haben keine Berechtigung, auf diese Seite zuzugreifen.
        </p>
        <Button onClick={() => navigate('/dashboard')}>
          Zurück zum Dashboard
        </Button>
      </div>
    </div>
  );
};

export default Unauthorized;
