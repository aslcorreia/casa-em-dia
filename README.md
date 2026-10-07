# Casa em Dia

Aplicação familiar independente: família, casa, quinta, lavandaria e alojamentos. Cloudflare Workers serve a interface e os pedidos autenticados. Supabase guarda registos, equipa, histórico e imagens privadas.

## Publicar na Cloudflare

- Repositório: aslcorreia/casa-em-dia, branch main.
- Nome: casa-em-dia.
- Build command: pnpm run build
- Deploy command: npx wrangler deploy --config dist/server/wrangler.json
- Preview command: npx wrangler versions upload --config dist/server/wrangler.json
- Desativar Preview builds na primeira publicação.
- Node.js 24 ou posterior.

O endereço e a chave publicável do Supabase estão no wrangler.jsonc. Antes de utilizar a app, adicionar na Cloudflare uma variável do tipo Secret chamada SUPABASE_SECRET_KEY, com a chave secreta do projeto Supabase. Nunca colocar a chave no repositório ou na conversa.

## Entrada por email

Supabase Authentication → Email templates → Magic Link: incluir `{{ .Token }}` no corpo da mensagem para apresentar o código de entrada. Modelo sugerido:

```html
<h2>Entrar na Casa em Dia</h2>
<p>O teu código é: <strong>{{ .Token }}</strong></p>
<p>Se não pediste este código, ignora esta mensagem.</p>
```

Configurar SMTP próprio para enviar a todos os utilizadores autorizados. O serviço de email padrão do Supabase limita destinatários a membros da organização e não é suficiente para a equipa da app. Não adicionar utilizadores da app como administradores da organização Supabase para contornar esta restrição.

Os emails autorizados estão na tabela members. O servidor valida o utilizador com o Supabase Auth e verifica o email confirmado antes de consultar os dados. A proprietária e o marido têm Gestão; Colaboração só permite as próprias tarefas/ocorrências fora de Família. As tabelas têm RLS ativo e nenhum acesso direto para anon/authenticated; o servidor realiza as operações depois da validação de acesso. Os avisos informativos de RLS sem política são esperados neste modelo exclusivamente servidor.

## Verificação

`pnpm run typecheck`, `pnpm run build`, `node tests/supabase.mjs` e `node tests/dashboard.mjs`.

Testes de transporte simulado: OTP, sessão, CRUD, versões concorrentes, recorrência, limites da colaboradora, prioridades privadas, origem dos pedidos, lixo recuperável e permissões para apagar. Testes de renderização verificam a visibilidade de tarefas sem data, ações Feita/Apagar e regras de avisos (adiamentos, prazos reais, chegadas e revisões). Validar após publicação com utilizadores reais: código por email, criar/atribuir tarefa, fotografia, conclusão, histórico e acesso da colaboradora.

## Estado e limitações

App publicada em https://casa-em-dia.as-lcorreia.workers.dev . A entrada por email e a criação de tarefas foram confirmadas pela proprietária em 7 de outubro de 2026.

A migração leu a base Sites em 7 de outubro de 2026: nenhum registo de tarefas, estadias, histórico ou fotografias. Manteve a proprietária e preparou o acesso do marido no Supabase.

Talkguest, WhatsApp, interpretação de fotografias, pesquisa na Internet e notificações fora da aplicação ainda não estão integrados. O resumo diário existente no ChatGPT foi atualizado em 7 de outubro de 2026 para consultar public.records da nova base Supabase, respeitando deletedAt. Este acompanhamento não é push da app. O Assistente inclui uma conversa com IA da Cloudflare (Workers AI, Llama 3.3 70B), além do acompanhamento por regras. Permite criar propostas de tarefas e organizar pequenos passos; as propostas exigem revisão e guardar no formulário habitual.


## Tarefas, avisos e lixo

- Feita conclui a tarefa e conserva-a no Histórico. Nas tarefas recorrentes, a próxima ocorrência mantém o comportamento existente.
- Apagar usa DELETE /api/records com id e version: preenche data.deletedAt, sem remover fotografias ou histórico. Mais → Lixo permite recuperar por PATCH, action=restore.
- Gestão pode apagar tarefas visíveis; Colaboração apenas as criadas pela própria pessoa. As verificações são feitas no servidor, incluindo versão e origem.
- Registos apagados não aparecem em listas, prioridades ou avisos. POST não permite contornar o lixo.
- O sino agrupa avisos por assunto; os dados atualizam-se após ações, ao regressar à janela e a cada minuto.
- Um adiamento futuro suprime lembretes comuns. Não esconde um prazo real hoje nem informação em falta numa estadia com entrada nos próximos dois dias.


## IA do Assistente

- Ligação nativa Workers AI: `ai.binding=AI` em wrangler.jsonc, conservada no ficheiro de publicação gerado. Não usa uma chave externa de IA.
- POST /api/assistant valida sessão e origem, lê apenas contexto autorizado, limita a seleção a 60 registos / 34.000 caracteres e valida a resposta JSON.
- As propostas não escrevem em records: abrem o formulário para revisão. Propostas de atualização incluem a versão de origem para evitar aplicar uma sugestão a uma tarefa entretanto alterada. O modelo não pode apagar, concluir, aprovar, enviar mensagens nem contratar.
- A conversa privada de cada utilizador guarda até 20 mensagens em settings, chave assistant:email. DELETE /api/assistant inicia uma nova conversa para o próprio utilizador.
- O limite local de pedidos é cinco por minuto por utilizador, com um pedido em curso por instância. Não é um limite global de faturação. Cloudflare controla a quota; no plano Free existe uma franquia diária e os pedidos acima do limite são recusados. Num plano Paid pode haver cobrança acima da franquia. Não foi feita nenhuma mudança de plano.
- GET /api/assistant/status informa apenas se existe ligação configurada; não faz inferência nem revela registos. Os restantes endpoints exigem sessão.
- Testes simulam inferência, verificam filtragem por função, conversas separadas, propostas permitidas e falhas do fornecedor. A inferência real depende da disponibilidade e quota da conta Cloudflare.


## Conta e modelos de entrada

- `/login` abre a entrada por código de email; quando já há sessão, mostra a própria conta. O topo tem Entrar ou Conta, também no telemóvel. Todas as funções de utilizador podem terminar sessão.
- Mais → Modelos e rotinas disponibiliza exemplos por espaço e tipo. Cada espaço e separador de registos apresenta atalhos; Nova tarefa também sugere modelos do espaço selecionado.
- Os modelos vivem em `lib/entry-templates.ts`. Não criam registos de demonstração: abrem um rascunho editável que só é enviado ao guardar.
- Rotinas de limpeza incluem passos que podem ser editados ou retirados, responsável e primeira data obrigatória quando recorrentes. A repetição diária/semanal/mensal cria a próxima ocorrência ao concluir, a partir da data anterior; não é um agendamento de notificações externas.
- Registar a limpeza como tarefa não atualiza automaticamente o estado de limpeza de uma estadia. As reservas por plataforma são modelos de introdução manual; os contactos exigem o nome verdadeiro do prestador.


## Arroios de Paixão — Quarto

- Alojamento 1 passou a Arroios de Paixão — Quarto. O esquema aceita o nome antigo em registos e pedidos já abertos, normalizando a área e serviceAreas. A classificação de alojamento usa uma lista explícita, não o prefixo do nome.
- Quatro modelos próprios em `lib/arroios-cleaning.ts`: quarto/cama de casal, casa de banho, limpeza de detalhe e revisão antes da chegada. Aparecem primeiro no espaço e não criam tarefas sem guardar. Sem recorrência, responsável de limpeza ou data inventados.
- Inventário visual consultado em 2026-10-07: galeria pública de https://www.booking.com/hotel/pt/arroios-de-paixao.pt-pt.html . Observados cama de casal, cabeceira, prateleiras abertas, mesas e candeeiros, cortinas, tapete, soalho, TV, mesa com loiça, banheira, estante de ripas, sanita, lavatório, espelho e janela. As fotos não permitem avaliar a limpeza atual.
- A cama individual anunciada fica como passo condicional, prevalecendo a cama de casal indicada pela proprietária. Cafeteira/chaleira/minibar e varanda são verificações apenas se presentes/em uso.
- Os modelos são recomendações de procedimento, ajustáveis às etiquetas dos materiais e equipamentos. Não substituem reparações nem análise de pragas. O estado da limpeza da estadia continua a exigir atualização explícita.
- Verificação: `node tests/arroios.mjs`, `node tests/supabase.mjs`, `node tests/dashboard.mjs`, typecheck e build.


## Duplex e Alfama

- Alojamento 2 é **Arroios de Paixão — Duplex**; Alojamento 3 é **Alfama de Paixão**. Os três nomes antigos são aceites e normalizados em registos, áreas dos contactos e propostas do Assistente.
- Cada apartamento tem seis modelos específicos: quartos/roupa, cozinha/kitchenette, casa de banho, sala e circulação, detalhe e revisão final. `lib/apartment-cleaning.ts` contém os procedimentos; `lib/lodging-profiles.ts` descreve os espaços. São rascunhos sem data ou execução automática.
- Galerias do Booking inspecionadas em 2026-10-07: https://www.booking.com/hotel/pt/arroios-de-paixao-duplex-lisboa.pt-pt.html e https://www.booking.com/hotel/pt/alfama-de-paixao-lisboa.html . As fotografias identificam equipamentos; não demonstram a sujidade atual.
- Duplex: duas camas de casal, cozinha, sofá, cadeiras de corda, escadas/guardas de madeira, terraço, dois lavatórios, vidro de duche, sanita e bidé. Equipamentos que não foram identificados visualmente são condicionais nos passos.
- Alfama: quarto, sofá-cama, kitchenette aberta, mesa recolhível, micro-ondas/exaustor, cabine de duche com vidro e perfis, lavatório, sanita e azulejos com juntas.
- `scripts/rename-lodgings.sql` normaliza os três nomes na base de dados, preserva os restantes campos, incrementa a versão e regista auditoria. Executar após publicar o código compatível.

## Lavadeira do Bairro

- Lavandaria → Limpeza e manutenção identifica a loja da Rua José Ricardo, 36. Apresenta sete rotinas por frequência: espaço, lavadoras, filtros/secadores e operação diariamente; cotão entre máquinas/topos e stock semanalmente; acompanhamento de manutenção mensalmente.
- `lib/laundry-cleaning.ts` substitui os seis modelos genéricos por onze específicos. A biblioteca passa a 61 modelos. Inclui assistência, avarias, compras e pedidos/reclamações dos clientes.
- Repetição Diária disponível nos dois formulários e aceite pela API; cria a ocorrência seguinte ao concluir, com passos por fazer e mantendo responsável e hora. A data parte da ocorrência anterior, tal como na repetição semanal. Um atraso não apaga obrigações pendentes.
- Filtros seguem o manual, eventualmente após cada carga; a verificação diária e o cotão semanal não substituem essa frequência. Máquinas/modelos por confirmar; trabalhos internos, deslocações e acesso difícil são reservados a pessoal habilitado. Fontes, limites das avaliações e decisões em `docs/lavandaria-fontes.md`.
- Não se alteraram registos reais nem se criaram tarefas com datas/responsáveis presumidos. O utilizador escolhe a primeira data e guarda cada rotina.
