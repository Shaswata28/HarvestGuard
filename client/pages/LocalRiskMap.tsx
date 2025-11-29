/**
 * Local Risk Map Page
 * * Page component that displays the Local Risk Map feature
 * Shows an interactive map with farmer's location and nearby risk indicators
 * * Requirements: 1.1, 2.3, 8.3
 */

import { useAuth } from '@/context/AuthContext';
import LocalRiskMapComponent from '@/components/LocalRiskMap';
import { useLanguage } from '@/context/LangContext';

export default function LocalRiskMap() {
  const { farmerId, isAuthenticated } = useAuth();
  const { language } = useLanguage();

  // If no user is logged in, show a message
  if (!isAuthenticated || !farmerId) {
    return (
      <div className="container-mobile py-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800 font-medium">
            {language === 'bn' 
              ? 'মানচিত্র দেখতে লগইন করুন' 
              : 'Please log in to view the map'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-mobile py-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">
          {language === 'bn' ? 'স্থানীয় ঝুঁকির মানচিত্র' : 'Local Risk Map'}
        </h1>
        <p className="text-gray-600 mt-1">
          {language === 'bn' 
            ? 'আপনার এলাকার ফসলের ঝুঁকি দেখুন' 
            : 'View crop risk in your area'}
        </p>
      </div>
      
      {/* The component containing the fix is rendered here */}
      <LocalRiskMapComponent 
        farmerId={farmerId} 
        language="bn" 
      />
    </div>
  );
}