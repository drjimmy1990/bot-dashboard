// src/app/api/whatsapp/start/route.ts
import { NextResponse } from 'next/server';

// Read environment variable for bot API URL
const WHATSAPP_BOT_API_URL = process.env.WHATSAPP_BOT_API_URL;

// Handler for POST requests to start the WhatsApp bot and get QR code
export async function POST() {
  if (!WHATSAPP_BOT_API_URL) {
    console.error('WHATSAPP_BOT_API_URL environment variable is not set.');
    return NextResponse.json({ status: 'error', message: 'WhatsApp bot API URL is not configured.' }, { status: 500 });
  }

  try {
    // Make a POST request to the bot's start endpoint
    const response = await fetch(`${WHATSAPP_BOT_API_URL}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // If your bot requires a body for the start request, add it here
      // body: JSON.stringify({ some_param: 'value' }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})); // Attempt to parse error, fallback to empty
      throw new Error(errorData.message || `Error from bot API: ${response.status}`);
    }
    const data = await response.json();

    // Assuming the bot's start endpoint returns the QR code data directly
    const qr = data.qrCodeData || data.qrCode; // Adjust based on your bot's response

    if (!qr) {
         throw new Error('QR code data not received from bot API.');
    }

    return NextResponse.json({ status: 'success', message: 'QR code received', qrCode: qr });

  } catch (error) {
    // Log the error message
    console.error('Error starting WhatsApp bot:', error instanceof Error ? error.message : error);
    return NextResponse.json({ status: 'error', message: error instanceof Error ? error.message : 'Failed to start WhatsApp bot.' }, { status: 500 });
  }
}

// Add a GET handler to potentially retrieve the last generated QR code
// or the current status if needed by the frontend polling. The 'req' parameter is not currently used.
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ status: 'info', message: 'Check bot status using the /api/whatsapp/health endpoint.' }, { status: 200 });
}