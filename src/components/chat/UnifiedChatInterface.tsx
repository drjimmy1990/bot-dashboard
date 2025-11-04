// src/components/chat/UnifiedChatInterface.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Box, Paper, Typography, IconButton, Tooltip } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import Link from 'next/link';
import ContactList from './ContactList';
import ChatArea from './ChatArea';
import AdminPanel from './AdminPanel';
import { useChannel } from '@/providers/ChannelProvider';
import { useChatContacts } from '@/hooks/useChatContacts';
import { useChatMessages } from '@/hooks/useChatMessages';
import { supabase } from '@/lib/supabaseClient';
import { useUI } from '@/providers/UIProvider';

interface UnifiedChatInterfaceProps {
  isAdminPanelOpen: boolean;
}

export default function UnifiedChatInterface({ isAdminPanelOpen }: UnifiedChatInterfaceProps) {
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  
  const { activeChannel } = useChannel();
  const { isSidebarOpen, toggleSidebar } = useUI();
  
  const { contacts, isLoadingContacts, updateName, toggleAi, deleteContact } = useChatContacts(activeChannel?.id || null);
  
  const { messages, isLoadingMessages, sendMessage, isSendingMessage } = useChatMessages(
    selectedContactId,
    activeChannel?.id || null,
    activeChannel?.organization_id || null
  );
  
  const selectedContact = useMemo(() => {
    return contacts.find((c) => c.id === selectedContactId);
  }, [contacts, selectedContactId]);

  useEffect(() => {
    if (selectedContactId && !contacts.find(c => c.id === selectedContactId)) {
        setSelectedContactId(null);
    }
  }, [contacts, selectedContactId]);

  useEffect(() => {
    setSelectedContactId(null);
  }, [activeChannel?.id]);

  const handleSendMessage = (text: string) => {
    if (!selectedContact) return;
    sendMessage({
        contact_id: selectedContact.id,
        content_type: 'text',
        text_content: text,
        platform: selectedContact.platform,
    });
  }

  const handleSendImageByUrl = (url: string) => {
    if (!selectedContact) return;
    sendMessage({
        contact_id: selectedContact.id,
        content_type: 'image',
        attachment_url: url, 
        platform: selectedContact.platform,
    });
  }

  const handleBackup = async (format: 'csv' | 'txt_detailed' | 'txt_numbers_only' | 'txt_number_name' | 'json') => {
    try {
        const { data: whatsappContacts, error } = await supabase.functions.invoke<{ name?: string; platform_user_id?: string; [key: string]: unknown; }[]>('get-whatsapp-contacts-for-backup');
        if (error) throw error;
        if (!whatsappContacts || whatsappContacts.length === 0) {
            alert('No WhatsApp contacts found to backup.');
            return;
        }

        let fileContentString = "";
        let mimeType = "text/plain";
        let fileExtension = "txt";

        type BackupContact = { name?: string; platform_user_id?: string; [key: string]: unknown };
        const typedWhatsappContacts = whatsappContacts as BackupContact[];

        if (format === 'csv') {
            mimeType = "text/csv";
            fileExtension = "csv";
            const csvRows = ["Name,PhoneNumber"];
            typedWhatsappContacts.forEach((contact) => {
                const name = contact.name ? `"${contact.name.replace(/"/g, '""')}"` : 'N/A';
                csvRows.push(`${name},${contact.platform_user_id || 'N/A'}`);
            });
            fileContentString = csvRows.join("\r\n");
        } else if (format === 'txt_numbers_only') {
            fileContentString = typedWhatsappContacts.map((c) => c.platform_user_id).filter(Boolean).join("\r\n");
        } else if (format === 'txt_detailed') {
            mimeType = "text/txt";
            fileExtension = "txt";
            const txtLines: string[] = [];
            typedWhatsappContacts.forEach((contact) => {
              const name = contact.name || 'N/A';
              const phoneNumber = contact.platform_user_id || 'N/A';
              txtLines.push(`Name: ${name}, Phone: ${phoneNumber}`);
            });
            fileContentString = txtLines.join("\r\n");
        } else if (format === 'txt_number_name') {
             mimeType = "text/txt";
            fileExtension = "txt";
            fileContentString = typedWhatsappContacts.map((c) => `${c.platform_user_id || 'No Number'}:${c.name || 'No Name'}`).join("\r\n");
        } else if (format === 'json') {
             mimeType = "application/json";
            fileExtension = "json";
            fileContentString = JSON.stringify(typedWhatsappContacts.map((c) => ({ name: c.name || 'N/A', phoneNumber: c.platform_user_id || 'N/A'})), null, 2);
        }
        
        const blob = new Blob([fileContentString], { type: `${mimeType};charset=utf-8;` });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
        link.setAttribute("href", url);
        link.setAttribute("download", `whatsapp_contacts_backup_${timestamp}.${fileExtension}`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        alert(`WhatsApp contacts backup download initiated as ${format.toUpperCase()}!`);
    } catch (err: unknown) { 
        let errorMessage = 'An unknown error occurred.';
        if (err instanceof Error) {
            errorMessage = err.message;
        } else if (typeof err === 'string') {
            errorMessage = err;
        }
        alert(`An error occurred during backup: ${errorMessage}`);
    }
  };

  if (!activeChannel) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h5">No Channel Selected</Typography>
                <Typography color="text.secondary" sx={{mt: 1}}>
                    Please <Link href="/channels" style={{ textDecoration: 'underline' }}>create or select a channel</Link> to view contacts.
                </Typography>
            </Paper>
        </Box>
    );
  }
  
  return (
    // THIS IS THE BOX IN QUESTION. It should have height: '100%' to fill the container from the layout.
    <Box sx={{ display: 'flex', height: '100%', width: '100%' }}>
      
      {/* This Box controls the collapsing of the ContactList */}
      <Box
        sx={{
          width: isSidebarOpen ? 320 : 0,
          overflow: 'hidden',
          flexShrink: 0,
          transition: 'width 0.3s ease-in-out',
          height: '100%',
        }}
      >
        <ContactList
          contacts={contacts}
          isLoading={isLoadingContacts}
          selectedContactId={selectedContactId}
          onSelectContact={setSelectedContactId}
          onUpdateName={updateName}
          onToggleAi={toggleAi}
        />
      </Box>

      {/* This is the main content area that will grow */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* This is the small header bar for the toggle button */}
        <Box sx={{ p: 0.5, backgroundColor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
            <Tooltip title={isSidebarOpen ? "Hide Contacts" : "Show Contacts"}>
                <IconButton onClick={toggleSidebar}>
                    {isSidebarOpen ? <MenuOpenIcon /> : <MenuIcon />}
                </IconButton>
            </Tooltip>
        </Box>
        {/* This Box ensures the ChatArea below it fills the remaining vertical space */}
        <Box sx={{ flexGrow: 1, position: 'relative' }}>
          <ChatArea
            contact={selectedContact}
            messages={messages}
            isLoadingMessages={isLoadingMessages}
            onSendMessage={handleSendMessage}
            onSendImageByUrl={handleSendImageByUrl}
            isSendingMessage={isSendingMessage}
            onDeleteContact={deleteContact}
          />
        </Box>
      </Box>

      {/* Admin Panel */}
      <Box
        sx={{
          width: isAdminPanelOpen ? 320 : 0,
          overflow: 'hidden',
          flexShrink: 0,
          transition: 'width 0.3s ease-in-out',
          height: '100%',
        }}
      >
        <AdminPanel onBackupWhatsappNumbers={handleBackup} />
      </Box>
    </Box>
  );
}