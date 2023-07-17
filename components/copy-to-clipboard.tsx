"use client";
import { useState, useEffect } from 'react';
import { ClipboardIcon } from '@radix-ui/react-icons'
import { Button } from "./ui/button"
type CopyToClipboardProps = {
  text: string;
};

export const CopyToClipboard: React.FC<CopyToClipboardProps> = ({ text }) => {
  const [isCopied, setIsCopied] = useState(false);
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
    } catch (err) {
      console.error('Error: ', err);
    }
  };
  
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isCopied) {
      timeout = setTimeout(() => setIsCopied(false), 3500);
    }
    return () => {
      clearTimeout(timeout);
    };
  }, [isCopied]);

  return (
              <Button variant="ghost" onClick={copyToClipboard}>
               {isCopied ? 'Copiado!' : 'Copiar'}
            </Button>
  );
};
