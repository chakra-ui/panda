import { NextResponse } from 'next/server'
import { extract } from './dev-runtime'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const configParam = searchParams.get('config')

  if (!code) {
    return NextResponse.json({ error: 'Missing code parameter' }, { status: 400 })
  }

  try {
    const config = configParam ? JSON.parse(configParam) : undefined
    const result = extract(code, config)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json({ error: 'Failed to process code' }, { status: 500 })
  }
}
