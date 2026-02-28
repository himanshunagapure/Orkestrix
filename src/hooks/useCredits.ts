import { useQuery } from '@tanstack/react-query';
import { fetchCredits, CreditsData } from '@/lib/api';

// Default subscriber ID for dev — replace with auth context later
const DEFAULT_SUBSCRIBER_ID = import.meta.env.VITE_SUBSCRIBER_ID || 'default-subscriber';

export function useCredits() {
  return useQuery<CreditsData>({
    queryKey: ['credits', DEFAULT_SUBSCRIBER_ID],
    queryFn: () => fetchCredits(DEFAULT_SUBSCRIBER_ID),
    refetchInterval: 60_000, // refresh every 60s
    retry: 1,
    staleTime: 30_000,
  });
}

export function useRefreshCredits() {
  // Return the query key so callers can invalidate it
  return ['credits', DEFAULT_SUBSCRIBER_ID];
}
