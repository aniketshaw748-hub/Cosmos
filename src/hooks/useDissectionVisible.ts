import { useEffect, useState } from 'react';

/**
 * Keeps a body's dissection mounted for a short while after it is closed, so
 * the wedge can animate shut before the component unmounts.
 */
export function useDissectionVisible(dissecting: boolean): boolean {
  const [visible, setVisible] = useState(dissecting);

  useEffect(() => {
    if (dissecting) {
      setVisible(true);
      return;
    }
    const timer = setTimeout(() => setVisible(false), 1150);
    return () => clearTimeout(timer);
  }, [dissecting]);

  return visible;
}
