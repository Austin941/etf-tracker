import { NextResponse } from 'next/server';
import { getAllETFs } from '@/lib/mockDataEngine';

export async function GET() {
  try {
    const etfs = getAllETFs();
    return NextResponse.json(etfs);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch ETFs' }, { status: 500 });
  }
}
