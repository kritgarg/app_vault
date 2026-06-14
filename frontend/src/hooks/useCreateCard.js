import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cardService } from "../services/card.service";

// Hook to create a card and invalidate caching for immediate UI synchrony
export function useCreateCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cardService.createCard,
    onSuccess: () => {
      // Force React Query to mark the cards list cache as stale and refetch it
      queryClient.invalidateQueries({ queryKey: ["cards"] });
    },
  });
}
