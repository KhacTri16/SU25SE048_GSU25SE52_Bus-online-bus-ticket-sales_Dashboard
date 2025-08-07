import React, { useState, useEffect } from 'react';
import { locationService, stationService } from '../../services/api';
import { Location, Station } from '../../types/company';

const LocationList: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedLocation, setExpandedLocation] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch both locations and stations
      const [locationsResponse, stationsResponse] = await Promise.all([
        locationService.getAllLocations(),
        stationService.getAllStations()
      ]);
      
      if (locationsResponse && locationsResponse.data && Array.isArray(locationsResponse.data)) {
        setLocations(locationsResponse.data.filter(location => !location.isDeleted));
      }
      
      if (stationsResponse && stationsResponse.data && Array.isArray(stationsResponse.data)) {
        setStations(stationsResponse.data.filter(station => !station.isDeleted));
      }
      
    } catch (err: any) {
      console.error('Error fetching data:', err);
      let errorMessage = 'Không thể tải dữ liệu. ';
      
      if (err.response) {
        errorMessage += `Server error: ${err.response.status} - ${err.response.statusText}`;
      } else if (err.request) {
        errorMessage += 'Không thể kết nối đến server.';
      } else {
        errorMessage += err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getStationsForLocation = (locationName: string) => {
    return stations.filter(station => 
      station.locationName?.toLowerCase() === locationName.toLowerCase()
    );
  };

  const filteredLocations = locations.filter(location =>
    location.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.note?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleLocationExpansion = (locationId: number) => {
    setExpandedLocation(expandedLocation === locationId ? null : locationId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Có lỗi xảy ra</h2>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Quản lý Địa điểm</h1>
        <p className="text-gray-600 dark:text-gray-400">Xem danh sách địa điểm và các trạm xe tương ứng</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Tìm kiếm địa điểm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow dark:shadow-gray-900/20">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tổng địa điểm</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{locations.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow dark:shadow-gray-900/20">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tổng trạm xe</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stations.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow dark:shadow-gray-900/20">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Thời gian trung bình</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {locations.length > 0 
                  ? Math.round(locations.reduce((sum, loc) => sum + loc.timeTransit, 0) / locations.length)
                  : 0} phút
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Locations List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/20">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Danh sách địa điểm</h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredLocations.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">📍</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Không tìm thấy địa điểm</h3>
              <p className="text-gray-500 dark:text-gray-400">Không có địa điểm nào phù hợp với tìm kiếm của bạn.</p>
            </div>
          ) : (
            filteredLocations.map((location) => {
              const locationStations = getStationsForLocation(location.name);
              const isExpanded = expandedLocation === location.id;
              
              return (
                <div key={location.id} className="px-6 py-4">
                  <div 
                    className="flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 rounded-lg transition-colors"
                    onClick={() => toggleLocationExpansion(location.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{location.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{location.note}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Thời gian trung chuyển</p>
                        <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">{location.timeTransit} phút</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Số trạm xe</p>
                        <p className="text-lg font-semibold text-green-600 dark:text-green-400">{locationStations.length}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {isExpanded ? 'Thu gọn' : 'Mở rộng'}
                        </span>
                        <svg 
                          className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded Stations List */}
                  {isExpanded && (
                    <div className="mt-4 ml-12">
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">Danh sách trạm xe tại {location.name}</h4>
                        {locationStations.length === 0 ? (
                          <p className="text-gray-500 dark:text-gray-400 text-sm">Chưa có trạm xe nào tại địa điểm này.</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {locationStations.map((station) => (
                              <div key={station.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                                <div className="flex items-center space-x-2">
                                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{station.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{station.stationId}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationList; 