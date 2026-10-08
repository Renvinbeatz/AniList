# Arquitetura da Anicat

Next.js App Router, React, TypeScript e Tailwind compõem a aplicação. Páginas usam Server Components; componentes cliente concentram interatividade. A API GraphQL AniList fornece metadados públicos, armazenados no catálogo local quando necessário.

## Preparação de catálogo próprio — pausada

Em 07/10/2026, o usuário decidiu manter a AniList como fonte e pausar a transição para catálogo próprio. A primeira parte já criada foi preservada em `src/lib/catalog.ts`, `src/lib/validations/catalog.ts` e no leitor exclusivo do servidor em `src/data/catalog.ts`. O contrato usa o UUID de `anime.id`; não exige nem retorna um ID de fornecedor. O leitor adapta os registros existentes sem reescrevê-los ou alterar a origem dos conteúdos.

`src/actions/catalog.ts` verifica a sessão antes de qualquer consulta. `/api/catalog/anime-search` retorna resultados limitados, erros distintos e `private, no-store`. A busca local consulta títulos romaji, inglês e nativo, elimina duplicatas por UUID e trata `%` e `_` como caracteres literais. A camada não faz importações, mutations ou chamadas a APIs de metadados.

O validador editorial recebe somente conteúdo, normaliza campos opcionais vazios para `null` e aceita contagem de episódios desconhecida. Fonte e observações de direitos são informações do rascunho, sem representar aprovação para publicação. Identificadores de dono, revisor e fornecedor e flags de publicação fornecidos pelo cliente não entram no rascunho validado.

Essa fundação não constitui a migração completa: o schema ainda exige `anilist_id`, as telas usam os leitores anteriores e personagens/calendário ainda possuem dependências externas. Gestão editorial, permissões de equipe, adaptação do schema, conexão das telas e revisão da origem dos dados chegam nas próximas partes descritas em `V4_ROADMAP.md`.

## Identidade e mutations

Supabase Auth SSR é a fonte de identidade. `getSession()` verifica o usuário no servidor e resolve `auth.users.id → profiles.auth_user_id → profiles.id`. Actions derivam ownership da sessão, validam os dados e alteram apenas o perfil correspondente. IDs de dono não são aceitos como autoridade do navegador.

O cliente administrativo de `src/data/supabase.ts` é exclusivo do servidor e ignora RLS. Cada operação privada precisa de autorização explícita. Cookies e renovação usam `src/utils/supabase/` e `src/proxy.ts`.

## Página inicial e acesso

`/` apresenta a Anicat aos visitantes; `/login` e `/signup` compartilham `AuthForm` e as Server Actions de autenticação existentes. As três páginas verificam `getSession()` no servidor e encaminham usuários autenticados ao dashboard. Páginas privadas encaminham visitantes para `/login`; sair da conta retorna à apresentação pública.

`LandingPage` usa componentes da marca e do catálogo de avatares. A biblioteca ilustrativa contém títulos e capas públicos definidos estaticamente; não consulta bibliotecas pessoais. A seção social leva à comunidade implementada na V4.

## Perfis e leitura pública

`profiles` contém personalização, visibilidade e links sociais. `profile_favorites` e `profile_pinned_anime` mantêm coleções com limites e posições protegidos por constraints e mutations atômicas. `user_anime` mantém a biblioteca e dados de acompanhamento.

As rotas `/user/[username]` e `/user/[username]/library` usam leitores com chave pública ou sessão SSR, sem cliente administrativo. RPCs `SECURITY INVOKER` delegam a funções internas no schema não exposto `profile_access`. Elas verificam visibilidade pública ou ownership por `auth.uid()` e retornam campos aprovados no mesmo snapshot. Tabelas privadas permanecem fechadas aos clientes da API.

Páginas públicas são dinâmicas e verificam privacidade a cada nova leitura. Perfil privado e inexistente apresentam indisponibilidade ao visitante. Conteúdo já recebido enquanto público não pode ser recolhido.

## Identidade visual

`BrandLogo` aplica o símbolo vetorial de gato preto e o nome Anicat. `ProfileIdentity` compartilha a apresentação de banner, avatar e bio entre o perfil próprio e o público; ações e estatísticas são fornecidas por cada página conforme o acesso existente.

O catálogo `AVATAR_PRESETS` contém as 24 combinações aprovadas de quatro expressões e seis fundos, com SVGs locais em `public/avatars`. `AVATAR_EXPRESSIONS` e `AVATAR_COLORS` descrevem as opções; `resolveAvatarPreset` aplica o padrão normal/areia quando não há escolha válida. O editor agrupa as opções por expressão e apresenta uma prévia antes de salvar.

Os IDs `black`, `blue` e `purple` continuam válidos e representam os avatares normais com fundo areia, azul e lavanda, respectivamente. A migration `anicat_avatar_catalog` amplia o CHECK do banco sem reescrever os perfis existentes. Avatar e personagem favorito permanecem independentes. A navegação oferece todas as seções em tablets e acrescenta acesso ao calendário no cabeçalho do celular.

## Plataformas oficiais e particulares

`src/data/streaming.ts` consulta somente `Media.externalLinks` na AniList, utilizando o cache existente de uma hora. `src/lib/streaming.ts` aceita links HTTPS de streaming em serviços conhecidos, elimina duplicatas e limita os resultados. `StreamingPlatforms` distingue resposta sem links de falha da fonte e informa que a disponibilidade no Brasil não foi confirmada. As associações manuais anteriores continuam em `platforms` e `user_anime_platforms`, apresentadas como escolhas pessoais de onde assistir.

`personal_platforms` armazena nome e URL HTTPS opcional por dono. `user_anime_personal_platforms` associa essas plataformas aos itens da biblioteca usando chaves estrangeiras compostas com `profile_id`, impedindo vínculos entre contas diferentes. A exclusão de uma plataforma remove suas associações; nomes são únicos por dono sem diferenciar maiúsculas de minúsculas.

As duas tabelas têm RLS habilitado e acesso direto fechado para clientes públicos/autenticados. Leitores exclusivos do servidor e `src/actions/personal-platforms.ts` filtram pela identidade resolvida na sessão. O cliente recebe apenas IDs de plataformas, nomes e URLs; não recebe IDs de dono. Os contratos públicos de perfil e biblioteca não incluem esses dados.

`PersonalPlatformControls` oferece criação, edição, exclusão com confirmação e associação na página de um anime presente na própria biblioteca. A seleção usa `useOptimistic` dentro da transição: falhas restauram a seleção anterior, e mutations bem-sucedidas revalidam as páginas de anime. Plataformas particulares são persistidas na conta, independentemente do navegador.

## Comunidade e relações sociais

`profile_follows` e `profile_blocks` representam relações por conta. Ações recebem usernames; o ator vem de `getSession()`. RPCs `social_people`, `social_relationship` e `social_feed` retornam contratos limitados, sem IDs de conta/perfil. São `SECURITY INVOKER` e executáveis somente pelo cliente administrativo do servidor; tabelas novas têm RLS e permissões diretas revogadas para clientes. `social_visible` centraliza visibilidade e bloqueio bilateral. Os leitores públicos existentes também verificam bloqueio pela identidade SSR real em `auth.uid()`.

`community_posts` unifica tópicos e reviews. Reviews têm referência ao UUID local do anime e unicidade por autor/obra. `community_comments` permite comentários e uma camada de respostas; a chave composta impede respostas em outro tópico. Títulos, textos e imagens são validados no servidor, texto é renderizado sem interpretar HTML, e conteúdo com spoilers usa `details` fechado. Imagens externas HTTPS são carregadas pelo navegador, com fallback, sem proxy pelo servidor.

`social_publish_log` registra publicações aceitas independentemente da existência posterior do conteúdo. `social_rate` usa trava transacional por conta para verificar intervalo e janela móvel atomicamente: posts/reviews compartilham 60 segundos e três em dez minutos; comentários usam 15 segundos e 20 em dez minutos. Edições passam pela moderação, mas não contam como novas publicações. O filtro de termos em `src/lib/community.ts` normaliza variações básicas; não oferece classificação semântica ou de imagens.

`share_library_activity` começa falso. Um trigger registra apenas alterações futuras de status de perfis públicos que optaram por compartilhar; `library_activity` não armazena progresso, notas ou plataformas. O leitor revalida a preferência e a visibilidade atuais; desativar apaga eventos anteriores. Remover o item da biblioteca também remove suas atividades.

`social_notifications` mantém avisos privados de novos seguidores, comentários, respostas e remoção pela moderação. As leituras filtram destinatário, visibilidade dos envolvidos e existência do conteúdo. Remover comentários/tópicos remove avisos vinculados; marcar como lido sempre filtra o dono. Não envia emails ou notificações externas.

`community_reports` armazena denúncias privadas com snapshot para revisão; não publica o denunciante nem remove automaticamente conteúdo por quantidade de denúncias. Há limite de uma denúncia a cada 30 segundos e dez em dez minutos, além de unicidade por denunciante/conteúdo. `community_moderators` é uma lista explícita de membros da equipe, vazia para contas reais nesta entrega. A fila e as decisões verificam esse cadastro no banco; metadados editáveis pelo usuário não concedem permissões. Moderadores podem encerrar denúncias ou remover conteúdo após confirmação, preservando o registro da análise. Cadastrar a equipe exige uma decisão explícita posterior; não é feito pelos formulários da comunidade.

As migrations sociais são incrementais; o catálogo próprio permanece pausado. Nenhuma cobrança, plano pago, auditoria dedicada ou integração da V5 foi adicionada.

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
