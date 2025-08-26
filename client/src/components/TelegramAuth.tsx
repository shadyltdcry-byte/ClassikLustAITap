
import React, { useEffect } from 'react';
import { Button } from './ui/button';

interface TelegramAuthProps {
  onAuth: (authData: any) => void;
}

declare global {
  interface Window {
    onTelegramAuth: (user: any) => void;
  }
}

export default function TelegramAuth({ onAuth }: TelegramAuthProps) {
  useEffect(() => {
    // Create and inject Telegram Login Widget script
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', 'ClassikLoyalty_Bot');
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    script.async = true;

    // Define the callback function globally
    window.onTelegramAuth = (user: any) => {
      console.log('Telegram authentication successful:', user);
      onAuth(user);
    };

    // Find the container and append the script
    const container = document.getElementById('telegram-login-container');
    if (container && !container.hasChildNodes()) {
      container.appendChild(script);
    }

    return () => {
      // Cleanup
      if (container && container.hasChildNodes()) {
        container.innerHTML = '';
      }
      if (window.onTelegramAuth) {
        delete window.onTelegramAuth;
      }
    };
  }, [onAuth]);

  const handleManualAuth = () => {
    // Fallback manual authentication
    const telegramWebApp = (window as any).Telegram?.WebApp;
    if (telegramWebApp) {
      const user = telegramWebApp.initDataUnsafe?.user;
      if (user) {
        console.log('Manual Telegram auth:', user);
        onAuth({
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          username: user.username,
          photo_url: user.photo_url,
          auth_date: Math.floor(Date.now() / 1000),
          hash: 'webapp_auth'
        });
      } else {
        alert('Please open this game through Telegram to use Telegram login.');
      }
    } else {
      alert('Telegram Web App not detected. Please open through Telegram or use Guest login.');
    }
  };

  return (
    <div className="space-y-3">
      {/* Telegram Login Widget Container */}
      <div id="telegram-login-container" className="flex justify-center">
        {/* Widget will be injected here */}
      </div>
      
      {/* Fallback Manual Button */}
      <Button 
        onClick={handleManualAuth}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white"
        variant="default"
      >
        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
        Login with Telegram
      </Button>
    </div>
  );
}
