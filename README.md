# AniList Tracker V3

Aplicação para acompanhar animes, organizar a biblioteca e personalizar perfis. Metadados vêm da API GraphQL da AniList; contas, perfis e coleções são mantidos no Supabase.

## Funcionalidades

- Login e cadastro por username e senha com Supabase Auth SSR.
- Busca, catálogo, biblioteca com cinco status, progresso e calendário.
- Avatar predefinido, banner HTTPS, bio e personagem favorito selecionado por busca.
- Até 10 favoritos e 6 fixados, com busca e ordenação.
- Perfil em `/user/[username]`, público ou privado.
- Biblioteca pública com título, capa e status, filtros e paginação. Progresso, avaliações e anotações permanecem privados.
- Links opcionais para Instagram, X, YouTube, Discord e GitHub, seguindo a privacidade do perfil.

Avatares preto, azul e roxo são temporários. Plataformas de streaming são associações manuais; o calendário sincroniza sob demanda. Seguidores, feed, comentários e reviews ficam fora desta versão.

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

[Arquitetura](docs/ARCHITECTURE.md)
