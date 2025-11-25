import { NextRequest } from 'next/server';
import { defaultReplyText, sendTextMessage } from '@lib/facebook';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');
  const verifyToken = process.env.FACEBOOK_VERIFY_TOKEN;

  if (mode === 'subscribe' && token && challenge) {
    if (token === verifyToken) {
      return new Response(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } });
    }
    return new Response('Forbidden', { status: 403 });
  }
  return new Response('OK', { status: 200 });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null as any);
  if (!body || body.object !== 'page') {
    return Response.json({ status: 'ignored' }, { status: 200 });
  }

  try {
    const entries = Array.isArray(body.entry) ? body.entry : [];
    await Promise.all(
      entries.map(async (entry: any) => {
        const messagingEvents = entry.messaging || entry.standby || [];
        for (const event of messagingEvents) {
          const senderId = event.sender?.id;
          const messageText: string | undefined = event.message?.text;
          const isEcho = Boolean(event.message?.is_echo);
          if (!senderId || isEcho) continue;

          // Basic auto-reply: send default reply text
          const reply = defaultReplyText();
          await sendTextMessage(senderId, reply);
        }
      })
    );
  } catch (err) {
    console.error('Error processing webhook:', err);
  }

  return Response.json({ status: 'ok' }, { status: 200 });
}

