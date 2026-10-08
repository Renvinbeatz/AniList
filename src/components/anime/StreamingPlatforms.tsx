import { ExternalLink, Tv } from 'lucide-react'
import type { StreamingResult } from '@/lib/streaming'

export function StreamingPlatforms({ result }: { result: StreamingResult }) {
  return <section aria-label="Serviços oficiais" className="space-y-4 border-t border-border/50 pt-6">
    <h3 className="flex items-center gap-2 font-medium"><Tv aria-hidden="true" className="h-4 w-4" />Serviços oficiais</h3>
    <p className="text-sm text-muted-foreground">Links de streaming informados pela AniList. A disponibilidade no Brasil não foi confirmada; confira no serviço.</p>
    {result.state === 'unavailable' ? <p role="status" className="text-sm text-muted-foreground">Não foi possível consultar os links agora. Tente novamente mais tarde.</p>
      : result.state === 'empty' ? <p className="text-sm text-muted-foreground">Não encontramos links de serviços nesta consulta. Isso não significa que o anime esteja indisponível.</p>
        : <ul className="flex flex-wrap gap-2">{result.links.map(link => <li key={link.url}>
          <a href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring">
            {link.name}{link.language ? ` · ${link.language}` : ''}<ExternalLink aria-hidden="true" className="h-3.5 w-3.5" /><span className="sr-only"> (abre em nova aba)</span>
          </a>
        </li>)}</ul>}
  </section>
}
