import { getSession } from '@/lib/session'
import { searchProfileCharacters } from '@/data/profile-character'

export async function GET(request: Request) {
  const headers = { 'Cache-Control': 'private, no-store' }
  try {
    if (!await getSession()) return Response.json({ error: 'Sua sessão expirou. Entre novamente.', code: 'UNAUTHORIZED' }, { status: 401, headers })
    const query = new URL(request.url).searchParams.get('q')?.trim() ?? ''
    if ([...query].length < 2 || [...query].length > 100) return Response.json({ error: 'Digite de 2 a 100 caracteres para buscar.', code: 'INVALID_INPUT' }, { status: 400, headers })
    const result = await searchProfileCharacters(query)
    return Response.json(result, { status: 'error' in result ? 503 : 200, headers })
  } catch {
    return Response.json({ error: 'Não foi possível buscar agora. Tente novamente.', code: 'UPSTREAM_ERROR' }, { status: 503, headers })
  }
}
