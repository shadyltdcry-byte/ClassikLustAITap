/**
 * NewsTicker.tsx
 * Last Edited: 2025-08-17 by Steven
 *
 *
 * 
 * Optional scrolling events/news
 *
 * Please leave a detailed description
 *      of each function you add
 */

import React, { useState, useEffect } from 'react';

interface NewsItem {
  id: number;
  text: string;
}

const NewsTicker: React.FC<{ newsItems: NewsItem[] }> = ({ newsItems }) => {
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentNewsIndex((prevIndex) =>
        prevIndex === newsItems.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000); // Change news item every 3 seconds

    return () => clearInterval(interval);
  }, [newsItems.length]);

  if (!newsItems.length) return null;

  return (
    <div style={{
      backgroundColor: '#f0f0f0',
      padding: '10px',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#333',
    }}>
      <div style={{
        display: 'inline-block',
        paddingLeft: '100%',
        animation: 'ticker 10s linear infinite',
        '@keyframes ticker': {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-100%)' }
        }
      }}>
        {newsItems[currentNewsIndex].text}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const newsItems = [
    { id: 1, text: 'Breaking News: React 18 Released!' },
    { id: 2, text: 'New Study Shows Benefits of Regular Exercise' },
    { id: 3, text: 'Tech Conference 2023 Announces Keynote Speakers' },
  ];

  return (
    <div>
      <header style={{ textAlign: 'center', backgroundColor: '#333', color: '#fff', padding: '20px' }}>
        <h1>Welcome to Our Website</h1>
      </header>
      <NewsTicker newsItems={newsItems} />
      <div style={{ padding: '20px' }}>
        <h2>Main Content</h2>
        <p>This is where the main content of the page goes...</p>
      </div>
    </div>
  );
};

export default App;
