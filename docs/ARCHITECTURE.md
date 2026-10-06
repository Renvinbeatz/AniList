# Arquitetura do AniList Tracker V3

Next.js App Router, React, TypeScript e Tailwind compõem a aplicação. Páginas usam Server Components; componentes cliente concentram interatividade. A API GraphQL AniList fornece metadados públicos, armazenados no catálogo local quando necessário.

## Identidade e mutations

Supabase Auth SSR é a fonte de identidade. `getSession()` verifica o usuário no servidor e resolve `auth.users.id → profiles.auth_user_id → profiles.id`. Actions derivam ownership da sessão, validam os dados e alteram apenas o perfil correspondente. IDs de dono não são aceitos como autoridade do navegador.

O cliente administrativo de `src/data/supabase.ts` é exclusivo do servidor e ignora RLS. Cada operação privada precisa de autorização explícita. Cookies e renovação usam `src/utils/supabase/` e `src/proxy.ts`.

## Perfis e leitura pública

`profiles` contém personalização, visibilidade e links sociais. `profile_favorites` e `profile_pinned_anime` mantêm coleções com limites e posições protegidos por constraints e mutations atômicas. `user_anime` mantém a biblioteca e dados de acompanhamento.

As rotas `/user/[username]` e `/user/[username]/library` usam leitores com chave pública ou sessão SSR, sem cliente administrativo. RPCs `SECURITY INVOKER` delegam a funções internas no schema não exposto `profile_access`. Elas verificam visibilidade pública ou ownership por `auth.uid()` e retornam campos aprovados no mesmo snapshot. Tabelas privadas permanecem fechadas aos clientes da API.

Páginas públicas são dinâmicas e verificam privacidade a cada nova leitura. Perfil privado e inexistente apresentam indisponibilidade ao visitante. Conteúdo já recebido enquanto público não pode ser recolhido.

## Organização

- `src/app`: páginas e endpoints de busca autenticados.
- `src/actions`: mutations e operações do servidor.
- `src/components`: interface e composição do perfil.
- `src/data`: clientes, leitores e tipos de banco.
- `src/lib`: validações, contratos, sessão e integração AniList.
- `src/services`: sincronização de lançamentos sob demanda.
- `supabase/migrations`: evolução do schema e contratos SQL.
- `tests` e `supabase/tests`: testes reutilizáveis.

Metadados AniList podem usar cache; identidade e visibilidade não ficam em cache compartilhado. Atualizações revalidam páginas afetadas. Links e banner são validados no servidor; conteúdo textual é exibido como texto.
