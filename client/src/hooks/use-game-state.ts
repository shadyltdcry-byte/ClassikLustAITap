import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { User, Character, GameStats } from "@shared/schema";

const MOCK_USER_ID = "mock-user-id";

export function useGameState() {
  const queryClient = useQueryClient();

  // Fetch user data
  const userQuery = useQuery<User>({
    queryKey: ["/api/user", MOCK_USER_ID],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch selected character
  const characterQuery = useQuery<Character>({
    queryKey: ["/api/character/selected", MOCK_USER_ID],
  });

  // Fetch user stats
  const statsQuery = useQuery<GameStats>({
    queryKey: ["/api/stats", MOCK_USER_ID],
  });

  // Tap mutation
  const tapMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/tap", { userId: MOCK_USER_ID });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user", MOCK_USER_ID] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats", MOCK_USER_ID] });
    },
  });

  return {
    user: userQuery.data,
    character: characterQuery.data,
    stats: statsQuery.data,
    isLoading: userQuery.isLoading || characterQuery.isLoading,
    tap: tapMutation.mutate,
    isTapping: tapMutation.isPending,
  };
}
