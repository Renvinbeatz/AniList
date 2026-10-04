# Anime Tracker

Aplicação web pessoal para acompanhar animes: biblioteca, status, progresso de episódios e calendário de lançamentos. O sistema utiliza metadados fornecidos pela API GraphQL do AniList, persistindo-os num cache local do Supabase para altíssima performance e resiliência.

> **Estado: V1 Concluída.**

## Tecnologias

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS (com Design System Premium e Tipografia Fluida)
- shadcn/ui & Radix UI
- Supabase (PostgreSQL)
- AniList GraphQL

## Funcionalidades V1

- **Sistema de Sessão:** Acesso baseado exclusivamente por `username` via Cookie HTTP-only. (Sem senhas ou autenticação complexa, ideal para tracker pessoal).
- **Busca e Catálogo:** Pesquisa de animes alimentada diretamente pelo AniList.
- **Detalhes Atmosféricos:** Página de detalhe (Detail) desenhada sob o conceito "A obra é a luz, a interface é a sala escura", com halo luminoso renderizado a partir das cores oficiais da capa (`coverImage.color`).
- **Biblioteca Pessoal:** Gerenciamento de status (`watching`, `planned`, `completed`, `paused`, `dropped`).
- **Progresso de Episódios:** Acompanhamento de episódios assistidos. Completar os episódios disponíveis altera o status nativamente.
- **Hoje & Calendário:** Grade e agenda responsivas para os lançamentos previstos dos próximos 7 dias. Lançamentos ocorrem e são calculados sob o timezone local do usuário, garantindo exatidão independentemente de sua geolocalização.
- **Plataformas Manuais:** Gerenciamento intencional e explícito de onde o usuário deseja assistir o anime (Netflix, Crunchyroll, etc.).

## Como Executar

### Pré-requisitos
- Node.js 20+
- Um banco de dados Supabase operando com as migrations inclusas.

### Passos

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env.local
# (Edite o .env.local com seu SUPABASE_URL, SUPABASE_SECRET_KEY e um SESSION_SECRET seguro)

# 3. Executar o Servidor de Desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

## Scripts Adicionais

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o projeto em modo desenvolvimento via Turbopack. |
| `npm run build` | Gera o build de Produção. |
| `npm run typecheck` | Roda a checagem rigorosa do TypeScript (`tsc --noEmit`). |
| `npm run lint` | Executa validações estáticas via ESLint. |

## Limitações da V1

- **Username Only:** Não existe um sistema com e-mail/senha. A posse de um username já autentica o dispositivo local por cookie de longa duração.
- **Sincronização Passiva:** Os horários de exibição (Airing) do calendário são sincronizados sob demanda nos *Server Components*. Não existe cronjob/worker rodando no fundo a cada segundo.
- **Plataformas Manuais:** Adicionar a "Netflix" a um anime significa apenas que *você* quer assistir por lá, não um agregador automático atestando a licença do catálogo local.

## Documentação da Arquitetura

Os detalhes de Design System, Fluxo de Dados e escolhas arquitetônicas estão disponíveis na [Arquitetura](docs/ARCHITECTURE.md).
