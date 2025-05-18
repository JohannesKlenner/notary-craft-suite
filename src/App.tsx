
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ToolHistoryProvider } from "@/contexts/ToolHistoryContext";

import { Navbar } from "@/components/layout/Navbar";

import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/NotFound";
import Unauthorized from "@/pages/Unauthorized";
import Feedback from "@/pages/Feedback";
import ErbfolgeRechner from "@/pages/tools/ErbfolgeRechner";
import Miteigentumsanteile from "@/pages/tools/Miteigentumsanteile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <ToolHistoryProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <main className="flex-1 bg-background">
                  <Routes>
                    <Route path="/" element={<Login />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/feedback" element={<Feedback />} />
                    <Route path="/unauthorized" element={<Unauthorized />} />
                    
                    {/* Tool routes */}
                    <Route path="/tools/erbfolge-rechner" element={<ErbfolgeRechner />} />
                    <Route path="/tools/miteigentumsanteile" element={<Miteigentumsanteile />} />
                    
                    {/* 404 catch-all route */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
              </div>
            </BrowserRouter>
          </TooltipProvider>
        </ToolHistoryProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
