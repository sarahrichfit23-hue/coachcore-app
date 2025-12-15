import { useState, useEffect, useCallback } from "react";

interface UsePollingOptions<T> {
  fetcher: () => Promise<T>;
  interval: number;
  enabled?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export function usePolling<T>({
  fetcher,
  interval,
  enabled = true,
  onSuccess,
  onError,
}: UsePollingOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    try {
      const result = await fetcher();
      setData(result);
      setError(null);
      onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [fetcher, enabled, onSuccess, onError]);

  useEffect(() => {
    fetchData();

    if (!enabled) return;

    const intervalId = setInterval(fetchData, interval);
    return () => clearInterval(intervalId);
  }, [fetchData, interval, enabled]);

  return { data, error, isLoading, refetch: fetchData };
}
