'use client';

import React from 'react';
import { Button, ButtonProps } from '@/components/ui/Button';
import { RotateCcw } from 'lucide-react';
import { toast } from '@/lib/notifications/toast';

export interface ResetButtonProps extends Omit<ButtonProps, 'onClick'> {
  onReset: () => void;
  label?: string;
}

export function ResetButton({ onReset, label = 'Process another file', ...props }: ResetButtonProps) {
  const handleReset = () => {
    toast.info('Workspace reset');
    onReset();
  };

  return (
    <Button
      variant="outline"
      size="md"
      leftIcon={<RotateCcw className="w-4 h-4" />}
      onClick={handleReset}
      {...props}
    >
      {label}
    </Button>
  );
}
