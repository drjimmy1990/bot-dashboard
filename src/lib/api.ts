// src/lib/api.ts
import { supabase } from './supabaseClient';

// Types remain the same
export interface Contact {
  id: string;
  channel_id: string; // Add channel_id for context
  platform: 'whatsapp' | 'facebook' | 'instagram';
  platform_user_id: string;
  name: string;
  avatar_url: string | null;
  ai_enabled: boolean;
  last_interaction_at: string;
  last_message_preview: string;
  unread_count: number;
}

export interface Message {
  id: string;
  contact_id: string;
  sender_type: 'user' | 'agent' | 'ai';
  content_type: 'text' | 'image' | 'audio';
  text_content: string | null;
  attachment_url: string | null;
  sent_at: string;
}

// --- API Functions (Updated for Multi-Channel) ---

// Get contacts FOR A SPECIFIC CHANNEL
export const getContacts = async (channelId: string): Promise<Contact[]> => {
  // NOTE: We are now querying the TABLE directly for simplicity and performance.
  // The Edge Function can be removed or kept for other purposes.
  // RLS will protect this data.
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('channel_id', channelId)
    .order('last_interaction_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
};

// This is already scoped by contactId, which is unique to a channel. No change needed.
export const getMessagesForContact = async (contactId: string): Promise<Message[]> => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('contact_id', contactId)
    .order('sent_at', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
};

// This is also scoped by contactId.
export const markChatAsRead = async (contactId: string) => {
    const { error } = await supabase
      .from('messages')
      .update({ is_read_by_agent: true })
      .eq('contact_id', contactId)
      .eq('sender_type', 'user');

    if (error) throw new Error(error.message);
    return { success: true };
}

// Scoped by contactId.
export const updateContactName = async ({ contactId, newName }: { contactId: string, newName: string }) => {
    const { data, error } = await supabase
      .from('contacts')
      .update({ name: newName })
      .eq('id', contactId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
}

// Scoped by contactId.
export const toggleAiStatus = async ({ contactId, newStatus }: { contactId: string, newStatus: boolean }) => {
    const { error } = await supabase
      .from('contacts')
      .update({ ai_enabled: newStatus })
      .eq('id', contactId);

    if (error) throw new Error(error.message);
    return { success: true };
}

// Scoped by contactId. ON DELETE CASCADE will handle messages.
export const deleteContact = async (contactId: string) => {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', contactId);

    if (error) throw new Error(error.message);
    return { success: true };
}

// This needs to know which channel/org the message belongs to.
export const sendMessage = async (payload: {
    contact_id: string;
    channel_id: string;
    organization_id: string;
    content_type: string;
    text_content?: string;
    attachment_url?: string;
    platform: string;
}) => {
    // We will send the full payload to the Edge Function, which will then
    // extract what it needs for the n8n webhook.
    const { platform, ...messagePayload } = payload;
    let edgeFunctionName = '';

    if (platform === 'facebook') edgeFunctionName = 'send-facebook-agent-message';
    else if (platform === 'whatsapp') edgeFunctionName = 'send-agent-whatsapp-message';
    else throw new Error(`Unsupported platform for sending agent message: ${platform}`);
    
    // The Edge Function will be responsible for inserting the message into the DB
    // with the correct org_id and channel_id.
    const { data, error } = await supabase.functions.invoke(edgeFunctionName, {
        body: messagePayload
    });

    if (error) throw new Error(error.message);
    return data.message; // Assuming the edge function returns the newly created message
}