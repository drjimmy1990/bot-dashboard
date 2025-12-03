'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

// --- Types ---

export interface DashboardSummary {
    total_clients: number;
    total_customers: number;
    total_leads: number;
    total_deals: number;
    open_deals_value: number;
    closed_won_deals: number;
    total_revenue: number;
    avg_order_value: number;
    pending_activities: number;
}

export interface RevenueMetric {
    date: string;
    revenue: number;
    order_count: number;
    avg_order_value: number;
}

export interface ConversionFunnelStep {
    stage: string;
    count: number;
    conversion_rate: number;
}

export interface DealMetric {
    stage: string;
    count: number;
    value: number;
    avg_deal_size: number;
}

export interface ChannelPerformance {
    organization_id: string;
    channel_id: string;
    channel_name: string;
    platform: string;
    total_contacts: number;
    total_messages: number;
    incoming_messages: number;
    agent_responses: number;
    ai_responses: number;
    period_month: string;
}

export interface ChatbotEffectiveness {
    organization_id: string;
    channel_id: string; // Added channel_id
    unique_clients_engaged: number;
    total_chatbot_interactions: number;
    successful_interactions: number;
    avg_interaction_duration_minutes: number;
    period_day: string;
}

// --- Hooks ---

export const useDashboardSummary = (orgId: string, channelId?: string | null, startDate?: Date | null, endDate?: Date | null) => {
    return useQuery({
        queryKey: ['analytics', 'summary', orgId, channelId, startDate?.toISOString(), endDate?.toISOString()],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_crm_dashboard_summary', {
                org_id: orgId,
                p_channel_id: channelId || null,
                start_date: startDate ? startDate.toISOString() : null,
                end_date: endDate ? endDate.toISOString() : null
            });
            if (error) throw error;
            // RPC returns an array for TABLE return types
            return (Array.isArray(data) && data.length > 0 ? data[0] : data) as DashboardSummary;
        },
        enabled: !!orgId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

export const useRevenueMetrics = (orgId: string, period: 'day' | 'week' | 'month' = 'day', channelId?: string | null, startDate?: Date | null, endDate?: Date | null) => {
    return useQuery({
        queryKey: ['analytics', 'revenue', orgId, period, channelId, startDate?.toISOString(), endDate?.toISOString()],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_revenue_trends', {
                org_id: orgId,
                period_type: period,
                p_channel_id: channelId || null,
                start_date: startDate ? startDate.toISOString() : null,
                end_date: endDate ? endDate.toISOString() : null
            });

            if (error) throw error;
            return data as unknown as RevenueMetric[];
        },
        enabled: !!orgId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

export const useConversionFunnel = (orgId: string, channelId?: string | null, startDate?: Date | null, endDate?: Date | null) => {
    return useQuery({
        queryKey: ['analytics', 'funnel', orgId, channelId, startDate?.toISOString(), endDate?.toISOString()],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_conversion_funnel', {
                org_id: orgId,
                p_channel_id: channelId || null,
                start_date: startDate ? startDate.toISOString() : null,
                end_date: endDate ? endDate.toISOString() : null
            });
            if (error) throw error;

            // Map RPC result to interface
            return (data as any[]).map(item => ({
                stage: item.lifecycle_stage,
                count: item.count,
                conversion_rate: item.percentage
            })) as ConversionFunnelStep[];
        },
        enabled: !!orgId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

export const useDealMetrics = (orgId: string, channelId?: string | null, startDate?: Date | null, endDate?: Date | null) => {
    return useQuery({
        queryKey: ['analytics', 'deals', orgId, channelId, startDate?.toISOString(), endDate?.toISOString()],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_deal_pipeline_snapshot', {
                org_id: orgId,
                p_channel_id: channelId || null,
                start_date: startDate ? startDate.toISOString() : null,
                end_date: endDate ? endDate.toISOString() : null
            });

            if (error) throw error;
            return data as DealMetric[];
        },
        enabled: !!orgId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

export const useDealTrends = (orgId: string, period: 'day' | 'week' | 'month', channelId?: string | null, startDate?: Date | null, endDate?: Date | null) => {
    return useQuery({
        queryKey: ['analytics', 'deals_trend', orgId, period, channelId, startDate?.toISOString(), endDate?.toISOString()],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_deal_trends', {
                org_id: orgId,
                period_type: period,
                p_channel_id: channelId || null,
                start_date: startDate ? startDate.toISOString() : null,
                end_date: endDate ? endDate.toISOString() : null
            });
            if (error) throw error;
            return data;
        },
        enabled: !!orgId,
        staleTime: 5 * 60 * 1000,
    });
};

export const useMessageVolumeTrends = (orgId: string, period: 'day' | 'week' | 'month', channelId?: string | null, startDate?: Date | null, endDate?: Date | null) => {
    return useQuery({
        queryKey: ['analytics', 'messages_trend', orgId, period, channelId, startDate?.toISOString(), endDate?.toISOString()],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_message_volume_trends', {
                org_id: orgId,
                period_type: period,
                p_channel_id: channelId || null,
                start_date: startDate ? startDate.toISOString() : null,
                end_date: endDate ? endDate.toISOString() : null
            });
            if (error) throw error;
            return data;
        },
        enabled: !!orgId,
        staleTime: 5 * 60 * 1000,
    });
};

export const useChannelPerformance = (orgId: string, startDate?: Date | null, endDate?: Date | null) => {
    return useQuery({
        queryKey: ['analytics', 'channels', orgId, startDate?.toISOString(), endDate?.toISOString()],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_channel_performance_snapshot', {
                org_id: orgId,
                start_date: startDate ? startDate.toISOString() : null,
                end_date: endDate ? endDate.toISOString() : null
            });

            if (error) throw error;
            return data as ChannelPerformance[];
        },
        enabled: !!orgId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};



export const useChatbotEffectiveness = (orgId: string, channelId?: string | null) => {
    return useQuery({
        queryKey: ['analytics', 'chatbot', orgId, channelId],
        queryFn: async () => {
            let query = supabase
                .from('analytics_chatbot_effectiveness')
                .select('*')
                .eq('organization_id', orgId)
                .order('period_day', { ascending: false });

            if (channelId) {
                query = query.eq('channel_id', channelId);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data as ChatbotEffectiveness[];
        },
        enabled: !!orgId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

export const useAnalyticsControl = () => {
    const queryClient = useQueryClient();

    const refreshAnalytics = async () => {
        const { error } = await supabase.rpc('refresh_all_analytics');
        if (error) throw error;

        // Invalidate all analytics queries
        queryClient.invalidateQueries({ queryKey: ['analytics'] });
    };

    return { refreshAnalytics };
};
