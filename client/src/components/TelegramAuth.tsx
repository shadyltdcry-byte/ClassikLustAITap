
import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface TelegramAuthProps {
  botUsername: string;
  onAuth: (user: TelegramUser) => void;
  className?: string;
}

declare global {
  interface Window {
    TelegramLoginWidget: {
      dataOnauth: (user: TelegramUser) => void;
    };
  }
}

export const TelegramAuth: React.FC<TelegramAuthProps> = ({ 
  botUsername, 
  onAuth, 
  className = "" 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if script is already loaded
    if (window.TelegramLoginWidget) {
      setIsLoaded(true);
      return;
    }

    // Load Telegram Login Widget script
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');

    // Create global callback function
    (window as any).onTelegramAuth = (user: TelegramUser) => {
      onAuth(user);
    };

    script.onload = () => setIsLoaded(true);
    document.head.appendChild(script);

    return () => {
      // Cleanup
      if ((window as any).onTelegramAuth) {
        delete (window as any).onTelegramAuth;
      }
    };
  }, [botUsername, onAuth]);

  return (
    <div className={`telegram-auth ${className}`}>
      {!isLoaded && (
        <Button variant="outline" disabled>
          Loading Telegram Auth...
        </Button>
      )}
      <div id="telegram-login-widget"></div>
    </div>
  );
};
