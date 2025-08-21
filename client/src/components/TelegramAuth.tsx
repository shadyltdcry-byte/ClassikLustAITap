
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if script is already loaded
    if (window.TelegramLoginWidget) {
      setIsLoaded(true);
      return;
    }

    // Validate bot username
    if (!botUsername || botUsername === "YourBotUsername") {
      setError("Telegram bot username not configured");
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
      try {
        onAuth(user);
      } catch (err) {
        console.error('Telegram auth callback error:', err);
        setError('Authentication failed');
      }
    };

    script.onload = () => setIsLoaded(true);
    script.onerror = () => setError('Failed to load Telegram widget');
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
      {error ? (
        <Button variant="outline" disabled className="w-full">
          {error}
        </Button>
      ) : !isLoaded ? (
        <Button variant="outline" disabled className="w-full">
          Loading Telegram Auth...
        </Button>
      ) : null}
      <div id="telegram-login-widget"></div>
    </div>
  );
};
