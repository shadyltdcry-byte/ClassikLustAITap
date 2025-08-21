import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import TelegramAuth from './TelegramAuth';

interface LoginScreenProps {
  onLogin: (userData: any) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const handleGuestLogin = () => {
    // Create a guest user with a random ID
    const guestUser = {
      id: `guest_${Math.random().toString(36).substr(2, 9)}`,
      username: `Guest_${Math.floor(Math.random() * 10000)}`,
      level: 1,
      lp: 5000,
      energy: 1000,
      maxEnergy: 1000,
      charisma: 150,
      lpPerHour: 125,
      lpPerTap: 1.5,
      isGuest: true
    };
    onLogin(guestUser);
  };

  const handleTelegramAuth = (telegramData: any) => {
    console.log('Telegram auth data received:', telegramData);

    // Send to backend for verification and user creation
    fetch('/api/auth/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(telegramData)
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        console.log('Telegram auth successful:', data);
        onLogin(data.user);
      } else {
        console.error('Telegram auth failed:', data.error);
        alert('Telegram authentication failed. Please try again.');
      }
    })
    .catch(error => {
      console.error('Telegram auth error:', error);
      alert('Authentication error. Please try again.');
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900/80 border-purple-500/30 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white">
            Welcome to Character Tap Game
          </CardTitle>
          <CardDescription className="text-gray-300">
            Choose your login method to start playing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Telegram Auth Component */}
          <div className="space-y-3">
            <TelegramAuth onAuth={handleTelegramAuth} />
            <p className="text-xs text-gray-400 text-center">
              Login with Telegram for cloud save and cross-device sync
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-600" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-gray-900 px-2 text-gray-400">Or</span>
            </div>
          </div>

          {/* Guest Login Button */}
          <Button 
            onClick={handleGuestLogin}
            variant="outline"
            className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Continue as Guest
          </Button>
          <p className="text-xs text-gray-400 text-center">
            Guest progress is saved locally only
          </p>
        </CardContent>
      </Card>
    </div>
  );
}