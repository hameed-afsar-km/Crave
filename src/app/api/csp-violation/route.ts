import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const report = await req.json();
    if (process.env.NODE_ENV === 'development') {
      console.warn('CSP Violation:', JSON.stringify(report, null, 2));
    }
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ received: true });
  }
}
