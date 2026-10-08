import { searchCatalogAnimeAction } from '@/actions/catalog'

export async function GET(request: Request) {
  const headers = { 'Cache-Control': 'private, no-store' }
  try {
    const query = new URL(request.url).searchParams.get('q') ?? ''
    const result = await searchCatalogAnimeAction(query)
    const status = 'error' in result
      ? result.code === 'UNAUTHORIZED' ? 401 : result.code === 'INVALID_INPUT' ? 400 : 503
      : 200
    return Response.json(result, { status, headers })
  } catch {
    return Response.json({ error: 'Não foi possível consultar o catálogo agora.', code: 'INTERNAL_ERROR' }, { status: 503, headers })
  }
}
