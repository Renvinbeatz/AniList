'use client'

import * as React from 'react'
import { useRef, useState } from 'react'
import { updateProfileSettings } from '@/actions/profile'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

type ProfileData = {
  display_name: string | null
  bio: string | null
  banner_url: string | null
  profile_visibility: 'public' | 'private'
}

export function ProfileSettingsForm({ initialData }: { initialData: ProfileData }) {
  const busy = useRef(false)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form State
  const [displayName, setDisplayName] = useState(initialData.display_name || '')
  const [bio, setBio] = useState(initialData.bio || '')
  const [bannerUrl, setBannerUrl] = useState(initialData.banner_url || '')
  const [visibility, setVisibility] = useState<'public' | 'private'>(initialData.profile_visibility || 'public')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy.current) return
    busy.current = true
    setIsPending(true)
    setError(null)
    setSuccess(false)

    // Basic Client Validation for UX (Server is the authority)
    if ([...displayName].length > 50) {
      setError('Nome de exibição muito longo (max 50 caracteres).')
      busy.current = false
      setIsPending(false)
      return
    }

    if ([...bio].length > 500) {
      setError('Sua bio muito longa (max 500 caracteres).')
      busy.current = false
      setIsPending(false)
      return
    }

    if (bannerUrl && !bannerUrl.startsWith('https://')) {
      setError('A URL do banner deve ser um link HTTPS seguro.')
      busy.current = false
      setIsPending(false)
      return
    }

    try {
      const result = await updateProfileSettings({
        display_name: displayName === '' ? null : displayName,
        bio: bio === '' ? null : bio,
        banner_url: bannerUrl === '' ? null : bannerUrl,
        profile_visibility: visibility
      })

      if (result && 'error' in result) {
        // Map server error codes if we want to be more specific, or just show the server message if it's safe.
        // The instructions say: "Mapear os códigos existentes... Não mostrar erro bruto".
        switch (result.code) {
          case 'INVALID_INPUT':
            setError(result.error || 'Confira os dados informados e tente novamente.')
            break
          case 'UNAUTHORIZED':
            setError('Sua sessão expirou. Entre novamente.')
            break
          default:
            setError('Não foi possível salvar agora. Tente novamente mais tarde.')
        }
      } else {
        setSuccess(true)
      }
    } catch {
      setError('Não foi possível confirmar o salvamento. Recarregue para conferir e tente novamente.')
    } finally {
      busy.current = false
      setIsPending(false)
    }
  }

  const bioLength = [...bio].length
  const nameLength = [...displayName].length

  return (
    <form onSubmit={handleSubmit} className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ERROR & SUCCESS MESSAGES */}
      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm" role="alert">
          Perfil atualizado com sucesso.
        </div>
      )}

      <div className="space-y-8">
        {/* INFORMAÇÕES BÁSICAS */}
        <section className="space-y-5">
          <div>
            <h3 className="text-base font-medium text-foreground">Informações</h3>
            <p className="text-sm text-muted-foreground">Como as pessoas verão você na plataforma.</p>
          </div>

          <div className="space-y-4 bg-surface-2/30 p-5 rounded-xl border border-border/40">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="displayName">Nome de exibição</Label>
                <span className={`text-xs ${nameLength > 50 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {nameLength}/50
                </span>
              </div>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Seu nome ou apelido"
                aria-invalid={nameLength > 50}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="bio">Biografia</Label>
                <span className={`text-xs ${bioLength > 500 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {bioLength}/500
                </span>
              </div>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Fale um pouco sobre seus animes favoritos..."
                className="resize-none"
                rows={4}
                aria-invalid={bioLength > 500}
              />
            </div>
          </div>
        </section>

        {/* APARÊNCIA */}
        <section className="space-y-5">
          <div>
            <h3 className="text-base font-medium text-foreground">Aparência</h3>
            <p className="text-sm text-muted-foreground">Personalize o visual do seu perfil.</p>
          </div>

          <div className="space-y-4 bg-surface-2/30 p-5 rounded-xl border border-border/40">
            <div className="space-y-2">
              <Label htmlFor="bannerUrl">URL do Banner</Label>
              <Input
                id="bannerUrl"
                type="url"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="https://..."
              />
              <p className="text-xs text-muted-foreground">
                Cole o link direto (somente HTTPS) de uma imagem para o topo do seu perfil.
              </p>
            </div>
          </div>
        </section>

        {/* PRIVACIDADE */}
        <section className="space-y-5">
          <div>
            <h3 className="text-base font-medium text-foreground">Privacidade</h3>
            <p className="text-sm text-muted-foreground">Um perfil público exibe seu perfil, links sociais, destaques e biblioteca com título, capa e status. Progresso, avaliações e anotações ficam privados.</p>
          </div>

          <div className="space-y-4 bg-surface-2/30 p-5 rounded-xl border border-border/40">
            <div className="space-y-2">
              <Label htmlFor="visibility">Visibilidade do Perfil</Label>
              <select
                id="visibility"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as 'public' | 'private')}
                className="flex h-11 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                <option value="public" className="bg-background text-foreground">Público (Todos podem ver)</option>
                <option value="private" className="bg-background text-foreground">Privado (Apenas você pode ver)</option>
              </select>
            </div>
          </div>
        </section>
      </div>

      <div className="pt-4 flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="ghost"
          disabled={isPending}
          onClick={() => {
            setDisplayName(initialData.display_name || '')
            setBio(initialData.bio || '')
            setBannerUrl(initialData.banner_url || '')
            setVisibility(initialData.profile_visibility || 'public')
            setError(null)
            setSuccess(false)
          }}
        >
          Descartar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar alterações
        </Button>
      </div>

    </form>
  )
}
