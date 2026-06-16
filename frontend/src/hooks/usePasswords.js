import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { passwordService } from "../services/password.service";

export function usePasswords() {
  return useQuery({
    queryKey: ["passwords"],
    queryFn: passwordService.getPasswords,
  });
}

export function usePasswordDetails(id) {
  return useQuery({
    queryKey: ["password", id],
    queryFn: () => passwordService.getPasswordById(id),
    enabled: !!id,
  });
}

export function useCreatePassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: passwordService.createPassword,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["passwords"] });
    },
  });
}

export function useUpdatePassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: passwordService.updatePassword,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["passwords"] });
      queryClient.invalidateQueries({ queryKey: ["password", data.id] });
    },
  });
}

export function useDeletePassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: passwordService.deletePassword,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["passwords"] });
    },
  });
}

export function useRevealPassword() {
  return useMutation({
    mutationFn: (id) => passwordService.revealPassword(id),
  });
}
