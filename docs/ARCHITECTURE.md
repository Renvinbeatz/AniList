# Arquitetura e Estrutura da V1

Este documento descreve a arquitetura final consolidada do Anime Tracker (V1).

## Princípios Core

- **Monólito Next.js (App Router):** Todo o backend e frontend coexistem. Não há API separada.
- **Supabase como Fonte de Verdade:** O banco PostgreSQL gerencia o estado da aplicação. A API do AniList atua exclusivamente como fornecedora de metadados externos (caching).
- **Zero Autenticação Tradicional na V1:** A aplicação utiliza um modelo estrito de identificação por `username` via cookies HTTP-Only assinados. Não há senhas, e-mails ou OAuth. Esta é uma decisão deliberada da V1 para rastreamento pessoal de baixo atrito. Não é um modelo seguro para dados sensíveis.

## Fluxo de Dados e Camadas

A arquitetura foi estabilizada sob o seguinte padrão de pastas e responsabilidades:

```
src/
├─ app/                 Rotas da V1 (/, /dashboard, /library, /search, /anime/[anilistId], /calendar, /today)
├─ components/          Componentes UI (Shadcn + Radix) e lógicas visuais modulares.
├─ actions/             Server Actions restritas. O Client envia dados pra cá.
├─ services/            Orquestração e lógica de sincronismo assíncrono profundo (ex: `airing.ts`).
├─ data/                Acesso limpo ao banco de dados (`supabaseServerClient`) via Service Role.
├─ lib/                 Mappers do AniList, tipagens, middlewares, normalização de cores e gerenciador de sessão.
└─ supabase/migrations/ Schema oficial.
```

## Modelo de Dados (Schema)

As tabelas no Supabase operam com *Row Level Security* estrito e delegam o acesso para os *Server Components*:

1. `profiles`: Armazena o username e controla o UUID central da aplicação.
2. `anime`: Tabela de catálogo local. O `anilist_id` age como identificador de caching para evitar N+1 requests externos em animes populares.
3. `user_anime`: Relacionamento 1:N entre o perfil e a biblioteca. Guarda status, episódios assistidos e timestamp de conclusão.
4. `airing_schedule`: Armazena estritamente a janela cronológica dos lançamentos dos animes na tabela (data exata e episódio).
5. `platforms` & `user_anime_platforms`: Plataformas manuais vinculadas pelo usuário à sua entrada na biblioteca.

## Integração AniList e Cache Local

- A API externa (GraphQL) não interage com a UI.
- Ao solicitar o detalhe de um anime, a action `ensureAnime` avalia o cache local (`table: anime`). Se houver miss, aciona o AniList e faz upsert no Supabase lidando com problemas de concorrência silenciosamente (Unique Constraints violation handling).
- O AniList não provê garantias imediatas, portanto, a persistência permite que a UI carregue rápido mesmo com delays de rede da base japonesa.

## Airing e Calendário (Lançamentos)

- **Regra do Airing:** A sincronização ocorre de forma passiva (on-demand) quando o usuário acessa o detalhe de um anime cujo cronograma expirou. O sistema busca e insere a grade atualizada.
- **Não há Worker/Cronjob Background:** A atualização do banco depende dos *page hits*.
- **Timezone System:** As datas da AniList (`airing_at`) são salvas como timestamps UTC absolutos no PostgreSQL. O cliente converte a data para o fuso horário local do Browser (`Intl.DateTimeFormat`) *apenas* no momento da renderização em componentes Client-Side.

## Integração de Plataformas

- Plataformas como Netflix, Crunchyroll são associações completamente **manuais**.
- Não representam disponibilidade oficial e não são atualizadas automaticamente. Servem para que o usuário saiba por onde tem assistido suas obras.

## Limitações da V1

* Acesso baseado somente por Username (ausência de senhas).
* Sincronização de episódios novos (Airing) não é automática no background; depende da ação/navegação do usuário pelo site.
* Plataformas requerem imputação manual.
* Não há estatísticas avançadas, gráficos demográficos, rede social ou perfil de gostos e recomendações automáticas (fora de escopo deliberado).
