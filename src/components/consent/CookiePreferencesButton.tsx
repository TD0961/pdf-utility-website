'use client';

import React from 'react';
import { Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function CookiePreferencesButton({ className }: { className?: string }) {
  const handleClick = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open_cookie_preferences'));
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      leftIcon={<Settings2 className="w-4 h-4" />}
      className={className}
      id="cookie-policy-manage-btn"
    >
      Manage Cookie Preferences
    </Button>
  );
}
