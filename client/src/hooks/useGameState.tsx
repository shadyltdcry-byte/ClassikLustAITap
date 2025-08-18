import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { User, Character, UserCharacter, Upgrade, UserUpgrade } from "@shared/schema";

const MOCK_USER_ID = "demo-user-id"; // In a real app, this would come from authentication

export function useGameState() {
  const queryClient = useQueryClient();

  // User data
  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/user", MOCK_USER_ID],
    refetchInterval: 30000, // Refresh every 30 seconds for tick updates
  });

  // Characters
  const { data: characters = [] } = useQuery<Character[]>({
    queryKey: ["/api/characters"],
  });

  const { data: userCharacters = [] } = useQuery<UserCharacter[]>({
    queryKey: ["/api/user", MOCK_USER_ID, "characters"],
  });

  // Upgrades
  const { data: upgrades = [] } = useQuery<Upgrade[]>({
    queryKey: ["/api/upgrades"],
  });

  const { data: userUpgrades = [] } = useQuery<UserUpgrade[]>({
    queryKey: ["/api/user", MOCK_USER_ID, "upgrades"],
  });

  // Tick mutation (for offline LP/energy calculation)
  const tickMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/user/${MOCK_USER_ID}/tick`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user", MOCK_USER_ID] });
    },
  });

  // Tap mutation
  const tapMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/user/${MOCK_USER_ID}/tap`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user", MOCK_USER_ID] });
    },
  });

  // Purchase upgrade mutation
  const purchaseUpgradeMutation = useMutation({
    mutationFn: (data: { upgradeId: string; level: number }) => 
      apiRequest("POST", `/api/user/${MOCK_USER_ID}/upgrades`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user", MOCK_USER_ID, "upgrades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user", MOCK_USER_ID] });
    },
  });

  // Spin wheel mutation
  const spinWheelMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/user/${MOCK_USER_ID}/wheel/spin`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user", MOCK_USER_ID] });
    },
  });

  // Admin mutations
  const addLPMutation = useMutation({
    mutationFn: (amount: number) => 
      apiRequest("POST", `/api/admin/user/${MOCK_USER_ID}/add-lp`, { amount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user", MOCK_USER_ID] });
    },
  });

  const maxEnergyMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/admin/user/${MOCK_USER_ID}/max-energy`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user", MOCK_USER_ID] });
    },
  });

  return {
    // Data
    user,
    characters,
    userCharacters,
    upgrades,
    userUpgrades,
    
    // Loading states
    userLoading,
    
    // Mutations
    handleTick: tickMutation.mutate,
    handleTap: tapMutation.mutate,
    purchaseUpgrade: purchaseUpgradeMutation.mutate,
    spinWheel: spinWheelMutation.mutate,
    addLP: addLPMutation.mutate,
    maxEnergy: maxEnergyMutation.mutate,
    
    // Mutation states
    tapPending: tapMutation.isPending,
    upgradePending: purchaseUpgradeMutation.isPending,
    wheelPending: spinWheelMutation.isPending,
    
    // Computed values
    currentCharacter: characters[0] || null, // For demo, use first character
    userId: MOCK_USER_ID,
  };
}
