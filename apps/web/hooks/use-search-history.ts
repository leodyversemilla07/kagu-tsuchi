import { useEffect, useState } from "react";

export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: Date;
  report: string;
  citations: string[];
}

const STORAGE_KEY = "kagu-tsuchi-search-history";
const MAX_HISTORY_ITEMS = 50;

export function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  useEffect(() => {
    // Load history from localStorage on mount
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Array<
          Omit<SearchHistoryItem, "timestamp"> & { timestamp: string }
        >;
        // Convert timestamp strings back to Date objects
        const withDates = parsed.map((item) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }));
        setHistory(withDates);
      }
    } catch {
      // localStorage may be unavailable; fail silently
    }
  }, []);

  const addToHistory = (
    query: string,
    report: string,
    citations: string[] = []
  ) => {
    const newItem: SearchHistoryItem = {
      id: Date.now().toString(),
      query,
      timestamp: new Date(),
      report,
      citations,
    };

    setHistory((prev) => {
      const updated = [newItem, ...prev].slice(0, MAX_HISTORY_ITEMS);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // localStorage may be unavailable; fail silently
      }
      return updated;
    });
  };

  const removeFromHistory = (id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // localStorage may be unavailable; fail silently
      }
      return updated;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // localStorage may be unavailable; fail silently
    }
  };

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
  };
}
