// src/app/chat/page.tsx
'use client';

import React from 'react';
import UnifiedChatInterface from "@/components/chat/UnifiedChatInterface";

// The props are now passed down from the root layout.
interface ChatPageProps {
  isAdminPanelOpen?: boolean; // Make it optional
}

export default function ChatPage({ isAdminPanelOpen = false }: ChatPageProps) {
  return (
      <UnifiedChatInterface isAdminPanelOpen={isAdminPanelOpen} />
  );
}