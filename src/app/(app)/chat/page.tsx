// src/app/(app)/chat/page.tsx
'use client';

import React, { useState } from 'react'; // Keep useState for now for the admin panel
import UnifiedChatInterface from "@/components/chat/UnifiedChatInterface";

export default function ChatPage() {
  // We'll manage the admin panel state here for now
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

  // This would eventually be controlled by a button in the AppHeader,
  // but for now, we have no button for it. This keeps it functional.
  const toggleAdminPanel = () => {
    setIsAdminPanelOpen(prev => !prev);
  };

  return (
      <UnifiedChatInterface isAdminPanelOpen={isAdminPanelOpen} />
  );
}