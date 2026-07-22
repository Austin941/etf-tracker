import { NextResponse } from 'next/server';
import { getMockRebalancePredictions } from '@/lib/mockDataEngine';

export async function GET() {
  try {
    const data = getMockRebalancePredictions();
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch rebalance radar data' }, { status: 500 });
  }
}
