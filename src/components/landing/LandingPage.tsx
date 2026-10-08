import Link from 'next/link'
import { ArrowRight, Bookmark, Check, LockKeyhole, Sparkles } from 'lucide-react'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { ProfileAvatar } from '@/components/profile/ProfileAvatar'
import { PublicLibraryCover } from '@/components/profile/PublicLibraryCover'

// Public AniList artwork only; the example contains no account or library data.
const exampleAnime = [
  { title: 'Naruto', status: 'Assistindo', cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20-dE6UHbFFg1A5.jpg' },
  { title: 'My Hero Academia', status: 'Quero assistir', cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21459-nYh85uj2Fuwr.jpg' },
  { title: 'Kaguya-sama', status: 'Concluído', cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101921-ufrjLzhSz7L1.jpg' },
]

const primaryLink = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-foreground px-6 text-sm font-medium text-background transition-colors hover:bg-foreground/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background'
const quietLink = 'inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

export function LandingPage() {
  return <div id="top" className="min-h-screen bg-background">
    <a href="#main-content" className="sr-only z-50 rounded-lg bg-foreground px-4 py-3 text-background focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Pular para o conteúdo principal</a>
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur-xl">
      <nav aria-label="Navegação da página inicial" className="mx-auto flex h-20 max-w-[1200px] items-center justify-between gap-3 px-4 sm:px-8">
        <Link href="/" aria-label="Anicat — Início" className="inline-flex min-h-11 shrink-0 items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><BrandLogo /></Link>
        <div className="flex items-center gap-1 sm:gap-3">
          <Link href="#recursos" className="hidden min-h-11 items-center justify-center rounded-full px-4 text-sm text-muted-foreground hover:bg-surface-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:inline-flex">Conheça a Anicat</Link>
          <Link href="/login" className={quietLink}>Entrar</Link>
          <Link href="/signup" className="inline-flex min-h-11 items-center justify-center rounded-full border border-border-strong bg-surface-2 px-4 text-sm font-medium hover:bg-surface-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Criar conta</Link>
        </div>
      </nav>
    </header>
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-[1200px] px-4 outline-none sm:px-8">
      <section aria-labelledby="welcome-heading" className="grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-[1fr_1.05fr] lg:gap-12 lg:py-28">
        <div className="space-y-7">
          <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground">COMMUNITY &amp; ANIME LIST</p>
          <h1 id="welcome-heading" className="max-w-[560px] text-[clamp(2.4rem,5.2vw,4.25rem)] leading-[1.08] font-semibold tracking-[-0.06em]">Um lugar para<br />seus animes.</h1>
          <p className="max-w-[440px] text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">Organize o que você assiste, guarde suas próximas escolhas e crie um perfil com a sua cara.</p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/signup" className={primaryLink}>Crie sua conta <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            <Link href="#recursos" className={quietLink}>Veja como funciona</Link>
          </div>
          <p className="flex items-center gap-2 text-xs text-muted-foreground"><Check className="h-4 w-4" aria-hidden="true" />Sua biblioteca, seus favoritos, seu ritmo.</p>
        </div>
        <figure className="relative min-w-0 rounded-3xl border border-border-strong bg-surface-1 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-7">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3"><ProfileAvatar preset="blue" className="h-10 w-10" /><p className="text-sm font-medium">Minha coleção</p></div>
            <Bookmark className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </div>
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {exampleAnime.map(anime => <div key={anime.title} className="min-w-0 space-y-3">
              <PublicLibraryCover url={anime.cover} />
              <div className="space-y-1"><p className="truncate text-xs font-medium sm:text-sm">{anime.title}</p><p className="text-[10px] text-muted-foreground sm:text-xs">{anime.status}</p></div>
            </div>)}
          </div>
          <div className="mt-6 flex items-center justify-between gap-2 border-t border-border pt-5">
            <figcaption className="text-xs text-muted-foreground">Exemplo de biblioteca</figcaption>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-2 text-[10px] text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-status-watching" />Do seu jeito</span>
          </div>
        </figure>
      </section>
      <section id="recursos" aria-labelledby="features-heading" className="scroll-mt-28 border-t border-border py-16 sm:py-20">
        <div className="mb-10 space-y-3 sm:mb-12">
          <p className="text-xs tracking-[0.18em] text-muted-foreground">JÁ NA ANICAT</p>
          <h2 id="features-heading" className="max-w-[680px] text-3xl leading-tight font-semibold tracking-[-0.04em] sm:text-4xl">Acompanhe suas histórias.<br />Mostre o que faz parte da sua.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <article className="flex flex-col rounded-3xl border border-border bg-surface-1/60 p-6 sm:p-7">
            <span className="mb-8 text-xs text-text-3">01 / ORGANIZE</span>
            <h3 className="mb-3 text-lg font-medium">Sua biblioteca, no seu ritmo</h3>
            <p className="text-sm leading-6 text-muted-foreground">Encontre animes, acompanhe episódios e separe o que está assistindo do que fica para depois.</p>
            <div className="mt-7 flex flex-wrap gap-2">{['Assistindo', 'Quero assistir', 'Pausado', 'Concluído', 'Abandonado'].map(status => <span key={status} className="rounded-full border border-border bg-surface-2/70 px-3 py-2 text-xs text-muted-foreground">{status}</span>)}</div>
          </article>
          <article className="flex flex-col rounded-3xl border border-border bg-surface-1/60 p-6 sm:p-7">
            <span className="mb-8 text-xs text-text-3">02 / PERSONALIZE</span>
            <h3 className="mb-3 text-lg font-medium">Um perfil com a sua cara</h3>
            <p className="text-sm leading-6 text-muted-foreground">Escolha seu gato entre 24 avatares, adicione bio e banner e destaque seu personagem favorito.</p>
            <div aria-label="Exemplos dos avatares Anicat" className="mt-auto flex flex-wrap gap-3 pt-7">{['happy-lavender', 'sad-blue', 'laughing-peach', 'black'].map(preset => <ProfileAvatar key={preset} preset={preset} className="h-12 w-12" />)}</div>
          </article>
          <article className="flex flex-col rounded-3xl border border-border bg-surface-1/60 p-6 sm:p-7">
            <span className="mb-8 text-xs text-text-3">03 / MOSTRE SEU GOSTO</span>
            <h3 className="mb-3 text-lg font-medium">Seus favoritos em destaque</h3>
            <p className="text-sm leading-6 text-muted-foreground">Monte seus favoritos e fixados, adicione links sociais e compartilhe a página do seu perfil.</p>
            <p className="mt-auto flex items-start gap-2 pt-7 text-xs leading-5 text-muted-foreground"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />Você escolhe entre um perfil público ou privado.</p>
          </article>
        </div>
      </section>
      <section aria-labelledby="community-heading" className="grid gap-8 rounded-3xl border border-border bg-surface-1/40 p-6 sm:p-10 md:grid-cols-[1fr_0.75fr]">
        <div className="space-y-4">
          <p className="inline-flex items-center gap-2 text-xs tracking-[0.16em] text-muted-foreground"><Sparkles className="h-4 w-4" aria-hidden="true" />COMUNIDADE ANICAT</p>
          <h2 id="community-heading" className="text-2xl leading-tight font-semibold tracking-[-0.04em] sm:text-3xl">Suas histórias também viram conversa.</h2>
          <p className="max-w-[600px] text-sm leading-7 text-muted-foreground">Encontre pessoas, siga perfis e converse sobre seus animes em tópicos, reviews e comentários.</p>
          <Link href="/community" className={quietLink}>Conhecer a comunidade <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Link>
        </div>
        <div className="flex flex-col justify-center gap-3 text-sm text-muted-foreground">{['Encontrar e seguir pessoas', 'Feed e tópicos de conversa', 'Reviews e comentários'].map(feature => <p key={feature} className="flex items-center gap-3"><span className="h-1 w-1 rounded-full bg-text-3" />{feature}</p>)}</div>
      </section>
      <section aria-labelledby="start-heading" className="py-20 text-center sm:py-24">
        <h2 id="start-heading" className="mb-4 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Dê um lugar aos seus animes.</h2>
        <p className="mb-8 text-sm leading-6 text-muted-foreground">Crie seu perfil e comece a organizar sua coleção.</p>
        <Link href="/signup" className={primaryLink}>Criar minha conta <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
      </section>
    </main>
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="space-y-2"><BrandLogo /><p className="text-xs text-muted-foreground">Community &amp; Anime List</p></div>
        <p className="text-xs leading-6 text-muted-foreground">Informações das obras via AniList.</p>
        <Link href="#top" className={quietLink}>Voltar ao início ↑</Link>
      </div>
    </footer>
  </div>
}
