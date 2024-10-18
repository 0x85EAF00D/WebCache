import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Home from './components/Home';
import About from './components/About';
import Contact from './components/Contact';
import SavePage from './components/Save_Page';
import './App.css'; // Import the updated CSS file
import LoadPage from './components/Load_Page';


function App() {
  const [theme, setTheme] = useState('light-theme'); // Default to light theme

  // Function to switch between light and dark mode
  const toggleTheme = () => {
    setTheme(theme === 'light-theme' ? 'dark-theme' : 'light-theme');
  };

  // Detect browser's preferred color scheme
  useEffect(() => {
    // Check if the browser prefers dark mode
    const userPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Set the initial theme
    setTheme(userPrefersDark ? 'dark-theme' : 'light-theme');

    // Listen for changes to the user's color scheme preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      setTheme(e.matches ? 'dark-theme' : 'light-theme');
    };

    mediaQuery.addEventListener('change', handleChange);

    // Cleanup the event listener on component unmount
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []); // Empty dependency array ensures this runs only once, when the app loads

  return (
    <div className={theme}> {/* Apply the theme dynamically here */}
      <Router>
        {/* Everything inside here is part of your App component */}
        <nav>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about">About</Link></li>
            <li><Link to="/contact">Contact</Link></li>
            <li><Link to="/save-link">Save Link</Link></li>
            <li><Link to="/load-websites">Load Websites</Link></li>

            {/* Add the theme toggle button as a new list item */}
            <li>
            <button className="theme-toggle" onClick={toggleTheme}>
              {theme === 'light-theme' ? '🌙' : '☀️'}
            </button>
            </li>
            
          </ul>
        </nav>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/save-link" element={<SavePage />} />
          <Route path="/load-websites" element={<LoadPage />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
