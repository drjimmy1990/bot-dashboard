// src/hooks/useChannelConfig.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

// --- TYPESCRIPT INTERFACES ---

export interface ChannelConfig {
  channel_id: string;
  ai_model: string;
  ai_temperature: number;
  is_bot_active: boolean;
}

export interface AgentPrompt {
  id: string;
  agent_id: string;
  name: string;
  description: string;
  system_prompt: string;
}

export interface KeywordAction {
  id: string;
  keyword: string;
  action_type: string;
}

export interface FullChannelConfig {
  config: ChannelConfig;
  prompts: AgentPrompt[];
  keywords: KeywordAction[];
}

// --- PAYLOAD TYPES FOR MUTATIONS ---

export type UpdateConfigPayload = Partial<ChannelConfig>;
export type UpdatePromptPayload = { promptId: string; system_prompt: string };
export type AddKeywordPayload = Omit<KeywordAction, 'id' | 'channel_id'>; // channel_id is added by the hook
export type UpdateKeywordPayload = Omit<KeywordAction, 'channel_id'>;
export type AddPromptPayload = Omit<AgentPrompt, 'id' | 'channel_id'>;


// --- API HELPER FUNCTIONS ---

async function fetchAllConfig(channelId: string): Promise<FullChannelConfig> {
  const [configResult, promptsResult, keywordsResult] = await Promise.all([
    supabase.from('channel_configurations').select('*').eq('channel_id', channelId).single(),
    supabase.from('agent_prompts').select('*').eq('channel_id', channelId).order('name'),
    supabase.from('keyword_actions').select('*').eq('channel_id', channelId).order('keyword'),
  ]);

  if (configResult.error) throw new Error(`Channel Config: ${configResult.error.message}`);
  if (promptsResult.error) throw new Error(`Agent Prompts: ${promptsResult.error.message}`);
  if (keywordsResult.error) throw new Error(`Keyword Actions: ${keywordsResult.error.message}`);
  if (!configResult.data) throw new Error('Main configuration not found. Please ensure data is seeded.');

  return {
    config: configResult.data as ChannelConfig,
    prompts: promptsResult.data as AgentPrompt[],
    keywords: keywordsResult.data as KeywordAction[],
  };
}

// --- THE MAIN HOOK ---
export const useChannelConfig = (channelId: string | null) => {
  const queryClient = useQueryClient();
  const queryKey = ['channelConfig', channelId];

  const { data, isLoading, isError, error } = useQuery<FullChannelConfig>({
    queryKey: queryKey,
    queryFn: () => fetchAllConfig(channelId!),
    enabled: !!channelId,
  });

  // --- MUTATIONS ---

  const { mutate: updateConfig, isPending: isUpdatingConfig } = useMutation({
    // THIS IS THE FIX: Changed UpdateConfigPyload to UpdateConfigPayload
    mutationFn: async (payload: UpdateConfigPayload) => {
      const { error } = await supabase.from('channel_configurations').update(payload).eq('channel_id', channelId!);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const { mutate: updatePrompt, isPending: isUpdatingPrompt } = useMutation({
    mutationFn: async (payload: UpdatePromptPayload) => {
      const { error } = await supabase.from('agent_prompts').update({ system_prompt: payload.system_prompt }).eq('id', payload.promptId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const { mutate: addPrompt, isPending: isAddingPrompt } = useMutation({
    mutationFn: async (payload: AddPromptPayload) => {
        const { error } = await supabase.from('agent_prompts').insert({ ...payload, channel_id: channelId! });
        if(error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const { mutate: addKeyword, isPending: isAddingKeyword } = useMutation({
    mutationFn: async (payload: AddKeywordPayload) => {
      const { error } = await supabase.from('keyword_actions').insert({ ...payload, channel_id: channelId! });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const { mutate: deleteKeyword, isPending: isDeletingKeyword } = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('keyword_actions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const { mutate: updateKeyword, isPending: isUpdatingKeyword } = useMutation({
    mutationFn: async (payload: UpdateKeywordPayload) => {
      const { error } = await supabase
        .from('keyword_actions')
        .update({ keyword: payload.keyword, action_type: payload.action_type })
        .eq('id', payload.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    data,
    isLoading,
    isError,
    error,
    updateConfig,
    isUpdatingConfig,
    updatePrompt,
    isUpdatingPrompt,
    addPrompt,
    isAddingPrompt,
    addKeyword,
    isAddingKeyword,
    deleteKeyword,
    isDeletingKeyword,
    updateKeyword,
    isUpdatingKeyword,
  };
};