import { createContext, useContext, useState, ReactNode } from "react";

export const DEFAULT_RATE = 2500;
export const RATE_KEY = "blackframe_rate";

function getStoredRate(): number {
  try {
    const stored = localStorage.getItem(RATE_KEY);
    if (stored) {
      const r = Number(stored);
      if (!isNaN(r) && r > 0) return r;
    }
  } catch {
    // ignore
  }
  return DEFAULT_RATE;
}

const numFmtFR = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

interface CurrencyCtx {
  rate: number;
  updateRate: (r: number) => void;
  fmt: (cdf: number) => string;
  fmtUSD: (cdf: number) => string;
  fmtDual: (cdf: number) => string;
  fmtUSDRaw: (cdf: number) => number;
}

const CurrencyContext = createContext<CurrencyCtx>({
  rate: DEFAULT_RATE,
  updateRate: () => {},
  fmt: (n) => numFmtFR.format(Math.round(n)) + " CDF",
  fmtUSD: (n) => "~" + numFmtFR.format(Math.round(n / DEFAULT_RATE)) + " $",
  fmtDual: (n) => numFmtFR.format(Math.round(n)) + " CDF",
  fmtUSDRaw: (n) => Math.round(n / DEFAULT_RATE),
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [rate, setRate] = useState<number>(getStoredRate);

  const updateRate = (r: number) => {
    if (!isNaN(r) && r > 0) {
      setRate(r);
      try {
        localStorage.setItem(RATE_KEY, String(r));
      } catch {
        // ignore
      }
    }
  };

  const fmt = (cdf: number) =>
    numFmtFR.format(Math.round(cdf)) + " CDF";

  const fmtUSDRaw = (cdf: number) => Math.round(cdf / rate);

  const fmtUSD = (cdf: number) =>
    "~" + numFmtFR.format(fmtUSDRaw(cdf)) + " $";

  const fmtDual = (cdf: number) => `${fmt(cdf)} (${fmtUSD(cdf)})`;

  return (
    <CurrencyContext.Provider value={{ rate, updateRate, fmt, fmtUSD, fmtDual, fmtUSDRaw }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
