import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

const LoadPage = () => {
  const [websites, setWebsites] = useState([]);
  const [filteredWebsites, setFilteredWebsites] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWebsites();
  }, []);

  useEffect(() => {
    const filtered = websites.filter(website => 
      website.web_url?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      website.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredWebsites(filtered);
  }, [searchQuery, websites]);

  const fetchWebsites = async () => {
    try {
      console.log('Fetching websites...');
      const response = await fetch('http://localhost:3000/api/get-links');
      
      if (!response.ok) {
        throw new Error(`Failed to load websites: ${response.status}`);
      }

      const data = await response.json();
      console.log('Received data:', data);
      
      setWebsites(data);
      setFilteredWebsites(data);
    } catch (error) {
      console.error("Error during fetch:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const getWebpageUrl = (filePath) => {
    const pathParts = filePath.split('\\');
    const domain = pathParts[pathParts.length - 2];
    const filename = pathParts[pathParts.length - 1];
    return `/api/saved-page/${domain}/${filename}`;
  };

  const handleFileOpen = (website) => {
    const url = getWebpageUrl(website.file_path);
    // Get file extension from the file path
    const fileExt = website.file_path.split('.').pop().toLowerCase();
    
    if (fileExt === 'pdf') {
      // For PDFs, open in new tab
      window.open(url, '_blank');
    } else {
      // For HTML, open in a new window with specific features
      window.open(url, '_blank', 'width=1000,height=800,menubar=no,toolbar=no');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-2xl p-4">
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl p-4">
      <h1 className="text-3xl font-bold text-center mb-6">
        Saved Websites
      </h1>
      
      {error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      ) : null}
      
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search websites..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      
      <div className="space-y-4">
        {filteredWebsites.length === 0 ? (
          <p className="text-center text-gray-500">
            {websites.length === 0 ? 'No websites saved yet' : 'No matching websites found'}
          </p>
        ) : (
          filteredWebsites.map((website, index) => (
            <div 
              key={index} 
              className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow duration-200 cursor-pointer"
              onClick={() => handleFileOpen(website)}
            >
              <div className="block">
                <h3 className="text-lg font-medium text-blue-600 hover:text-blue-800 mb-1">
                  {website.title || 'Untitled'}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  {website.web_url}
                </p>
                <p className="text-xs text-gray-500">
                  Saved on: {new Date(website.created).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LoadPage;