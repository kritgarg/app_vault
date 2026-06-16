import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { documentService } from "../services/document.service";

export function useDocuments() {
  return useQuery({
    queryKey: ["documents"],
    queryFn: documentService.getDocuments,
  });
}

export function useDocument(id) {
  return useQuery({
    queryKey: ["document", id],
    queryFn: () => documentService.getDocument(id),
    enabled: !!id,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ fileObj, metadata }) => documentService.uploadDocument(fileObj, metadata),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => documentService.deleteDocument(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.removeQueries({ queryKey: ["document", id] });
    },
  });
}

export function useToggleDocumentFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => documentService.toggleFavorite(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["document", id] });
    },
  });
}
