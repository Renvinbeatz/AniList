import Image from 'next/image'

export function BrandLogo({ className = '', hero = false }: { className?: string; hero?: boolean }) {
  return <span className={`inline-flex ${hero ? 'flex-col gap-4' : 'items-center gap-2.5'} ${className}`}>
    <Image src="/brand/anicat-mark.svg" alt="" width={hero ? 72 : 36} height={hero ? 72 : 36} unoptimized />
    <span className={`${hero ? 'text-4xl' : 'text-xl'} font-semibold tracking-[-0.05em] text-foreground`}>Anicat</span>
  </span>
}
