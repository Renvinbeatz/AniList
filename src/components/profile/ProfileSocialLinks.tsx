import { ExternalLink } from 'lucide-react'
import { parseProfileSocialLinks, SOCIAL_PLATFORMS } from '@/lib/profile-social-links'

export function ProfileSocialLinks({ links }: { links: unknown }) {
  const result = parseProfileSocialLinks(links)
  if ('error' in result || !result.data) return null
  const social = result.data
  return <nav aria-label="Links sociais" className="flex flex-wrap justify-center gap-3">
    {SOCIAL_PLATFORMS.map(platform => social[platform.id] && <a key={platform.id}
      href={social[platform.id]} target="_blank" rel="noopener noreferrer"
      aria-label={`${platform.label} (abre em nova aba)`}
      className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-3 text-sm text-muted-foreground hover:bg-surface-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {platform.label}<ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
    </a>)}
  </nav>
}
