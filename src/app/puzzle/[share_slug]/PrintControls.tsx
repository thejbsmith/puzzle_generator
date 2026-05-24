'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function PrintControls() {
  const [showSolution, setShowSolution] = useState(false);

  const handlePrint = () => {
    if (showSolution) {
      document.documentElement.classList.add('print-solution');
    } else {
      document.documentElement.classList.remove('print-solution');
    }
    window.print();
  };

  return (
    <div className="flex items-center gap-2">
      <label className="flex items-center gap-1.5 text-sm text-zinc-600 cursor-pointer">
        <input
          type="checkbox"
          checked={showSolution}
          onChange={(e) => setShowSolution(e.target.checked)}
          className="rounded"
        />
        Print with solution
      </label>
      <Button variant="outline" size="sm" onClick={handlePrint}>
        Print
      </Button>
    </div>
  );
}
