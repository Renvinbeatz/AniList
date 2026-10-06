import Link from 'next/link'

export default function ProfileNotFound() {
  return <main id="main-content" className="mx-auto max-w-xl space-y-5 px-6 py-24 text-center">
    <h1 className="text-h2 font-semibold">Perfil indisponível</h1>
    <p className="text-muted-foreground">Este perfil não existe ou está privado.</p>
    <Link href="/" className="inline-flex rounded-full bg-surface-2 px-5 py-3 text-sm">Voltar ao início</Link>
  </main>
}
