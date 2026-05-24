'use client';

import { useState, useEffect } from 'react';
import { Share2, Check, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  url?: string; // defaults to window.location.href
  title?: string;
}

export function ShareButton({ url, title }: Props) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(!!navigator.share);
  }, []);

  async function handleShare() {
    const shareUrl = url ?? window.location.href;
    const shareTitle = title ?? document.title;

    if (canNativeShare) {
      try {
        await navigator.share({ title: shareTitle, url: shareUrl });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — last resort: select a temp input
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleShare} className="print:hidden">
      {copied ? (
        <>
          <Check className="h-4 w-4 mr-1.5 text-green-600" />
          <span className="text-green-600">Copied!</span>
        </>
      ) : canNativeShare ? (
        <>
          <Share2 className="h-4 w-4 mr-1.5" />
          Share
        </>
      ) : (
        <>
          <Link className="h-4 w-4 mr-1.5" />
          Copy Link
        </>
      )}
    </Button>
  );
}
