// src/components/chat/UnifiedChatInterface.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import ContactList from './ContactList';
import ChatArea from './ChatArea';
import AdminPanel from './AdminPanel';
import { useChatContacts } from '@/hooks/useChatContacts';
import { useChatMessages } from '@/hooks/useChatMessages';
import { supabase } from '@/lib/supabaseClient'; // --- FIX IS HERE: Import supabase directly

interface UnifiedChatInterfaceProps {
  isAdminPanelOpen: boolean;
}

export default function UnifiedChatInterface({ isAdminPanelOpen }: UnifiedChatInterfaceProps) {
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const { contacts, isLoadingContacts, updateName, toggleAi, deleteContact } = useChatContacts();
  const { messages, isLoadingMessages, sendMessage, isSendingMessage } = useChatMessages(selectedContactId);
  
  const selectedContact = useMemo(() => {
    return contacts.find((c) => c.id === selectedContactId);
  }, [contacts, selectedContactId]);

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
        // Use attachment_url for images, not text_content.
        // The text_content can be used for a caption if needed.
        attachment_url: url, 
        platform: selectedContact.platform,
    });
  }

  const handleBackup = async (format: 'csv' | 'txt_detailed' | 'txt_numbers_only' | 'txt_number_name' | 'json') => {
    try {
        // --- FIX IS HERE: Use the directly imported 'supabase' client ---
        const { data: whatsappContacts, error } = await supabase.functions.invoke<{ name?: string; platform_user_id?: string; [key: string]: unknown; }[]>('get-whatsapp-contacts-for-backup');
        if (error) throw error;
        if (!whatsappContacts || whatsappContacts.length === 0) {
            alert('No WhatsApp contacts found to backup.');
            return;
        }

        let fileContentString = "";
        let mimeType = "text/plain";
        let fileExtension = "txt";

        // Define a more specific type for contacts if known, otherwise use a general object type
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

  React.useEffect(() => {
    if (selectedContactId && !contacts.find(c => c.id === selectedContactId)) {
        setSelectedContactId(null);
    }
  }, [contacts, selectedContactId]);
  
  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
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
      <Box sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden'
      }}>
         <Box sx={{ p: 0.5, backgroundColor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
            <Tooltip title={isSidebarOpen ? "Hide Contacts" : "Show Contacts"}>
                <IconButton onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                    {isSidebarOpen ? <MenuOpenIcon /> : <MenuIcon />}
                </IconButton>
            </Tooltip>
        </Box>
        <Box sx={{ flexGrow: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
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