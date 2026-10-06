'use client'

import { useState } from 'react'
import Image from 'next/image'
import { isValidHttpUrl } from '@/lib/validations/profile'

export function ProfileBanner({ url }: { url: string | null }) {
  const [failed, setFailed] = useState(false)
  const visible = !!url && isValidHttpUrl(url) && !failed
  return <div className="relative h-36 overflow-hidden rounded-2xl bg-surface-2 sm:h-52" aria-label="Banner do perfil">
    {visible && <Image src={url} alt="" fill unoptimized sizes="800px" referrerPolicy="no-referrer"
      className="object-cover" onError={() => setFailed(true)} />}
    <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
  </div>
}
