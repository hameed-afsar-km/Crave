import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'push-subscriptions.json');

async function readSubscriptions(): Promise<any[]> {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeSubscriptions(subs: any[]): Promise<void> {
  await fs.writeFile(DATA_FILE, JSON.stringify(subs, null, 2), 'utf-8');
}

export async function POST(req: Request) {
  try {
    const subscription = await req.json();
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
    }

    const subs = await readSubscriptions();
    const exists = subs.some((s) => s.endpoint === subscription.endpoint);
    if (!exists) {
      subs.push(subscription);
      await writeSubscriptions(subs);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('push-subscribe error:', err);
    return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { endpoint } = await req.json();
    if (!endpoint) {
      return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
    }

    const subs = await readSubscriptions();
    const filtered = subs.filter((s) => s.endpoint !== endpoint);
    await writeSubscriptions(filtered);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('push-unsubscribe error:', err);
    return NextResponse.json({ error: 'Failed to remove subscription' }, { status: 500 });
  }
}
