/**
 * LocalRiskMap Component
 * 
 * Interactive map component that displays the farmer's location with actual risk data
 * from the database, alongside mock neighbor farm data to demonstrate regional risk patterns.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.3, 2.4, 2.5, 8.1, 8.4
 */

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { LocalRiskMapProps, MapState } from '../types/localRiskMap';
import { fetchFarmerDataForRiskMap, getRiskMapErrorMessage } from '../services/localRiskMap.service';
import { generateMockNeighborData } from '../utils/mockDataGenerator';
import { getDistrictCenter } from '../utils/districtCoordinates';
import { generateBanglaAdvisory } from '../utils/advisoryGenerator';

// Fix Leaflet default icon issue with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

/**
 * LocalRiskMap Component
 * 
 * Displays an interactive map centered on the farmer's district with:
 * - Blue marker for farmer's location (actual data from database)
 * - Color-coded markers for neighbor locations (mock data)
 * - Interactive pop-ups with Bangla advisories
 * 
 * @param props - Component props
 * @param props.farmerId - ID of the farmer to fetch data for
 * @param props.language - Language for display (currently only 'bn' supported)
 * 
 * Requirements:
 * - 1.1: Display responsive map component
 * - 2.3: Use farmer's registered District and Division from database
 * - 2.4: Calculate farmer's Risk Level using actual data from database
 * - 2.5: Display farmer's actual risk level and advisory
 * - 8.1: Generate and store neighbor data client-side only
 * - 8.4: Discard mock data on component unmount
 */
export default function LocalRiskMap({ farmerId, language }: LocalRiskMapProps) {
  // Initialize state for map center, zoom, farmer data, neighbor data, loading, and error
  const [mapState, setMapState] = useState<MapState>({
    center: [23.8103, 90.4125], // Default Bangladesh center
    zoom: 11,
    farmerData: null,
    neighborData: [],
    isLoading: true,
    error: null,
  });

  /**
   * Fetch farmer data from database on component mount
   * 
   * Requirements:
   * - 2.3: Fetch farmer's location from database
   * - 2.4: Fetch farmer's weather and crop info from database
   * - 2.5: Fetch farmer's risk level and advisory from database
   */
  useEffect(() => {
    let isMounted = true;

    const loadFarmerData = async () => {
      try {
        console.log('Loading farmer data for:', farmerId);
        setMapState(prev => ({ ...prev, isLoading: true, error: null }));

        // Fetch farmer data from database
        const farmerData = await fetchFarmerDataForRiskMap(farmerId);
        console.log('Farmer data received:', farmerData);

        if (!isMounted) return;

        // Get district center coordinates for map centering
        const [centerLat, centerLng] = getDistrictCenter(
          farmerData.location.district,
          farmerData.location.division
        );

        // Generate mock neighbor data (10-15 points within district)
        // Requirement 8.1: Client-side data generation
        const neighbors = generateMockNeighborData(farmerData.location);

        // Update state with fetched and generated data
        setMapState({
          center: [centerLat, centerLng],
          zoom: 11,
          farmerData,
          neighborData: neighbors,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error('Error loading farmer data:', error);
        if (!isMounted) return;

        // Handle errors with Bangla error messages
        const errorMessage = getRiskMapErrorMessage(error);
        setMapState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
      }
    };

    loadFarmerData();

    // Cleanup function to discard mock data on unmount
    // Requirement 8.4: Data cleanup on unmount
    return () => {
      isMounted = false;
      // Clear neighbor data from memory
      setMapState(prev => ({
        ...prev,
        neighborData: [],
      }));
    };
  }, [farmerId]);

  // Loading state
  if (mapState.isLoading) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">মানচিত্র লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (mapState.error) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-red-50 rounded-lg">
        <div className="text-center p-6">
          <p className="text-red-600 font-medium mb-4">{mapState.error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            আবার চেষ্টা করুন
          </button>
        </div>
      </div>
    );
  }

  // No farmer data available
  if (!mapState.farmerData) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-gray-50 rounded-lg">
        <div className="text-center p-6">
          <p className="text-gray-600 font-medium">কৃষক তথ্য পাওয়া যায়নি</p>
        </div>
      </div>
    );
  }

  /**
   * Render the interactive map with Leaflet
   * 
   * Requirements:
   * - 1.1: Display responsive map component using Leaflet.js
   * - 1.2: Center viewport on farmer's district coordinates
   * - 1.3: Set appropriate zoom level (11) to display district boundaries
   * - 1.4: Support touch-friendly panning gestures
   * - 1.5: Support touch-friendly zooming gestures
   * - 7.1: Responsive layout that adapts to different viewport sizes
   * - 7.4: Loading spinner with Bangla text (already implemented above)
   */
  try {
    return (
      <div className="w-full h-[500px] sm:h-[600px] md:h-[700px] rounded-lg overflow-hidden shadow-lg">
        <MapContainer
          key={`map-${farmerId}`}
          center={mapState.center}
          zoom={mapState.zoom}
          minZoom={8}
          maxZoom={18}
          scrollWheelZoom={true}
          touchZoom={true}
          dragging={true}
          className="w-full h-full"
          style={{ height: '100%', width: '100%' }}
        >
        {/* OpenStreetMap tiles with error handling */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          errorTileUrl="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
          maxZoom={18}
          minZoom={8}
        />
        
        {/* Farmer location marker - blue circle with actual data from database
            Requirements: 2.1, 2.2, 2.3, 2.4, 2.5 */}
        {mapState.farmerData && (
          <CircleMarker
            center={[mapState.farmerData.location.lat, mapState.farmerData.location.lng]}
            radius={10}
            pathOptions={{
              color: '#2563eb', // Blue border
              fillColor: '#3b82f6', // Blue fill
              fillOpacity: 0.8,
              weight: 3,
            }}
          >
            <Popup maxWidth={250} autoPan={true}>
              <div className="text-sm">
                <p className="font-bold mb-2">আপনার অবস্থান</p>
                <p className="mb-1">
                  <span className="font-semibold">ঝুঁকি স্তর:</span>{' '}
                  {mapState.farmerData.riskLevel === 'Low' && 'নিম্ন'}
                  {mapState.farmerData.riskLevel === 'Medium' && 'মাঝারি'}
                  {mapState.farmerData.riskLevel === 'High' && 'উচ্চ'}
                </p>
                <p className="mt-2 text-gray-700">{mapState.farmerData.advisory}</p>
              </div>
            </Popup>
          </CircleMarker>
        )}
        
        {/* Neighbor location markers - color-coded by risk level
            Requirements: 3.7, 4.1, 4.2, 4.3 */}
        {mapState.neighborData.map((neighbor) => {
          // Map risk levels to colors
          const getMarkerColor = (riskLevel: string) => {
            switch (riskLevel) {
              case 'Low':
                return { color: '#16a34a', fillColor: '#22c55e' }; // Green
              case 'Medium':
                return { color: '#ea580c', fillColor: '#f59e0b' }; // Orange
              case 'High':
                return { color: '#dc2626', fillColor: '#ef4444' }; // Red
              default:
                return { color: '#ea580c', fillColor: '#f59e0b' }; // Default to orange
            }
          };

          const colors = getMarkerColor(neighbor.riskLevel);

          return (
            <CircleMarker
              key={neighbor.id}
              center={[neighbor.location.lat, neighbor.location.lng]}
              radius={8}
              pathOptions={{
                color: colors.color,
                fillColor: colors.fillColor,
                fillOpacity: 0.7,
                weight: 2,
              }}
            >
              {/* Interactive pop-up with Bangla advisory
                  Requirements: 5.1, 5.3, 5.5 */}
              <Popup maxWidth={250} autoPan={true}>
                <div className="text-sm">
                  <p className="mb-2">
                    <span className="font-semibold">ঝুঁকি:</span>{' '}
                    {neighbor.riskLevel === 'Low' && 'নিম্ন'}
                    {neighbor.riskLevel === 'Medium' && 'মাঝারি'}
                    {neighbor.riskLevel === 'High' && 'উচ্চ'}
                  </p>
                  <p className="text-gray-700">
                    {generateBanglaAdvisory(
                      neighbor.mockWeather,
                      neighbor.mockCrop,
                      neighbor.riskLevel
                    )}
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
    );
  } catch (error) {
    console.error('Error rendering map:', error);
    return (
      <div className="flex items-center justify-center h-[500px] bg-red-50 rounded-lg">
        <div className="text-center p-6">
          <p className="text-red-600 font-medium mb-4">মানচিত্র লোড করতে সমস্যা হচ্ছে</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            আবার চেষ্টা করুন
          </button>
        </div>
      </div>
    );
  }
}
