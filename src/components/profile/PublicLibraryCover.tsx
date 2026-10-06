'use client'

import { useState } from 'react'
import Image from 'next/image'
import { animeCover } from '@/lib/profile-anime'

export function PublicLibraryCover({ url }: { url: string | null }) {
  const [failed, setFailed] = useState(false)
  const safe = animeCover(url)
  return <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-surface-2">
    {safe && !failed ? <Image src={safe} alt="" fill sizes="(max-width: 640px) 44vw, 180px"
      className="object-cover" onError={() => setFailed(true)} />
      : <span className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">Sem capa</span>}
  </div>
}
