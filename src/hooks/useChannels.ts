// src/hooks/useChannels.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

const ORG_ID = process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID;

export interface Channel {
    id: string;
    name: string;
    platform: 'whatsapp' | 'facebook' | 'instagram';
    platform_channel_id: string;
    is_active: boolean;
}

export type NewChannelPayload = {
    name: string;
    platform: 'whatsapp' | 'facebook' | 'instagram';
    platform_channel_id: string;
};

async function fetchChannels(): Promise<Channel[]> {
    if (!ORG_ID) throw new Error("Default Organization ID is not set.");
    
    const { data, error } = await supabase
        .from('channels')
        .select('id, name, platform, platform_channel_id, is_active')
        .eq('organization_id', ORG_ID)
        .order('name');

    if (error) throw error;
    return data || [];
}

export const useChannels = () => {
    const queryClient = useQueryClient();
    const queryKey = ['channels', ORG_ID];

    const { data: channels = [], isLoading, isError, error } = useQuery({
        queryKey,
        queryFn: fetchChannels,
    });

    // --- FIX IS HERE: We now call the RPC function ---
    const { mutate: addChannel, isPending: isAdding } = useMutation({
        mutationFn: async (newChannel: NewChannelPayload) => {
            if (!ORG_ID) throw new Error("Cannot add channel: Organization ID is not set.");
            
            const { error } = await supabase.rpc('create_channel_with_defaults', {
                org_id: ORG_ID,
                channel_name: newChannel.name,
                channel_platform: newChannel.platform,
                platform_id: newChannel.platform_channel_id
            });
            
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
        }
    });
    
    // We will add update/delete mutations later as needed

    return {
        channels,
        isLoading,
        isError,
        error,
        addChannel,
        isAdding,
    };
};