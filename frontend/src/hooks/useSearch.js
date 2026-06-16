import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchService } from "../services/search.service";

export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useGlobalSearch(query) {
  return useQuery({
    queryKey: ["globalSearch", query],
    queryFn: () => searchService.globalSearch(query),
    enabled: !!query && query.trim().length > 0,
    staleTime: 1000 * 60, // 1 minute cache
  });
}
