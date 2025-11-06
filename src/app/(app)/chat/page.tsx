// src/app/(app)/chat/page.tsx
'use client';

import React from 'react';
import UnifiedChatInterface from "@/components/chat/UnifiedChatInterface";

export default function ChatPage() {
  // All state management for the old Admin Panel has been removed.
  // This component now simply renders the main chat interface.
  return (
      <UnifiedChatInterface />
  );
}