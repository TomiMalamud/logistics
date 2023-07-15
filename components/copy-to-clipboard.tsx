"use client";
import { useState, useEffect } from 'react';

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
      console.error('Failed to copy text: ', err);
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
    <button className="text-blue-500 hover:text-blue-900" onClick={copyToClipboard}>
      {isCopied ? '✓ Copiado!' : 'Copiar'}
    </button>
  );
};
