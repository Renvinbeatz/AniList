'use client'

export default function ProfileError({ retry }: { retry: () => void }) {
  return <main id="main-content" className="mx-auto max-w-xl space-y-5 px-6 py-24 text-center">
    <h1 className="text-h2 font-semibold">Não foi possível carregar o perfil</h1>
    <p className="text-muted-foreground">Tente novamente em instantes.</p>
    <button type="button" onClick={retry} className="rounded-full bg-surface-2 px-5 py-3 text-sm">Tentar novamente</button>
  </main>
}
