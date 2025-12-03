// src/hooks/useClientList.ts
'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
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
export interface ClientFilters {
  status?: string[];
  type?: string[];
  lead_quality?: string[];
  assignee?: string;
  tags?: string[];
  min_revenue?: number;
  max_revenue?: number;
  created_after?: Date | null;
  created_before?: Date | null;
  last_contact_after?: Date | null;
  last_contact_before?: Date | null;
}

interface UseClientListProps {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  filters?: ClientFilters;
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
  filters = {},
}: UseClientListProps): Promise<ClientListResponse> {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from('crm_clients').select('*', { count: 'exact' });

  // 1. Search Term
  if (searchTerm) {
    const searchQuery = `%${searchTerm}%`;
    query = query.or(
      `company_name.ilike.${searchQuery},email.ilike.${searchQuery},phone.ilike.${searchQuery},platform_user_id.ilike.${searchQuery}`
    );
  }

  // 2. Status (Lifecycle Stage)
  if (filters.status && filters.status.length > 0) {
    query = query.in('lifecycle_stage', filters.status);
  }

  // 3. Type (Client Type)
  if (filters.type && filters.type.length > 0) {
    query = query.in('client_type', filters.type);
  }

  // 4. Lead Quality
  if (filters.lead_quality && filters.lead_quality.length > 0) {
    query = query.in('lead_quality', filters.lead_quality);
  }

  // 5. Assignee (Agent)
  if (filters.assignee) {
    if (filters.assignee === 'unassigned') {
      query = query.is('assigned_to', null);
    } else {
      query = query.eq('assigned_to', filters.assignee);
    }
  }

  // 6. Tags (Array Overlap)
  if (filters.tags && filters.tags.length > 0) {
    // 'cs' means contains. For array columns, it checks if the array contains these values.
    // Note: This assumes 'tags' column is text[]
    query = query.contains('tags', filters.tags);
  }

  // 7. Revenue Range
  if (filters.min_revenue !== undefined) {
    query = query.gte('total_revenue', filters.min_revenue);
  }
  if (filters.max_revenue !== undefined) {
    query = query.lte('total_revenue', filters.max_revenue);
  }

  // 8. Date Ranges
  if (filters.created_after) {
    query = query.gte('created_at', filters.created_after.toISOString());
  }
  if (filters.created_before) {
    query = query.lte('created_at', filters.created_before.toISOString());
  }
  if (filters.last_contact_after) {
    query = query.gte('last_contact_date', filters.last_contact_after.toISOString());
  }
  if (filters.last_contact_before) {
    query = query.lte('last_contact_date', filters.last_contact_before.toISOString());
  }

  // Sorting & Pagination
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
  filters = {},
}: UseClientListProps) => {
  const debouncedSearchTerm = useDebounce(searchTerm, 400);

  // Include filters in the query key so it refetches when they change
  const queryKey = ['clientList', page, pageSize, debouncedSearchTerm, filters];

  return useQuery<ClientListResponse>({
    queryKey,
    queryFn: () => fetchClientList({ page, pageSize, searchTerm: debouncedSearchTerm, filters }),
    placeholderData: keepPreviousData,
  });
};