# Tutor automático com Google Gemini

O tutor usa a Edge Function `ai-tutor`. A chave do Google nunca é enviada ao navegador.

## Configuração obrigatória

1. No Google AI Studio, crie uma chave para a Gemini API em um projeto sem faturamento pago automático.
2. No Supabase, adicione os segredos:

   ```sh
   supabase secrets set GEMINI_API_KEY="SUA_CHAVE"
   supabase secrets set GEMINI_MODEL="gemini-2.5-flash-lite"
   supabase secrets set ALLOWED_ORIGINS="https://skillup-codigo-app.vercel.app"
   ```

3. Aplique as migrações e publique a função:

   ```sh
   supabase db push
   supabase functions deploy ai-tutor
   ```

4. Somente depois que a função responder corretamente, configure
   `VITE_AI_TUTOR_ENABLED=true` no Vercel e faça um novo deploy. Enquanto essa
   variável não estiver ativa, o bot de triagem existente continua funcionando.

Para desenvolvimento local, acrescente a origem local a `ALLOWED_ORIGINS`, separada por vírgula. Não coloque `GEMINI_API_KEY` em `.env` do Vite nem use prefixo `VITE_`.

## Limites e acompanhamento

- Limite interno: 10 solicitações por minuto e 100 por dia por estudante.
- Histórico enviado ao Gemini: no máximo quatro mensagens, com até 2.000 caracteres cada.
- Resposta normal: até 250 tokens; pedidos explícitos de aprofundamento: até 500 tokens.
- A tabela privada `ai_tutor_metrics` registra somente usuário, modelo e contagens de tokens. Perguntas e respostas não são armazenadas nela.
- Limites e disponibilidade do plano gratuito devem ser acompanhados no Google AI Studio. O código não ativa faturamento.

Se o Google responder com limite excedido, o aluno recebe uma mensagem informando que o tutor está temporariamente indisponível.
