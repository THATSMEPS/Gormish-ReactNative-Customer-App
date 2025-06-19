import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Navigation } from 'lucide-react';
import { Customer, Area, StructuredCustomerAddress, UpdateCustomerAddressPayload } from "../types/customer.types";
import { updateCustomerAddress } from '../apis/customer.api';
import MapLocationPicker from './MapLocationPicker';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAreaSelect: (areaName: string) => void;
  initialCustomerData: Customer | null; // This prop is not directly used in the useEffect anymore, but kept for interface consistency
  initialAvailableAreas: Area[]; // This prop is not directly used in the useEffect anymore, but kept for interface consistency
  disableAreaSelection?: boolean;
}

export const LocationPopup = ({
  isOpen,
  onClose,
  onAreaSelect,
  disableAreaSelection = false
}: Props) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [houseNumber, setHouseNumber] = useState('');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [locationPrompt, setLocationPrompt] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [customerData, setCustomerData] = useState<Customer | null>(() => {
    const storedCustomer = localStorage.getItem('customerData');
    return storedCustomer ? JSON.parse(storedCustomer) : null;
  });
  const [availableAreas, setAvailableAreas] = useState<Area[]>(() => {
    const storedAreas = localStorage.getItem('availableAreas');
    return storedAreas ? JSON.parse(storedAreas) : [];
  });

  const popupRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedMapLocation, setSelectedMapLocation] = useState<{
    lat: number;
    lng: number;
    address: string; // Map se mila hua address string
  } | null>(null);

  // ✅ NEW STATE: To control the map's current center
  const [currentMapCenter, setCurrentMapCenter] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isSubmitting) return;
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        const mapElement = document.querySelector('.leaflet-container');
        if (mapElement && mapElement.contains(event.target as Node)) {
          return;
        }
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, isSubmitting]);

  // ✅ UPDATED useEffect: Component open hone par localStorage se data load karein aur states ko initialize karein
  // Default values set nahi honge agar data null/empty hai
  useEffect(() => {
    if (isOpen) {
      // localStorage se latest data fetch karein
      const storedCustomer = localStorage.getItem('customerData');
      const storedAreas = localStorage.getItem('availableAreas');

      const currentCustomerData: Customer | null = storedCustomer ? JSON.parse(storedCustomer) : null;
      const currentAvailableAreas: Area[] = storedAreas ? JSON.parse(storedAreas) : [];

      setCustomerData(currentCustomerData);
      setAvailableAreas(currentAvailableAreas); // Ensure availableAreas state is up-to-date

      let initialAddress = '';
      let initialMapLocation: { lat: number; lng: number; address: string; } | null = null;
      let initialSearchQuery = ''; // This will hold the area name
      let initialCenterLat = 23.237560; // Default to Gandhinagar
      let initialCenterLng = 72.647781; // Default to Gandhinagar


      if (currentCustomerData) {
        // Check for typedAddress safely
        if (typeof currentCustomerData.address === 'object' && currentCustomerData.address !== null) {
          const structuredAddr = currentCustomerData.address as StructuredCustomerAddress;
          if (typeof structuredAddr.typedAddress === 'string') {
            initialAddress = structuredAddr.typedAddress;
          }
        } else if (typeof currentCustomerData.address === 'string') { // Backward compatibility for old string address
          initialAddress = currentCustomerData.address;
        }

        // Check for map coordinates and mapped address safely
        if (typeof currentCustomerData.address === 'object' && currentCustomerData.address !== null &&
          typeof currentCustomerData.address.latitude === 'number' && typeof currentCustomerData.address.longitude === 'number') {
          initialMapLocation = {
            lat: currentCustomerData.address.latitude,
            lng: currentCustomerData.address.longitude,
            address: (typeof currentCustomerData.address.mappedAddress === 'string' && currentCustomerData.address.mappedAddress.trim() !== '') ? currentCustomerData.address.mappedAddress : initialAddress
          };
          initialCenterLat = currentCustomerData.address.latitude;
          initialCenterLng = currentCustomerData.address.longitude;
        } else if (currentCustomerData.area?.latitude && currentCustomerData.area?.longitude) { // Fallback for old area lat/lng
          initialMapLocation = {
            lat: currentCustomerData.area.latitude,
            lng: currentCustomerData.area.longitude,
            address: initialAddress // Use initialAddress as mapped address fallback
          };
          initialCenterLat = currentCustomerData.area.latitude;
          initialCenterLng = currentCustomerData.area.longitude;
        }

        // Check for areaId and find areaName safely
        if (typeof currentCustomerData.areaId === 'string' && currentCustomerData.areaId.trim() !== '') {
          const matchedArea = currentAvailableAreas.find(area => area.id === currentCustomerData.areaId);
          if (matchedArea) {
            initialSearchQuery = matchedArea.areaName;
            // If area coordinates are available, use them as initial map center
            if (matchedArea.latitude && matchedArea.longitude) {
                initialCenterLat = matchedArea.latitude;
                initialCenterLng = matchedArea.longitude;
            }
          }
        }
      }

      // Set states - if checks above didn't find data, they remain empty/null
      setHouseNumber(initialAddress.split(', ')[0] || '');
      setStreet(initialAddress.split(', ')[1] || '');
      setLandmark(initialAddress.split(', ')[2] || '');
      setArea(initialAddress.split(', ')[3] || '');
      setCity(initialAddress.split(', ')[4] || '');
      setStateName(initialAddress.split(', ')[5] || '');
      setSearchQuery(initialSearchQuery);
      setSelectedMapLocation(initialMapLocation);
      setCurrentMapCenter({ lat: initialCenterLat, lng: initialCenterLng }); // Set initial map center
    }
  }, [isOpen]); // Dependencies mein ab initialCustomerData aur initialAvailableAreas nahi hai

  // Add useEffect to reset showMap to false whenever popup is closed
  useEffect(() => {
    if (!isOpen) {
      setShowMap(false);
    }
  }, [isOpen]);

  const filteredAreas = (isDropdownOpen && !searchQuery)
    ? availableAreas
    : availableAreas.filter(area =>
        area.areaName.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`)
          .then(res => res.json())
          .then(data => {
            fillFieldsFromGeocode(data, lat, lng);
            setShowMap(false);
          })
          .catch(() => alert('Failed to fetch address from location.'))
          .finally(() => setGeoLoading(false));
      },
      () => {
        alert('Unable to retrieve your location.');
        setGeoLoading(false);
      }
    );
  };

  const fillFieldsFromGeocode = (data: any, lat: number, lng: number) => {
    // House/Flat Number: house_number, building, amenity, or first part of display_name
    let house = data.address?.house_number || data.address?.building || data.address?.amenity;
    if (!house && data.display_name) {
      house = data.display_name.split(',')[0];
    }
    if (house) setHouseNumber(house);

    // Street: road, pedestrian, or suburb
    let street = data.address?.road || data.address?.pedestrian || data.address?.suburb;
    if (street) setStreet(street);

    // Landmark: landmark, amenity, place_of_worship
    let landmark = data.address?.landmark || data.address?.amenity || data.address?.place_of_worship;
    if (landmark) setLandmark(landmark);

    // Area: if user has manually chosen area, keep it, else use map
    if (!area) {
      let areaFromMap = data.address?.suburb || data.address?.neighbourhood || data.address?.village || data.address?.town || data.address?.city_district || data.address?.city;
      if (areaFromMap) setArea(areaFromMap);
    }

    // City: city, town, village, county
    let cityFromMap = data.address?.city || data.address?.town || data.address?.village || data.address?.county;
    if (cityFromMap) setCity(cityFromMap);

    // State
    if (data.address?.state) setStateName(data.address.state);

    setSelectedMapLocation({ lat, lng, address: data.display_name || '' });
    setCurrentMapCenter({ lat, lng });
  };

  const handleMapLocationSelect = useCallback((lat: number, lng: number, addr: string) => {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`)
      .then(res => res.json())
      .then(data => fillFieldsFromGeocode(data, lat, lng));
    setShowMap(true);
  }, []);

  const handleAreaSelect = (areaObj: Area) => {
    setArea(areaObj.areaName);
    setCity(areaObj.cityName);
    setStateName(areaObj.stateName);
    if (areaObj.latitude && areaObj.longitude) {
      setCurrentMapCenter({ lat: areaObj.latitude, lng: areaObj.longitude });
      if (showMap) {
        setSelectedMapLocation({ lat: areaObj.latitude, lng: areaObj.longitude, address: areaObj.areaName });
      }
    }
    setIsDropdownOpen(false);
  };

  const isFormValid = () => {
    return houseNumber.trim() && street.trim() && area.trim() && city.trim() && stateName.trim() && selectedMapLocation && !isSubmitting;
  };

  const handleSubmit = async () => {
    if (!isFormValid() || !customerData || !selectedMapLocation) return;
    setIsSubmitting(true);
    const areaObj = availableAreas.find(a => a.areaName === area);
    const areaIdToUpdate = areaObj ? areaObj.id : '';
    const typedAddress = [houseNumber, street, landmark, area, city, stateName].filter(Boolean).join(', ');
    const addressPayload = {
      houseNumber,
      street,
      landmark,
      area,
      city,
      state: stateName,
      latitude: selectedMapLocation?.lat ?? 0,
      longitude: selectedMapLocation?.lng ?? 0,
      mappedAddress: selectedMapLocation?.address ?? '',
      areaId: areaIdToUpdate,
      typedAddress,
    };
    const payload: UpdateCustomerAddressPayload = {
      address: addressPayload,
      areaId: areaIdToUpdate,
    };
    try {
      const updateResponse = await updateCustomerAddress(customerData.id, payload);
      if (updateResponse.success && updateResponse.data) {
        onAreaSelect(updateResponse.data.area?.areaName || area);
      } else {
        onAreaSelect(area);
      }
    } catch (e) {
      onAreaSelect(area);
    } finally {
      setIsSubmitting(false);
      setShowMap(false);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/10 backdrop-blur-[2px]">
          <motion.div
            ref={popupRef}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`absolute top-0 left-0 right-0 p-4 ${isSubmitting ? 'pointer-events-none' : ''}`}
          >
            <div
              className="rounded-[25px] p-6 max-w-xl mx-auto shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] border border-white/20 overflow-y-auto max-h-[90vh]"
              style={{
                background: 'rgba(242, 242, 245, 0.95)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}
            >
              <div className="space-y-4">
                {/* House/Flat Number */}
                <div
                  className="rounded-[15px] p-4"
                  style={{
                    background: 'rgba(255, 255, 255, 1)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                  }}
                >
                  <input
                    type="text"
                    placeholder="House/Flat Number"
                    value={houseNumber}
                    onChange={(e) => setHouseNumber(e.target.value)}
                    className="w-full font-light focus:outline-none bg-transparent"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Street */}
                <div
                  className="rounded-[15px] p-4"
                  style={{
                    background: 'rgba(255, 255, 255, 1)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                  }}
                >
                  <input
                    type="text"
                    placeholder="Street"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full font-light focus:outline-none bg-transparent"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Landmark */}
                <div
                  className="rounded-[15px] p-4"
                  style={{
                    background: 'rgba(255, 255, 255, 1)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                  }}
                >
                  <input
                    type="text"
                    placeholder="Landmark"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    className="w-full font-light focus:outline-none bg-transparent"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Area Dropdown */}
                <div className="relative">
                  <div
                    className={`rounded-[15px] p-4 flex justify-between items-center cursor-pointer`}
                    style={{
                      background: 'rgba(255, 255, 255, 0.85)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                    }}
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <input
                      type="text"
                      placeholder="Choose Area"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      className="w-full font-light focus:outline-none bg-transparent"
                      onClick={(e) => e.stopPropagation()}
                      disabled={isSubmitting}
                    />
                    <ChevronDown
                      className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </div>
                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-2 rounded-[15px] shadow-lg max-h-[300px] overflow-y-auto z-[2000]"
                        style={{
                          background: 'rgba(255, 255, 255, 1)',
                          backdropFilter: 'blur(12px)',
                          WebkitBackdropFilter: 'blur(12px)',
                        }}
                      >
                        {availableAreas.map(areaObj => (
                          <div
                            key={areaObj.id}
                            className="p-3 hover:bg-white/50 cursor-pointer font-light transition-colors"
                            onClick={() => handleAreaSelect(areaObj)}
                          >
                            {areaObj.areaName}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* City */}
                <div
                  className="rounded-[15px] p-4"
                  style={{
                    background: 'rgba(255, 255, 255, 1)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                  }}
                >
                  <input
                    type="text"
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full font-light focus:outline-none bg-transparent"
                    disabled={isSubmitting}
                  />
                </div>

                {/* State */}
                <div
                  className="rounded-[15px] p-4"
                  style={{
                    background: 'rgba(255, 255, 255, 1)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                  }}
                >
                  <input
                    type="text"
                    placeholder="State"
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    className="w-full font-light focus:outline-none bg-transparent"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Only show Pick Location Manually button */}
                <div className="flex flex-col gap-2">
                  <button type="button" className="bg-[#6552FF] text-white rounded-full py-2 font-semibold" onClick={() => setShowMap(true)} disabled={isSubmitting}>Pick Location Manually</button>
                  {!showMap && (
                    <button type="button" className="bg-[#6552FF] text-white rounded-full py-2 font-semibold flex items-center justify-center gap-2" onClick={handleGetCurrentLocation} disabled={geoLoading || isSubmitting}>
                      <Navigation size={18} />
                      {geoLoading ? 'Locating...' : 'Get Current Location'}
                    </button>
                  )}
                </div>

                {/* Map Picker (conditional) */}
                {showMap && (
                  <div className="mt-4">
                    <MapLocationPicker
                      initialLat={currentMapCenter?.lat || 23.237560}
                      initialLng={currentMapCenter?.lng || 72.647781}
                      initialZoom={15}
                      onLocationSelect={handleMapLocationSelect}
                    />
                  </div>
                )}

                {/* Submit Button */}
                <button
                  className={`w-full text-white rounded-full py-3 font-semibold transition-colors ${
                    isFormValid() ? 'bg-[#6552FF] hover:bg-opacity-90' : 'bg-gray-400 cursor-not-allowed'
                  }`}
                  onClick={handleSubmit}
                  disabled={!isFormValid()}
                >
                  {isSubmitting ? 'Updating Location...' : 'Update Location'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};