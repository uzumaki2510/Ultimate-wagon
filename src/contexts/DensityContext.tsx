import React, { createContext, useContext, useEffect, useState } from 'react';

type DensityMode = 'compact' | 'comfortable' | 'touch';

interface DensityContextType {
  density: DensityMode;
  setDensity: (mode: DensityMode) => void;
}

const DensityContext = createContext<DensityContextType | undefined>(undefined);

export function DensityProvider({ children }: { children: React.ReactNode }) {
  const [density, setDensity] = useState<DensityMode>(() => {
    const saved = localStorage.getItem('uww-density');
    if (saved === 'compact' || saved === 'comfortable' || saved === 'touch') {
      return saved as DensityMode;
    }
    return 'comfortable';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('density-compact', 'density-comfortable', 'density-touch');
    root.classList.add(`density-${density}`);
    localStorage.setItem('uww-density', density);
  }, [density]);

  return (
    <DensityContext.Provider value={{ density, setDensity }}>
      {children}
    </DensityContext.Provider>
  );
}

export function useDensity() {
  const context = useContext(DensityContext);
  if (context === undefined) {
    throw new Error('useDensity must be used within a DensityProvider');
  }
  return context;
}
