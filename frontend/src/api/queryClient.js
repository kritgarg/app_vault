import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Mobile apps don't have standard browser "window focus" events,
      // so we disable this to prevent unexpected/excessive network requests.
      refetchOnWindowFocus: false,
      // Retry failed requests once before showing an error.
      retry: 1,
      // Cache query data for 5 minutes (default).
      staleTime: 1000 * 60 * 5,
    },
  },
});
