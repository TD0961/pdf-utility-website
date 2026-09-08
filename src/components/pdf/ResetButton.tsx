'use client';

import React from 'react';
import { Button, ButtonProps } from '@/components/ui/Button';
import { RotateCcw } from 'lucide-react';

export interface ResetButtonProps extends Omit<ButtonProps, 'onClick'> {
  onReset: () => void;
  label?: string;
}

export function ResetButton({ onReset, label = 'Process another file', ...props }: ResetButtonProps) {
  return (
    <Button
      variant="outline"
      size="md"
      leftIcon={<RotateCcw className="w-4 h-4" />}
      onClick={onReset}
      {...props}
    >
      {label}
    </Button>
  );
}
