'use client';

import { Button } from '@/components/ui/button';

export default function PrintControls() {
  return (
    <Button variant="outline" size="sm" onClick={() => window.print()}>
      Print
    </Button>
  );
}
