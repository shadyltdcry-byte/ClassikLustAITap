
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { TelegramAuth } from './TelegramAuth';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface LoginScreenProps {
  onLogin: (userId: string, userData?: any) => void;
  onGuestLogin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onGuestLogin }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleTelegramAuth = async (telegramUser: TelegramUser) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(telegramUser),
      });

      const data = await response.json();
      
      if (data.success) {
        // Store auth token and user ID
        localStorage.setItem('telegram_auth_token', data.token);
        localStorage.setItem('telegram_user_id', data.user.id);
        localStorage.setItem('telegram_user_data', JSON.stringify(telegramUser));
        
        onLogin(data.user.id, data.user);
      } else {
        console.error('Telegram auth failed:', data.error);
        alert('Authentication failed. Please try again.');
      }
    } catch (error) {
      console.error('Telegram auth error:', error);
      alert('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-black/80 border-pink-500/30">
        <CardHeader className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 shadow-2xl flex items-center justify-center border-4 border-pink-400/50">
            <span className="text-2xl font-bold text-white">CL</span>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-pink-400 via-purple-500 to-indigo-400 bg-clip-text text-transparent">
            ClassikLust
          </CardTitle>
          <CardDescription className="text-white/80">
            Welcome! Choose how you'd like to sign in
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Telegram Authentication */}
          <div className="space-y-2">
            <p className="text-sm text-white/60 text-center">
              🚀 New Auto-Authentication Feature!
            </p>
            <TelegramAuth
              botUsername={import.meta.env.VITE_TELEGRAM_BOT_USERNAME || "YourBotUsername"}
              onAuth={handleTelegramAuth}
              className="w-full"
            />
          </div>
          
          {/* Guest Login Option */}
          <div className="space-y-2">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/20" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-black/80 px-2 text-white/60">Or continue as guest</span>
              </div>
            </div>
            <Button
              onClick={onGuestLogin}
              variant="outline"
              className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
              disabled={isLoading}
            >
              Continue as Guest
            </Button>
          </div>
          
          {isLoading && (
            <div className="text-center text-sm text-white/60">
              Authenticating...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};iv>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/20" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-black px-2 text-white/60">Or</span>
            </div>
          </div>

          {/* Guest Login */}
          <Button
            onClick={onGuestLogin}
            variant="outline"
            className="w-full border-pink-500/30 text-white hover:bg-pink-500/10"
            disabled={isLoading}
          >
            Continue as Guest
          </Button>

          <p className="text-xs text-white/40 text-center">
            v2.0.0 - Click /start in Telegram for instant login!
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
