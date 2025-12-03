/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/api.ts
import { supabase } from './supabaseClient';

// --- Type Definitions ---
// These interfaces define the shape of our data.

// --- CORE CHAT INTERFACES (Existing) ---
export interface Contact {
  id: string;
  channel_id: string;
  platform: 'whatsapp' | 'facebook' | 'instagram';
  platform_user_id: string;
  name: string;
  avatar_url: string | null;
  ai_enabled: boolean;
  last_interaction_at: string;
  last_message_preview: string;
  unread_count: number;
  // --- THIS IS THE MODIFICATION ---
  // We will need this field from the join in `useChatContacts` later.
  crm_clients: { id: string }[] | null;
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


// --- NEW CRM INTERFACES ---

export interface CrmClient {
  id: string;
  organization_id: string;
  contact_id: string | null;
  client_type: 'lead' | 'prospect' | 'customer' | 'partner' | 'inactive';
  company_name: string | null;
  email: string | null;
  phone: string | null;
  secondary_phone: string | null;
  address: { [key: string]: any } | null;
  ecommerce_customer_id: string | null;
  platform_user_id: string | null; // Added field
  total_orders: number;
  total_revenue: number;
  average_order_value: number;
  source: string | null;
  source_details: { [key: string]: any } | null;
  utm_data: { [key: string]: any } | null;
  lifecycle_stage: 'lead' | 'mql' | 'sql' | 'opportunity' | 'customer' | 'evangelist' | 'churned';
  lead_score: number;
  lead_quality: 'hot' | 'warm' | 'cold' | null;
  assigned_to: string | null; // This is a profile UUID
  tags: string[] | null;
  custom_fields: { [key: string]: any } | null;
  first_contact_date: string | null;
  last_contact_date: string | null;
  next_follow_up_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrmActivity {
  id: string;
  organization_id: string;
  client_id: string | null;
  deal_id: string | null;
  message_id: string | null;
  activity_type: 'call' | 'email' | 'meeting' | 'task' | 'note' | 'chatbot_interaction' | 'website_visit';
  subject: string;
  description: string | null;
  status: 'pending' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent' | null;
  due_date: string | null;
  completed_at: string | null;
  assigned_to: string | null; // Profile UUID
  created_by: string | null; // Profile UUID
  metadata: { [key: string]: any } | null;
  created_at: string;
  updated_at: string;
}

export interface CrmNote {
  id: string;
  organization_id: string;
  client_id: string | null;
  deal_id: string | null;
  title: string | null;
  content: string;
  note_type: 'general' | 'call_log' | 'meeting_summary' | 'important' | null;
  is_pinned: boolean;
  tags: string[] | null;
  created_by: string | null; // Profile UUID
  created_at: string;
  updated_at: string;
}

export interface CrmTag {
  id: string;
  organization_id: string;
  name: string;
  color: string | null;
  category: string | null;
  created_at: string;
}


// --- API Functions (Existing) ---
// All functions now use direct Supabase SDK calls, relying on RLS for security.

/**
 * Fetches all contacts for a specific channel.
 * @param channelId - The UUID of the channel.
 */
export const getContacts = async (channelId: string): Promise<Contact[]> => {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('channel_id', channelId)
    .order('last_interaction_at', { ascending: false });

  if (error) {
    console.error("Error fetching contacts:", error);
    throw new Error(error.message);
  }
  return data || [];
};

/**
 * Fetches all messages for a specific contact.
 * @param contactId - The UUID of the contact.
 */
export const getMessagesForContact = async (contactId: string): Promise<Message[]> => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('contact_id', contactId)
    .order('sent_at', { ascending: true });

  if (error) {
    console.error("Error fetching messages:", error);
    throw new Error(error.message);
  }
  return data || [];
};

/**
 * Marks all unread user messages in a chat as read.
 * @param contactId - The UUID of the contact.
 */
export const markChatAsRead = async (contactId: string) => {
  const { error } = await supabase
    .from('messages')
    .update({ is_read_by_agent: true })
    .eq('contact_id', contactId)
    .eq('sender_type', 'user'); // Only mark user messages as read

  if (error) {
    console.error("Error marking chat as read:", error);
    throw new Error(error.message);
  }
  return { success: true };
}

/**
 * Updates the name of a contact.
 * @param params - Object containing contactId and the newName.
 */
export const updateContactName = async ({ contactId, newName }: { contactId: string, newName: string }) => {
  const { data, error } = await supabase
    .from('contacts')
    .update({ name: newName })
    .eq('id', contactId)
    .select()
    .single();

  if (error) {
    console.error("Error updating contact name:", error);
    throw new Error(error.message);
  }
  return data;
}

/**
 * Toggles the AI-enabled status for a contact.
 * @param params - Object containing contactId and the newStatus.
 */
export const toggleAiStatus = async ({ contactId, newStatus }: { contactId: string, newStatus: boolean }) => {
  const { error } = await supabase
    .from('contacts')
    .update({ ai_enabled: newStatus })
    .eq('id', contactId);

  if (error) {
    console.error("Error toggling AI status:", error);
    throw new Error(error.message);
  }
  return { success: true };
}

/**
 * Deletes a contact and their associated messages (via DB cascade).
 * @param contactId - The UUID of the contact to delete.
 */
export const deleteContact = async (contactId: string) => {
  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', contactId);

  if (error) {
    console.error("Error deleting contact:", error);
    throw new Error(error.message);
  }
  return { success: true };
}

/**
 * Sends a message from an agent by invoking a Supabase Edge Function.
 * This function determines which n8n workflow to trigger based on the platform.
 * @param payload - The message payload.
 */
export const sendMessage = async (payload: {
  contact_id: string;
  channel_id: string;
  organization_id: string;
  content_type: 'text' | 'image';
  text_content?: string;
  attachment_url?: string;
  platform: string;
}) => {
  // Determine the correct Edge Function to call based on the contact's platform.
  let edgeFunctionName = '';
  switch (payload.platform) {
    case 'whatsapp':
      edgeFunctionName = 'send-agent-whatsapp-message';
      break;
    case 'facebook':
      edgeFunctionName = 'send-facebook-agent-message';
      break;
    // Add other platforms like 'instagram' here in the future
    default:
      throw new Error(`Unsupported platform for sending agent message: ${payload.platform}`);
  }

  // The Edge Function is responsible for inserting the message into the DB
  // and triggering the corresponding n8n webhook.
  const { data, error } = await supabase.functions.invoke(edgeFunctionName, {
    body: payload // Send the entire payload to the function
  });

  if (error) {
    console.error(`Error invoking ${edgeFunctionName}:`, error);
    throw new Error(error.message);
  }

  // The edge function should return the newly created message record.
  return data.message;
}