import React, { createContext, useContext, useState, useEffect } from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

interface FarmerData {
  id: string;
  name: string;
  phone: string;
  division: string;
  district: string;
  upazila: string;
  registeredDate: string;
}

interface AuthContextType {
  farmerId: string | null;
  isAuthenticated: boolean;
  isOnline: boolean;
  farmerData: FarmerData | null;
  login: (farmerId: string, farmerData: FarmerData) => void;
  logout: () => void;
  refreshAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEYS = {
  FARMER_ID: "harvestguard_farmer_id",
  FARMER_DATA: "harvestguard_farmer_data",
  AUTH_TOKEN: "harvestguard_auth_token",
  SESSION_EXPIRY: "harvestguard_session_expiry",
};

const SESSION_DURATION = 5 * 24 * 60 * 60 * 1000; // 5 days in milliseconds

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const isOnline = useOnlineStatus();
  
  const [farmerId, setFarmerId] = useState<string | null>(() => {
    // Check session expiry first
    const expiryStr = localStorage.getItem(STORAGE_KEYS.SESSION_EXPIRY);
    if (expiryStr) {
      const expiry = new Date(expiryStr).getTime();
      if (Date.now() > expiry) {
        // Session expired, clear everything
        localStorage.removeItem(STORAGE_KEYS.FARMER_ID);
        localStorage.removeItem(STORAGE_KEYS.FARMER_DATA);
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.SESSION_EXPIRY);
        return null;
      }
    }
    // Initialize from localStorage on mount
    return localStorage.getItem(STORAGE_KEYS.FARMER_ID);
  });

  const [farmerData, setFarmerData] = useState<FarmerData | null>(() => {
    // Initialize farmer data from localStorage
    const stored = localStorage.getItem(STORAGE_KEYS.FARMER_DATA);
    return stored ? JSON.parse(stored) : null;
  });

  const isAuthenticated = farmerId !== null;

  // Check session expiry periodically
  useEffect(() => {
    const checkSession = () => {
      const expiryStr = localStorage.getItem(STORAGE_KEYS.SESSION_EXPIRY);
      if (expiryStr) {
        const expiry = new Date(expiryStr).getTime();
        if (Date.now() > expiry) {
          console.log('[Auth] Session expired, logging out');
          logout();
        }
      }
    };

    // Check every minute
    const interval = setInterval(checkSession, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const login = (id: string, data: FarmerData) => {
    setFarmerId(id);
    setFarmerData(data);
    
    // Calculate session expiry (5 days from now)
    const expiryDate = new Date(Date.now() + SESSION_DURATION);
    
    // Persist to localStorage
    localStorage.setItem(STORAGE_KEYS.FARMER_ID, id);
    localStorage.setItem(STORAGE_KEYS.FARMER_DATA, JSON.stringify(data));
    localStorage.setItem(STORAGE_KEYS.SESSION_EXPIRY, expiryDate.toISOString());
    
    console.log('[Auth] Session created, expires:', expiryDate.toLocaleString());
  };

  const logout = () => {
    // Clear authentication state
    setFarmerId(null);
    setFarmerData(null);
    
    // Clear from localStorage
    localStorage.removeItem(STORAGE_KEYS.FARMER_ID);
    localStorage.removeItem(STORAGE_KEYS.FARMER_DATA);
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.SESSION_EXPIRY);
    
    // Clear cached dashboard data
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith("harvestguard_dashboard_") ||
        key.startsWith("harvestguard_crops_") ||
        key.startsWith("harvestguard_scans_") ||
        key.startsWith("harvestguard_weather_")
      )) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    console.log('[Auth] Logged out, session cleared');
  };

  const refreshAuth = () => {
    // Re-read from localStorage
    const storedId = localStorage.getItem(STORAGE_KEYS.FARMER_ID);
    const storedData = localStorage.getItem(STORAGE_KEYS.FARMER_DATA);
    
    setFarmerId(storedId);
    setFarmerData(storedData ? JSON.parse(storedData) : null);
  };

  return (
    <AuthContext.Provider
      value={{
        farmerId,
        isAuthenticated,
        isOnline,
        farmerData,
        login,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
