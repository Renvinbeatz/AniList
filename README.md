# Anicat — Community & Anime List

Aplicação para acompanhar animes, organizar a biblioteca e personalizar perfis. Metadados vêm da API GraphQL da AniList; contas, perfis e coleções são mantidos no Supabase.

A AniList permanece como fonte de metadados, conforme decisão de 07/10/2026. A preparação de catálogo próprio está pausada: a camada de busca local e leitura por UUID já criada foi preservada, mas não substitui os fluxos atuais. As etapas sociais da V4 estão implementadas e testadas. A disponibilidade regional das plataformas e o cadastro da equipe de moderação têm as limitações operacionais descritas no [roadmap da V4](docs/V4_ROADMAP.md).

## Funcionalidades

- Página inicial pública de apresentação, com exemplos da biblioteca e acessos para entrar ou criar conta.
- Login e cadastro por username e senha com Supabase Auth SSR.
- Busca, catálogo, biblioteca com cinco status, progresso e calendário.
- 24 avatares do gato Anicat: feliz, triste (sem sobrancelhas), rindo e normal, em seis cores de fundo. Banner HTTPS, bio e personagem favorito selecionado por busca.
- Até 10 favoritos e 6 fixados, com busca e ordenação.
- Perfil em `/user/[username]`, público ou privado.
- Biblioteca pública com título, capa e status, filtros e paginação. Progresso, avaliações e anotações permanecem privados.
- Links opcionais para Instagram, X, YouTube, Discord e GitHub, seguindo a privacidade do perfil.
- Links de streaming fornecidos pela AniList, sem confirmação de disponibilidade no Brasil.
- Plataformas particulares salvas na conta: criar, editar, excluir e associar aos animes da biblioteca, com acesso exclusivo do dono.
- Busca de pessoas, seguir/deixar de seguir e listas de seguidores/seguindo.
- Comunidade geral e feed de seguidos com tópicos, imagens HTTPS opcionais, reviews por anime, comentários e respostas. Spoilers ficam recolhidos.
- Compartilhamento opcional de mudanças de status da biblioteca, desligado por padrão.
- Notificações internas, bloqueio entre contas, denúncias privadas e fila restrita de revisão.
- Filtro básico de linguagem discriminatória e limites de publicação por conta, aplicados no servidor.

Identidade visual Anicat, com navegação adaptada a celulares e tablets. Visitantes recebem a apresentação em `/`; login e cadastro ficam em `/login` e `/signup`. Quem já está autenticado acessa o dashboard diretamente. A página do anime separa os links oficiais da escolha pessoal de onde assistir e preserva as associações manuais anteriores. O calendário sincroniza sob demanda. A comunidade fica em `/community`; notificações em `/notifications` e bloqueios em `/community/blocked`.

Posts, reviews e comentários acompanham a visibilidade atual do autor. Imagens usam links HTTPS; uploads e análise automática de imagens não fazem parte desta entrega. O filtro de termos reduz abuso conhecido, mas não detecta todos os contextos. Denúncias são privadas e não removem conteúdo automaticamente. `/moderation` exige cadastro explícito em `community_moderators`; nenhuma conta foi promovida automaticamente. Bloqueios se aplicam às contas autenticadas, preservando a natureza pública dos conteúdos para visitantes.

## Executar

Requer Node.js 20.9 ou superior e um projeto Supabase configurado.

1. Instale as dependências com `npm ci`.
2. Copie `.env.example` para `.env.local` e preencha as quatro variáveis. As URLs devem apontar para o mesmo projeto. A chave administrativa pertence exclusivamente ao servidor.
3. Prepare o banco com as migrations de `supabase/migrations`. Em projetos existentes, confira o histórico remoto antes de reaplicar migrations; o banco oficial da V3 já está configurado.
4. Execute `npm run dev` e abra `http://localhost:3000`.

## Verificar

```text
npm run lint
npm run typecheck
npm run build
node --test tests/*.test.mjs
```

Testes reutilizáveis ficam em `tests/` e `supabase/tests/`. As suítes `.browser.mjs` e `.live.mjs` exigem `--live`, servidor local, Playwright/Chrome e acesso ao projeto Supabase indicado pelo teste. Criam contas temporárias e verificam sua limpeza; execute uma por vez. Capturas e resultados gerados não são versionados.

`node tests/catalog.live.mjs --live` é uma verificação exclusivamente de leitura: consulta o catálogo oficial, verifica a busca e os UUIDs e compara os registros antes/depois. Não requer servidor local ou navegador e não cria fixtures.

As suítes sociais usam `SOCIAL_BASE_URL` (padrão `http://127.0.0.1:3015`) e `SOCIAL_BROWSER_PATH` para o Chrome. Execute `social-following.browser.mjs`, `community-topics.browser.mjs`, `reviews.browser.mjs` e `interactions.browser.mjs` separadamente com `--live`. O helper cria contas isoladas, revoga suas sessões ao finalizar, remove os dados por cascade e compara os registros originais de 18 tabelas. `social-visual.browser.mjs` verifica layouts e gera capturas temporárias em `test-results/v4-social` para revisão.

[Arquitetura](docs/ARCHITECTURE.md)

[Planejamento da V4](docs/V4_ROADMAP.md) · [Direção da V5](docs/V5_DIRECTION.md)
