'use client';

import { useEffect, useState } from 'react';
import { BACKEND_PORT } from '@/lib/ports.js';

function useServerStatus() {
  const [online, setOnline] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const response = await fetch('/health');
        if (!cancelled) setOnline(response.ok);
      } catch {
        if (!cancelled) setOnline(false);
      }
    }

    check();
    const timer = setInterval(check, 4000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  return online;
}

function ServerStatus() {
  const status = useServerStatus();

  return (
    <div className="flex items-center gap-1">
      <div
        className={`w-2 h-2 rounded-full ${status === null
            ? 'bg-gray-300 animate-pulse'
            : status
              ? 'bg-green-600'
              : 'bg-red-500'
          }`}
      ></div>
      <p className="text-gray-600 text-xs">
        {status === null
          ? 'Controllo server...'
          : status
            ? `Server attivo sulla porta :${BACKEND_PORT}`
            : `Server NON attivo sulla porta :${BACKEND_PORT}`}
      </p>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="flex flex-col items-center gap-3">
        <h1 className="font-extrabold text-5xl tracking-wider mb-5 relative">
          <span className="text-black">Rex</span>
          <span className="text-red-600">Kit</span>
        </h1>
        <p className="text-gray-600 text-xs flex items-center">
          Modifica{' '}
          <span className="font-mono bg-red-100 text-red-600 rounded px-1 mx-1">
            app/page.jsx
          </span>{' '}
          per iniziare
        </p>
        <ServerStatus />
      </div>
    </div>
  );
}
