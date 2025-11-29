import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LangProvider } from "./context/LangContext";
import { AuthProvider } from "./context/AuthContext";
import { useAutoSync } from "./hooks/useAutoSync";
import PublicLayout from "./layouts/PublicLayout";
import AppLayout from "./layouts/AppLayout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AddCrop from "./pages/AddCrop";
import EditCrop from "./pages/EditCrop";
import Scanner from "./pages/Scanner";
import AdminDashboard from "./pages/AdminDashboard";
import Weather from "./pages/Weather";
import Profile from "./pages/Profile";
import Resources from "./pages/Resources";
import NotFound from "./pages/NotFound";
import HealthJournal from "./pages/HealthJournal";
import LocalRiskMap from "./pages/LocalRiskMap";
import PWAInstallPrompt from "./components/PWAInstallPrompt";

const queryClient = new QueryClient();

// Auto-sync wrapper component
function AppWithSync() {
  useAutoSync(); // Enable automatic sync when online
  
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<PublicLayout><Landing /></PublicLayout>} />
        <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
        <Route path="/register" element={<PublicLayout><Register /></PublicLayout>} />
        <Route path="/weather" element={<PublicLayout><Weather /></PublicLayout>} />
        <Route path="/resources" element={<PublicLayout><Resources /></PublicLayout>} />

        {/* App Routes */}
        <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
        <Route path="/add-crop" element={<AppLayout><AddCrop /></AppLayout>} />
        <Route path="/edit-crop/:id" element={<AppLayout><EditCrop /></AppLayout>} />
        <Route path="/scanner" element={<AppLayout><Scanner /></AppLayout>} />
        <Route path="/profile" element={<AppLayout><Profile /></AppLayout>} />
        <Route path="/health-journal" element={<AppLayout><HealthJournal /></AppLayout>} />
        <Route path="/local-risk-map" element={<AppLayout><LocalRiskMap /></AppLayout>} />
        <Route path="/admin-dashboard" element={<AppLayout><AdminDashboard /></AppLayout>} />

        {/* Catch-all Route */}
        <Route path="*" element={<PublicLayout><NotFound /></PublicLayout>} />
      </Routes>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <LangProvider>
        <AuthProvider>
          <AppWithSync />
          <PWAInstallPrompt />
        </AuthProvider>
      </LangProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);