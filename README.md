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

Talkguest, WhatsApp, interpretação de fotografias, pesquisa autónoma e notificações fora da aplicação ainda não estão integrados. O resumo diário existente no ChatGPT foi atualizado em 7 de outubro de 2026 para consultar public.records da nova base Supabase, respeitando deletedAt. Este acompanhamento não é push da app. O Assistente organiza registos por regras e permite definir prazos, revisões e próximos passos; não tem um fornecedor de IA configurado.


## Tarefas, avisos e lixo

- Feita conclui a tarefa e conserva-a no Histórico. Nas tarefas recorrentes, a próxima ocorrência mantém o comportamento existente.
- Apagar usa DELETE /api/records com id e version: preenche data.deletedAt, sem remover fotografias ou histórico. Mais → Lixo permite recuperar por PATCH, action=restore.
- Gestão pode apagar tarefas visíveis; Colaboração apenas as criadas pela própria pessoa. As verificações são feitas no servidor, incluindo versão e origem.
- Registos apagados não aparecem em listas, prioridades ou avisos. POST não permite contornar o lixo.
- O sino agrupa avisos por assunto; os dados atualizam-se após ações, ao regressar à janela e a cada minuto.
- Um adiamento futuro suprime lembretes comuns. Não esconde um prazo real hoje nem informação em falta numa estadia com entrada nos próximos dois dias.
