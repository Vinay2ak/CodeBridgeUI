import { useCallback, useEffect, useState } from "react";

export interface UseCountdownReturn {
  seconds: number;
  start: (s: number) => void;
  reset: () => void;
}

export function useCountdown(): UseCountdownReturn {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (seconds <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [seconds > 0]);

  const start = useCallback((s: number) => {
    setSeconds(Math.max(0, Math.ceil(s)));
  }, []);

  const reset = useCallback(() => {
    setSeconds(0);
  }, []);

  return { seconds, start, reset };
}
