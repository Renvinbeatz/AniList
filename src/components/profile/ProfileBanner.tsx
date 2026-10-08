'use client'

import { useState } from 'react'
import Image from 'next/image'
import { isValidHttpUrl } from '@/lib/validations/profile'

export function ProfileBanner({ url }: { url: string | null }) {
  const [failed, setFailed] = useState(false)
  const visible = !!url && isValidHttpUrl(url) && !failed
  return <div className="relative h-40 overflow-hidden bg-linear-to-br from-[#30313e] via-surface-2 to-[#202936] sm:h-56" aria-label="Banner do perfil">
    {visible && <Image src={url} alt="" fill unoptimized sizes="800px" referrerPolicy="no-referrer"
      className="object-cover" onError={() => setFailed(true)} />}
    {!visible && <div aria-hidden="true" className="absolute -right-10 -top-32 h-96 w-96 rounded-full border border-white/5" />}
    <div className="absolute inset-0 bg-linear-to-t from-background/50 to-transparent" />
  </div>
}
