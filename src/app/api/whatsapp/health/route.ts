// src/app/api/whatsapp/health/route.ts
import { NextResponse } from 'next/server';

const whatsappBotApiUrl = process.env.WHATSAPP_BOT_API_URL;

export async function GET() {
  if (!whatsappBotApiUrl) {
    console.error('WHATSAPP_BOT_API_URL environment variable is not set.');
    return NextResponse.json({ status: 'error', message: 'WhatsApp bot API URL is not configured.' }, { status: 500 });
  }
  try {
    const response = await fetch(`${whatsappBotApiUrl}/health`);

    if (!response.ok) {
      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error(`Error fetching WhatsApp bot health from ${whatsappBotApiUrl}/health:`, error);
    return NextResponse.json({ status: 'error', message: `Failed to connect to WhatsApp bot health endpoint at ${whatsappBotApiUrl}/health.` }, { status: 500 });
  }
}