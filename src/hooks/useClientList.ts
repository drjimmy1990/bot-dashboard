// src/hooks/useClientList.ts
'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query'; // <-- IMPORT keepPreviousData
import { supabase } from '@/lib/supabaseClient';
import { CrmClient } from '@/lib/api';
import { useEffect, useState } from 'react';

// --- Debouncing Utility Hook ---
function useDebounce(value: string, delay: number) {
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

// --- Type Definitions ---
interface UseClientListProps {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
}

export interface ClientListResponse {
  clients: CrmClient[];
  count: number;
}

// --- API Fetcher Function ---
async function fetchClientList({
  page = 0,
  pageSize = 20,
  searchTerm = '',
}: UseClientListProps): Promise<ClientListResponse> {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from('crm_clients').select('*', { count: 'exact' });

  if (searchTerm) {
    const searchQuery = `%${searchTerm}%`;
    query = query.or(
      `name.ilike.${searchQuery},company_name.ilike.${searchQuery},email.ilike.${searchQuery},phone.ilike.${searchQuery}`
    );
  }

  query = query
    .order('last_contact_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching client list:", error);
    throw new Error(error.message);
  }

  return { clients: data || [], count: count || 0 };
}

// --- Main React Query Hook ---
export const useClientList = ({
  page = 0,
  pageSize = 20,
  searchTerm = '',
}: UseClientListProps) => {
  const debouncedSearchTerm = useDebounce(searchTerm, 400);
  const queryKey = ['clientList', page, pageSize, debouncedSearchTerm];

  return useQuery<ClientListResponse>({
    queryKey,
    queryFn: () => fetchClientList({ page, pageSize, searchTerm: debouncedSearchTerm }),
    // --- THIS IS THE FIX for TanStack Query v5 ---
    // The property is now 'placeholderData' and it uses a helper function.
    placeholderData: keepPreviousData,
  });
};