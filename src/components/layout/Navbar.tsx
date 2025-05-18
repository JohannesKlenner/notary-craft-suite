
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sun, Moon, LogOut, MessageSquare, User } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

export const Navbar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { currentUser, logout, switchUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleFeedback = () => {
    navigate('/feedback');
  };

  const handleUserMenu = () => {
    // If logged out, go to login page
    if (!currentUser) {
      navigate('/login');
      return;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full glass-effect border-b border-border/40">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center">
          <h1 
            onClick={() => navigate('/dashboard')}
            className="text-xl font-bold text-primary cursor-pointer"
          >
            Notary Tools
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme} 
            title={theme === 'light' ? 'Zum Dunkelmodus wechseln' : 'Zum Hellmodus wechseln'}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleFeedback}
            title="Feedback geben"
          >
            <MessageSquare size={20} />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                title={currentUser ? `Angemeldet als ${currentUser.username}` : 'Benutzer'}
              >
                <User size={20} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {currentUser && (
                <>
                  <DropdownMenuItem disabled className="font-medium">
                    {currentUser.firstName} {currentUser.lastName} ({currentUser.role === 'admin' ? 'Admin' : 'Nutzer'})
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => switchUser()}>
                    Benutzer wechseln
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => logout()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Abmelden
                  </DropdownMenuItem>
                </>
              )}
              {!currentUser && (
                <DropdownMenuItem onClick={() => navigate('/login')}>
                  Anmelden
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
