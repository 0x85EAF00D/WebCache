


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
      website.link?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredWebsites(filtered);
  }, [searchQuery, websites]);

  const parseHtmlToWebsites = (htmlString) => {
    console.log('Parsing HTML:', htmlString);
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    
    // First try to find our custom container
    const container = doc.querySelector('.websites-container');
    if (!container) {
      console.log('No websites container found');
      return [];
    }

    // Check for no-websites message
    const noWebsites = container.querySelector('.no-websites');
    if (noWebsites) {
      console.log('No websites message found');
      return [];
    }

    const websiteElements = container.querySelectorAll('.website-item');
    console.log('Found website elements:', websiteElements.length);
    
    return Array.from(websiteElements).map(element => {
      const website = {
        link: element.querySelector('.website-link')?.getAttribute('href') || '',
        title: element.querySelector('.website-title')?.textContent || '',
        savedAt: element.querySelector('.website-date')?.textContent || ''
      };
      console.log('Parsed website:', website);
      return website;
    });
  };

  const fetchWebsites = async () => {
    try {
      console.log('Fetching websites...');
      const response = await fetch('http://localhost:3000/api/get-links', {
        headers: {
          'Accept': 'text/html',
        }
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to load websites: ${response.status}`);
      }

      const htmlText = await response.text();
      console.log('Received HTML:', htmlText);
      
      const websites = parseHtmlToWebsites(htmlText);
      console.log('Parsed websites:', websites);
      
      setWebsites(websites);
      setFilteredWebsites(websites);
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
            <div key={index} className="bg-white rounded-lg shadow-md p-4">
              <a
                href={website.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline block mb-2"
              >
                {website.title || website.link}
              </a>
              <p className="text-sm text-gray-500">
                {website.savedAt}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LoadPage;