import { NextResponse } from 'next/server';
import { getMockEtfHoldings } from '@/lib/mockDataEngine';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Missing ETF ID' }, { status: 400 });
    }

    const data = getMockEtfHoldings(id);
    
    if (!data) {
      return NextResponse.json({ error: 'ETF not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
