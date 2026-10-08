# Anicat — Escopo confirmado da V4

Registrado em 6 de outubro de 2026 e atualizado em 7 de outubro de 2026. O usuário aprovou as cinco frentes originais e acrescentou uma página inicial de apresentação e um sistema de plataformas. A ordem abaixo incorpora essa orientação. A base é a V3 já enviada ao GitHub.

## Nome da marca — confirmado

- Nome curto: **Anicat**.
- Assinatura: **Community & Anime List**, com a grafia inglesa padrão de "Community".
- Apresentação completa: **Anicat — Community & Anime List**.
- Símbolo visual confirmado pelo usuário: **um gato preto**. O usuário aprovou a logo minimalista e os avatares baseados na mesma silhueta: feliz, triste (sem sobrancelhas), rindo e normal, com fundos lavanda, azul, sálvia, pêssego, rosa e areia. Essas escolhas integram a Etapa 1.
- Nome escolhido pelo usuário antes da Etapa 1. Deve orientar a identidade visual, o logotipo e a apresentação da página inicial.
- A interface e os títulos das páginas adotam Anicat. Identificadores técnicos do banco e do repositório continuam preservados.

## Objetivo do produto

Ser uma comunidade e um lugar para organizar o que cada pessoa assiste, pretende assistir ou não está assistindo no momento, em diferentes plataformas. A primeira visita deve explicar essa proposta antes de pedir login. A organização pessoal inclui os serviços oficiais e plataformas particulares escolhidas pelo usuário.

A comunidade terá foco em texto e discussão, com imagens como complemento. As referências citadas pelo usuário são Twitter para publicações e Reddit para tópicos com conversas nos comentários. Isso orienta a experiência; não implica reproduzir todas as funcionalidades dessas plataformas.

## Etapas, na ordem de execução

| Etapa | Entrega aprovada | Estado |
| --- | --- | --- |
| 1 — Identidade visual | Avatares definitivos, refinamento dos perfis e navegação melhor no celular. | Concluída em 06/10/2026 |
| 2 — Página inicial | Apresentação pública do site, sua proposta de comunidade e organização de animes, exemplos das funcionalidades e acessos claros para entrar ou criar conta. A primeira visita deixa de abrir diretamente o formulário de login. | Concluída em 06/10/2026 |
| 3 — Plataformas | Buscar informações de onde os animes estão disponíveis nos serviços oficiais; permitir criar e associar plataformas pessoais privadas. | Entrega inicial implementada em 07/10/2026; disponibilidade no Brasil ainda não confirmada pela fonte |
| 4 — Encontrar pessoas | Busca por username, seguir/deixar de seguir e páginas de seguidores/seguindo. | Concluída e testada em 07/10/2026 |
| 5 — Feed e tópicos | Publicações de texto com imagens opcionais, criação de tópicos e acesso à discussão; integrar mudanças públicas permitidas na biblioteca das pessoas seguidas. Incluir o filtro básico e os limites de publicação desde a criação dos posts. | Concluída e testada em 07/10/2026 |
| 6 — Reviews | Publicar opiniões sobre animes, indicação de spoilers, edição e remoção. | Concluída e testada em 07/10/2026 |
| 7 — Interação | Comentários e discussões nos tópicos/reviews, notificações, bloqueio, denúncia e integração do automoderador com esses conteúdos. | Concluída e testada em 07/10/2026 |

## Comunidade — direção confirmada

- Dar protagonismo ao texto, com leitura confortável e imagens opcionais.
- Permitir que uma pessoa crie um tópico e outras comentem e discutam sobre ele.
- Na Etapa 5, definir criação, edição/remoção pelo autor, apresentação do tópico e integração com o feed. Os comentários chegam na Etapa 7.
- Reviews da Etapa 6 são opiniões vinculadas a uma obra; tópicos são espaços de conversa. Definir sua relação sem duplicar a experiência.
- Alinhar antes de implementar se haverá comunidades separadas por assunto ou uma comunidade geral com tópicos. A estrutura de grupos ainda não foi definida.
- A referência a Twitter/Reddit não aprova automaticamente votos, reposts, mensagens privadas ou outras funcionalidades.

## Automoderador — direção confirmada

O usuário pediu moderação automática simples para reduzir abuso e spam sem exigir acompanhamento humano constante. Essa é uma funcionalidade da comunidade na V4; a auditoria dedicada de segurança continua reservada à V5.

### Conteúdo

- Permitir palavrões leves; não bloquear indiscriminadamente toda linguagem informal.
- Bloquear antes da publicação insultos discriminatórios graves, incluindo racismo e homofobia, segundo uma lista de termos/regras que será definida antes da implementação.
- Aplicar a validação no servidor aos títulos e textos de posts, reviews e comentários, inclusive quando editados. O filtro deve acompanhar cada tipo de conteúdo assim que ele for implementado nas Etapas 5, 6 e 7.
- Considerar variações básicas da escrita para evitar um filtro limitado à comparação literal, preservando o texto original dos conteúdos permitidos.
- Mostrar uma mensagem clara quando o conteúdo for recusado, permitindo editar e tentar novamente.
- Prever ajuste das regras e tratamento de falsos positivos. Um filtro de palavras não garante detecção de todo abuso nem substitui denúncias e revisão de casos ambíguos.
- O pedido inicial cobre texto. Moderação do conteúdo das imagens ainda precisa ser delimitada; não presumir que o filtro textual analise imagens.

### Frequência de publicação

Direção solicitada: limitar publicações por conta e aplicar pausas temporárias quando houver excesso. Como proposta inicial, baseada nos exemplos do usuário:

- Intervalo mínimo de 60 segundos entre posts.
- Até 3 posts em uma janela móvel de 10 minutos; novas publicações ficam temporariamente impedidas enquanto não houver uma vaga na janela.
- Informar quanto falta para poder publicar novamente. A pausa afeta a publicação, preservando acesso para leitura e navegação.
- Verificar os limites no servidor com a identidade autenticada e contagem consistente, inclusive em tentativas simultâneas. Contadores do navegador não são a autoridade.
- Alinhar os números e a duração efetiva antes de implementar. O exemplo de 3 posts em 10 minutos foi apresentado como sugestão, não como limite definitivo.
- Definir limites próprios para comentários/reviews e a participação de publicações recusadas na contagem. Não aplicar automaticamente o limite de posts a todas as interações.

Filtro e limites devem funcionar na primeira entrega de publicação da Etapa 5. A Etapa 7 integra denúncias, bloqueios e comentários à mesma camada, sem adiar a proteção básica dos posts até lá.

## Página inicial — direção confirmada

- Explicar o que é o Tracker e como ele ajuda a organizar animes e participar da comunidade.
- Aplicar a identidade visual definida na Etapa 1.
- Apresentar as funcionalidades realmente disponíveis. Recursos sociais ainda pendentes não devem parecer já implementados.
- Dar acesso claro ao login e cadastro, preservando os fluxos de autenticação existentes.
- Usuários já autenticados são encaminhados ao dashboard ao acessar `/`, `/login` ou `/signup`.

## Plataformas — direção confirmada

Separar a informação de **onde uma obra está disponível** da escolha pessoal de **onde o usuário assiste**. A disponibilidade oficial deve vir de uma fonte externa apropriada, em vez de depender do cadastro manual pelo usuário. Netflix, Crunchyroll e Amazon são exemplos citados pelo usuário.

O usuário também poderá criar sua própria plataforma e associá-la aos animes da biblioteca. Isso inclui sites particulares ou não oficiais que ele utilize. Essas plataformas são pessoais: somente o próprio usuário poderá vê-las; não entram no catálogo público, no perfil público nem no feed, mesmo quando o perfil estiver público.

Entrega inicial da Etapa 3:

- O usuário confirmou o armazenamento privado **na conta**, acessível em diferentes dispositivos. Nome obrigatório, URL HTTPS opcional, criação, edição, exclusão com confirmação e associação aos animes da própria biblioteca.
- Os links oficiais vêm de `Media.externalLinks` da AniList, limitados ao tipo streaming, serviços conhecidos e URLs HTTPS. A consulta usa o cache existente de uma hora e diferencia resposta sem links de falha da fonte. Não encontrar links não significa ausência confirmada do anime nos serviços.
- **Brasil** continua sendo a região pretendida. A AniList não confirma disponibilidade por país; a interface informa essa limitação e orienta a conferir no serviço. A opção de começar com essa cobertura parcial foi apresentada ao usuário e adotada como premissa inicial enquanto sua resposta sobre confirmação regional estava pendente. Uma fonte regional ainda precisa ser definida para cumprir essa parte integralmente.
- As escolhas manuais anteriores foram preservadas sob "Onde eu assisto"; não são apresentadas como evidência de disponibilidade oficial.
- As plataformas particulares não aparecem nas leituras e páginas públicas. A identidade é resolvida no servidor; as relações no banco também rejeitam associação entre donos diferentes.

## Método de trabalho

1. Revisar a implementação existente e delimitar a etapa atual antes de alterar o código.
2. Resolver as decisões de produto necessárias àquela entrega, preservando o escopo aprovado.
3. Implementar, testar os fluxos reais e corrigir as falhas encontradas.
4. Testar e documentar o resultado e eventuais limitações antes de avançar.
5. Em 07/10/2026, o usuário autorizou continuar automaticamente da Etapa 4 até o fim da V4, sem pausas entre etapas. Isso substitui a regra anterior de aguardar uma nova mensagem a cada entrega.

O agente prepara e executa os testes funcionais. Uma etapa só é concluída após verificar seu funcionamento, as regras de acesso previstas e os fluxos anteriores afetados. Testes de integração usam dados isolados e removem seus fixtures, preservando os usuários reais. A frente dedicada de testes de segurança e preparação final pertence à V5, conforme orientação do usuário.

## Diretrizes

- Preservar o visual escuro e cinematográfico, com protagonismo das artes dos animes.
- Manter avatar e personagem favorito como escolhas distintas.
- Preservar a identidade e a autorização no servidor; a interface não decide ownership.
- Perfil público não autoriza publicar automaticamente progresso, avaliações, anotações ou plataformas pessoais privadas. Definir quais atividades podem ser compartilhadas na Etapa 5.
- Planejar visibilidade e acesso das relações sociais na Etapa 4.
- Ocultar spoilers por padrão nas reviews e considerar esse comportamento nos comentários.
- Definir as regras de bloqueio, denúncia e notificações antes da entrega da Etapa 7.

## Preparação para a V5

A V5 terá foco em segurança e monetização, detalhados em [V5_DIRECTION.md](V5_DIRECTION.md). Não incluir auditorias de segurança, pentests, cobrança ou implementação dos planos como etapas da V4. Manter a autorização e a privacidade necessárias ao funcionamento das funcionalidades atuais.

Ao construir a V4, manter o catálogo de personalização, a apresentação da identidade do autor e os componentes de perfil/comunidade organizados para receber opções adicionais e selos de assinatura futuramente. Evitar regras de plano espalhadas nas telas. Não criar planos ativos, permissões pagas, checkout ou integrações de pagamento nesta versão.

## Ideias para avaliar, sem aprovação automática

Compatibilidade de favoritos (por exemplo, favoritos públicos em comum) e agrupamento de atividades da mesma obra no feed foram sugeridos. São propostas para avaliar durante as etapas pertinentes, não entregas adicionais já confirmadas.

## Entregas e validação

As Etapas 4, 5, 6 e 7 foram implementadas, testadas e documentadas nessa ordem, conforme autorização de execução contínua. A regressão final aprovou **115 testes de lógica, lint, compilação e 79 verificações no navegador** distribuídas entre seguidores, tópicos, reviews, interações, plataformas, página inicial, personalização, perfil público e biblioteca pública. A revisão visual cobriu a comunidade de 320 a 1280 pixels; a navegação de tablet e o espaçamento do rodapé foram ajustados para preservar as ações da conta. A página inicial agora apresenta a comunidade disponível.

Complementos finais verificaram fallback de imagem externa indisponível e avisos explícitos nos formulários quando o perfil privado torna publicações/comentários visíveis apenas ao autor. A revisão visual e a verificação do rodapé no tablet passaram. Capturas temporárias foram removidas após a revisão; testes reutilizáveis e migrations foram preservados. A conferência final encontrou os oito perfis, 37 animes e 30 itens de biblioteca originais, sem registros temporários nas nove tabelas sociais. O servidor temporário foi encerrado. Os nomes dos cinco arquivos de migration mais recentes foram alinhados às versões confirmadas no histórico remoto após aplicação via MCP, sem reaplicar SQL nem alterar dados.

Pendências operacionais conhecidas: a disponibilidade dos serviços no Brasil continua sem confirmação regional, como documentado na Etapa 3; a conta real responsável por revisar denúncias ainda precisa ser indicada/cadastrada. A implementação da V5 não foi iniciada. O envio do código e dos documentos ao GitHub foi autorizado em 8 de outubro de 2026; as migrations de cada etapa foram aplicadas ao banco oficial.

Etapa 7 entregue: comentários e uma camada de respostas nos tópicos/reviews, com edição pelo autor, exclusão confirmada e remoção das respostas vinculadas. Moderação e limites de comentários atuam no servidor e em transação; respostas precisam pertencer à mesma discussão e não criam cadeias ilimitadas. Comentários de uma publicação marcada como spoiler ficam recolhidos, mesmo se a marca individual for removida.

Notificações internas cobrem seguidores, comentários, respostas e remoção após análise. Somente o destinatário pode ler/marcar notificações; conteúdo privado, bloqueado ou removido é filtrado na leitura. Não há envio externo. Bloqueios confirmados removem relações de seguir nos dois sentidos e avisos entre as contas, escondem os perfis/bibliotecas/conteúdo social entre elas e impedem novas interações. Desbloquear não restaura as relações. Essa proteção se aplica às contas autenticadas; conteúdo público continua acessível a visitantes sem conta.

Denúncias privadas usam motivos fixos, detalhes opcionais e snapshot do conteúdo. Não removem automaticamente conteúdo por contagem de denúncias. A fila `/moderation` exige cadastro explícito em `community_moderators`, sem confiar em metadados editáveis pelo usuário. Nenhuma conta real foi promovida. Moderadores podem encerrar uma denúncia ou remover conteúdo após confirmação; registros da análise são preservados. O filtro textual básico e a fila manual não fazem análise automática de imagens.

Validação inicial da Etapa 7: 115 testes de lógica, lint e compilação aprovados; oito verificações no navegador abrangendo comentário/edição/resposta/spoilers, moderação, limite simultâneo/janela móvel, autorização, notificações, leitura pelo dono, denúncias/duplicidade/fila, tentativa de promover-se via metadata, bloqueio bilateral inclusive nos RPCs públicos anteriores, desbloqueio, exclusão em cascata, revisão de denúncia e layout em 320 pixels. Fixtures removidos; registros originais das 18 tabelas verificadas preservados. Migration `20261008015537_community_interactions.sql` aplicada ao banco oficial. A equipe de moderação real ainda precisa ser cadastrada por decisão explícita do responsável.

Etapa 6 entregue: reviews por anime, com uma review por autor/obra, edição e remoção pelo autor. A página do anime mostra reviews e leva ao editor; uma listagem paginada atende obras com mais de 20 reviews. Tópicos e reviews usam a mesma discussão, evitando telas duplicadas. O editor de review começa com spoilers marcados, e conteúdo marcado fica recolhido no feed e na página do anime. Não publica nem altera a nota pessoal da biblioteca.

Validação da Etapa 6: 113 testes de lógica, lint e compilação aprovados; quatro verificações no navegador abrangendo publicação, exibição por anime, spoilers, edição, prevenção de duplicatas/conversão indevida, autorização, moderação, limite compartilhado com tópicos, privacidade, celular e exclusão. Fixtures removidos e registros originais preservados. Migration `20261008014623_community_reviews.sql` aplicada ao banco oficial.

Etapa 5 entregue: comunidade geral e feed de pessoas seguidas em `/community`, criação, edição e exclusão de tópicos, imagem HTTPS opcional com fallback, texto plano e spoilers recolhidos. O filtro básico de termos discriminatórios atua no servidor, inclusive em edições, com normalização de acentos, alguns números e separadores. Palavrões leves são permitidos. O filtro não é um classificador semântico nem analisa imagens; casos não detectados dependem das denúncias previstas na Etapa 7.

O limite aprovado é serializado no banco por conta: uma publicação a cada 60 segundos e até três em dez minutos. O histórico de frequência é separado dos tópicos; excluir uma publicação não libera a janela. Edições não contam como novas publicações. Compartilhamento da biblioteca é opt-in: apenas novas mudanças de status geram eventos, sem importar o passado; notas, episódios e plataformas não entram no contrato. Perfil privado oculta conteúdo social dos visitantes. Desativar compartilhamento remove os eventos anteriores.

Validação da Etapa 5: 112 testes de lógica, lint e compilação aprovados; seis verificações no navegador abrangendo publicação/edição/exclusão, spoilers e texto HTML literal, moderação, limite simultâneo e janela móvel, privacidade, feed de seguidos, atividades opcionais e celular. O teste encontrou uma associação incorreta de rótulos no editor preenchido; foi corrigida e a suíte passou após nova compilação. Fixtures removidos e registros originais idênticos. Migration `20261008013517_community_topics.sql` aplicada ao banco oficial.

Etapa 4 entregue: `/people` busca usernames por trecho literal e pagina em grupos de 20. Botões de seguir/deixar de seguir aparecem na busca e nos perfis; `/user/[username]/connections` apresenta seguidores/seguindo. Somente perfis públicos aparecem na descoberta, e listas de relações filtram perfis visíveis ao visitante. O dono de um perfil privado pode acessar suas próprias listas. Os contratos não retornam IDs de conta/perfil. Tabelas e RPCs sociais são fechados a chamadas diretas de clientes; o servidor deriva o ator da sessão.

Validação da Etapa 4: 109 testes de lógica, lint e compilação aprovados; quatro verificações no navegador cobrindo busca literal, privacidade, seguir/deixar de seguir, persistência, listas, acesso anônimo, rejeição de auto-seguimento e layout em 320 pixels. Contas temporárias removidas e registros originais comparados integralmente. A migration `20261008012959_social_following.sql` foi aplicada ao banco oficial.

Decisões confirmadas pelo usuário para as próximas etapas: comunidade geral sem grupos; posts e reviews com intervalo de 60 segundos e até três publicações em dez minutos; comentários com intervalo de 15 segundos e até 20 em dez minutos. Compartilhamento de atividades da biblioteca é opcional, desligado por padrão e limitado ao anime e à mudança de status. Progresso, notas e plataformas particulares permanecem privados.

Em 07/10/2026, o usuário decidiu **manter a AniList** como fonte de metadados e pausar a migração para catálogo próprio. A entrega inicial da **Etapa 3 — Plataformas** foi implementada e testada; a confirmação de disponibilidade regional permanece pendente. O usuário autorizou continuar automaticamente até o fim da V4. A decisão de manter a integração não representa autorização concedida pelo fornecedor; a questão dos termos permanece sem resposta da AniList.

A migration `20261007230234_personal_platforms.sql` foi aplicada ao banco oficial. Acrescenta plataformas particulares, associações com a biblioteca, unicidade de nome por dono e vínculos que impedem associações entre contas diferentes. As tabelas são acessadas pelo servidor e ficam fechadas para consultas diretas dos clientes.

Validação da entrega inicial: compilação, verificação de tipos e lint aprovados; 107 testes de lógica e 7 verificações no navegador. Incluiu persistência em outra sessão, edição, remoção de URL, duplicidade de nome, associação/desassociação, exclusão com confirmação e remoção das associações, layout de 320 pixels, acesso sem sessão, tentativa de alterar dados de outra conta e ausência de plataformas particulares no perfil/biblioteca públicos. Os dados isolados de teste foram removidos; a comparação das nove tabelas envolvidas confirmou os registros originais idênticos. Uma falha na atualização visual do checkbox foi corrigida e a suíte no navegador passou após nova compilação.

### Catálogo próprio — preparação pausada

O registro abaixo preserva o histórico da preparação anterior. A Parte A foi concluída; as Partes B, C e D não serão iniciadas enquanto essa direção estiver pausada. Nenhuma tela foi migrada para a nova camada, nenhum dado foi importado e a integração AniList permaneceu ativa.

- A identidade de uma obra é o UUID interno da Anicat. IDs de fornecedores, quando necessários, serão referências opcionais, sem substituir essa identidade.
- Preservar as bibliotecas, posições de favoritos/fixados e histórico existentes. A tabela `anime` já possui UUID próprio e as relações pessoais já usam esse UUID.
- Cadastro pela equipe, com sugestões dos usuários depois, é a proposta inicial. A forma de alimentar o catálogo ainda aguarda a escolha do usuário; nenhuma conta foi promovida a administradora.
- Registrar e revisar a origem dos metadados e as condições de uso das artes. Transferir conteúdo antigo para o banco próprio não muda seus direitos nem o torna automaticamente editorial ou CC0.
- Disponibilidade nos serviços oficiais é um conjunto de informações separado do catálogo de obras, com país, fonte e data de verificação.

| Parte | Entrega | Estado |
| --- | --- | --- |
| A — Fundação de leitura e cadastro | Contratos sem ID externo obrigatório, validação dos futuros rascunhos, leitura por UUID e busca local autenticada. | Concluída e testada em 06/10/2026 |
| B — Gestão editorial | Definir acesso da equipe; permitir criar/editar obras próprias; adaptar o schema para dispensar IDs externos e registrar origem/revisão. | Pendente |
| C — Conectar os fluxos | Usar o catálogo local nas telas, busca, favoritos e fixados; manter compatibilidade com os links anteriores. | Pendente |
| D — Concluir a transição | Preparar personagens e calendário próprios, revisar metadados/artes antigos e desativar os caminhos dependentes da AniList. | Pendente |

A Parte A não altera o schema nem cadastra obras: prepara uma camada de leitura do catálogo existente e a validação de rascunhos editoriais. O novo endpoint `/api/catalog/anime-search` exige sessão e consulta apenas o banco da Anicat. As telas atuais continuam no fluxo anterior até a Parte C; personagens e sincronização do calendário ainda usam a integração anterior até a Parte D. Nenhuma importação massiva está autorizada por essa decisão.

Cada parte segue o método já combinado: implementar, testar e parar. A auditoria dedicada da V5 permanece fora dessa preparação.

Validação da Parte A: 98 testes de lógica aprovados (13 novos para o catálogo), lint, verificação de tipos e compilação aprovados. Consultas reais verificaram busca, leitura por UUID, obra inexistente e caracteres especiais; as 37 obras permaneceram idênticas. A rota foi verificada por HTTP sem sessão (401 e `no-store`), e a página inicial respondeu normalmente. O schema e os registros pessoais não foram alterados; as contagens permaneceram em oito perfis, 30 itens de biblioteca, zero favoritos e um fixado. O servidor temporário foi encerrado após a verificação.

A Etapa 1 entregou a marca e o ícone de gato preto, as 24 combinações de avatar aprovadas, apresentação compartilhada dos perfis próprio e público e navegação com calendário no celular e seções acessíveis em tablets. Os IDs `black`, `blue` e `purple` foram preservados; a migration `anicat_avatar_catalog` amplia a validação do banco sem reescrever dados existentes. O editor agrupa os avatares por expressão e apresenta uma prévia antes de salvar.

Validação: compilação com verificação de tipos e lint sem erros/avisos; 85 testes de lógica; 15 verificações de personalização e identidade, 14 de perfil público, 10 de links sociais e 9 de biblioteca pública no navegador. Layouts verificados de 320 a 1280 pixels, com navegação por teclado. As suítes removeram suas contas/dados temporários e confirmaram que os registros originais permaneceram idênticos. Capturas temporárias foram removidas após a revisão visual.

Complemento dos avatares aprovados: 85 testes de lógica, 17 verificações de personalização/identidade e 14 de perfil público. As 24 combinações foram salvas via Server Action e exibidas para visitantes; a escolha de expressão também foi verificada por teclado, após recarregar e no perfil próprio. A migration foi aplicada ao banco oficial e o conteúdo dos oito perfis existentes permaneceu idêntico. A revisão incluiu a galeria em celular e desktop.

A Etapa 2 entregou a apresentação pública em `/`, com biblioteca ilustrativa, avatares, funcionalidades existentes e comunidade identificada como "em breve". Login e cadastro receberam rotas próprias (`/login` e `/signup`), preservando as Server Actions existentes. Visitantes de páginas privadas recebem o login; usuários autenticados acessam o dashboard; sair da conta retorna à apresentação.

Validação da Etapa 2: compilação com verificação de tipos e lint sem erros; 85 testes de lógica; 10 verificações da página inicial e autenticação, 17 de personalização e 14 de perfil público no navegador. Incluiu cadastro real, erros de login/cadastro, navegação por teclado, telas de 320 a 1440 pixels, ausência de JavaScript e fallback de capas. Contas e dados temporários foram removidos; comparações SHA-256 confirmaram todos os registros originais idênticos. Capturas temporárias foram removidas após a revisão visual. Esta etapa não altera o schema do banco.
