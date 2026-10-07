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

`pnpm run typecheck`, `pnpm run build` e `node tests/supabase.mjs`.

Testes de transporte simulado: OTP, sessão, CRUD, versões concorrentes, recorrência, limites da colaboradora, prioridades privadas e origem dos pedidos. Validar após publicação com utilizadores reais: código por email, criar/atribuir tarefa, fotografia, conclusão, histórico e acesso da colaboradora.

## Estado e limitações

Código preparado e compilado. Publicação, chave secreta de execução e envio de emails requerem configuração na conta da proprietária. A app anterior continua a funcionar até o novo endereço passar a verificação real.

A migração leu a base Sites em 7 de outubro de 2026: nenhum registo de tarefas, estadias, histórico ou fotografias. Manteve a proprietária e preparou o acesso do marido no Supabase.

Talkguest, WhatsApp, interpretação de fotografias, pesquisa autónoma e notificações fora da aplicação ainda não estão integrados. Os lembretes existentes no ChatGPT continuam a consultar a base antiga até à mudança explicitamente verificada.
