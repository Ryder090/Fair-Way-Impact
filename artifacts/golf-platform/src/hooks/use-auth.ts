import { useGetMe, useLoginUser, useLogoutUser, useRegisterUser } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

export function useAuth() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  // GET /api/auth/me
  const { data: user, isLoading, error } = useGetMe({
    query: {
      retry: false,
      staleTime: 1000 * 60 * 5, // 5 mins
    }
  });

  const loginMutation = useLoginUser({
    mutation: {
      onSuccess: (data) => {
        queryClient.setQueryData(["/api/auth/me"], data.user);
        setLocation("/dashboard");
      }
    }
  });

  const registerMutation = useRegisterUser({
    mutation: {
      onSuccess: (data) => {
        queryClient.setQueryData(["/api/auth/me"], data.user);
        setLocation("/dashboard");
      }
    }
  });

  const logoutMutation = useLogoutUser({
    mutation: {
      onSuccess: () => {
        queryClient.setQueryData(["/api/auth/me"], null);
        queryClient.clear();
        setLocation("/login");
      }
    }
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !error,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,
  };
}
