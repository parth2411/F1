'use client';

import React, { useState, useEffect } from 'react';

export default function TestDashboard() {
  const [apiData, setApiData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);

  const API_BASE_URL = 'http://localhost:8001';

  useEffect(() => {
    testAllApis();
  }, []);

  const testAllApis = async () => {
    setLoading(true);
    const results: any = {};
    const errorList: string[] = [];

    // Test API endpoints
    const endpoints = [
      { name: 'health', url: '/api/f1/health' },
      { name: 'sessions', url: '/api/f1/sessions' },
      { name: 'drivers', url: '/api/f1/drivers' },
      { name: 'latest', url: '/api/f1/latest' },
      { name: 'schedule2024', url: '/api/f1/schedule/2024' },
      { name: 'schedule2025', url: '/api/f1/schedule/2025' }
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`Testing: ${endpoint.url}`);
        const response = await fetch(`${API_BASE_URL}${endpoint.url}`);
        const data = await response.json();
        
        results[endpoint.name] = {
          status: response.status,
          success: response.ok,
          data: data
        };
        
        console.log(`✅ ${endpoint.name}:`, data);
      } catch (error) {
        console.error(`❌ ${endpoint.name} failed:`, error);
        errorList.push(`${endpoint.name}: ${error}`);
        results[endpoint.name] = {
          status: 'ERROR',
          success: false,
          error: error
        };
      }
    }

    setApiData(results);
    setErrors(errorList);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-xl">Testing F1 API...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔧 F1 API Test Dashboard</h1>
        
        {errors.length > 0 && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-8">
            <h3 className="font-bold">Errors:</h3>
            <ul className="list-disc list-inside">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Object.entries(apiData).map(([name, result]: [string, any]) => (
            <div key={name} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold capitalize">{name}</h2>
                <span className={`px-2 py-1 rounded text-sm ${
                  result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {result.status}
                </span>
              </div>
              
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-64">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {apiData.sessions?.data?.count || 0}
              </div>
              <div className="text-gray-600">Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {apiData.drivers?.data?.length || 0}
              </div>
              <div className="text-gray-600">Drivers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {apiData.schedule2024?.data?.length || 0}
              </div>
              <div className="text-gray-600">2024 Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {apiData.schedule2025?.data?.length || 0}
              </div>
              <div className="text-gray-600">2025 Events</div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Next Steps</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>If you see sessions and drivers data above, your API is working!</li>
            <li>If 2025 events show 0, run your f1-processor again to fetch 2025 data</li>
            <li>If everything looks good, replace your main page with the F1Dashboard component</li>
            <li>The API base URL is: <code className="bg-gray-100 px-2 py-1 rounded">http://localhost:8001</code></li>
          </ul>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={testAllApis}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            🔄 Refresh Tests
          </button>
        </div>
      </div>
    </div>
  );
}