import { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export default function ConnectionStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleOnline = () => { setOnline(true); setShowBanner(true); setTimeout(() => setShowBanner(false), 3000); };
    const handleOffline = () => { setOnline(false); setShowBanner(true); };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showBanner && online) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium transition-all animate-slide-down
        ${online ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
      role="status"
      aria-live="polite"
    >
      {online ? <Wifi size={16} /> : <WifiOff size={16} />}
      {online ? 'Back online!' : 'No internet connection'}
    </div>
  );
}
