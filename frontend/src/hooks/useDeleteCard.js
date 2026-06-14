import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cardService } from "../services/card.service";

// Hook to delete a card and update caches
export function useDeleteCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cardService.deleteCard,
    onSuccess: (data, id) => {
      // Invalidate cards list cache to remove deleted card from view
      queryClient.invalidateQueries({ queryKey: ["cards"] });
      // Invalidate specific card detail cache
      queryClient.invalidateQueries({ queryKey: ["card", id] });
    },
  });
}
