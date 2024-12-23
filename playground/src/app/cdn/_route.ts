import { NextResponse } from 'next/server'
import { extract } from './dev-runtime'

export async function POST(request: Request) {
  const { code, config } = await request.json()

  if (!code) {
    return NextResponse.json({ error: 'Missing code parameter' }, { status: 400 })
  }

  try {
    const result = extract(code, config)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json({ error: 'Failed to process code' }, { status: 500 })
  }
}
