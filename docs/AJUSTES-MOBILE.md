# Ajustes pelos prints — 29/10/2026

1. Cabeçalho mobile: sticky no topo, camada abaixo do menu, acima do conteúdo; aviso de demonstração permanece no fluxo. Desktop preservado.
2. Menu: acompanha arrasto horizontal para a esquerda, fecha após 64 px e retorna quando o gesto é curto. Rolagem vertical não fecha. Transição de 240 ms, respeita movimento reduzido, Escape e botão de fechar.
3. Fotos: retratos ilustrativos somente para perfis fictícios da demonstração. Fotos reais enviadas ao Supabase preservadas; conta institucional mantém iniciais. Atualiza demonstrações já salvas sem apagar progresso. Falha de imagem mostra iniciais.

## Origem das imagens

Random User declara que selecionou as fotos da seção autorizada do UI Faces: https://randomuser.me/copyright (consultado em 29/10/2026). Uso ilustrativo em demonstração, sem representar depoimentos, identidade ou vínculo real com o SkillUp. Não constitui garantia jurídica universal. Os arquivos ficam locais, sem rastreamento por carregamento externo.

| Arquivo | Fonte |
| --- | --- |
| student.jpg | https://randomuser.me/api/portraits/men/32.jpg |
| teacher.jpg | https://randomuser.me/api/portraits/men/52.jpg |
| recruiter.jpg | https://randomuser.me/api/portraits/women/44.jpg |
| student-beatriz.jpg | https://randomuser.me/api/portraits/women/68.jpg |
| student-marcos.jpg | https://randomuser.me/api/portraits/men/75.jpg |

## Verificação

26 testes aprovados em demo-navigation e portfolio, incluindo fechamento por gesto, gestos curtos/verticais e Escape. Build aprovado. Nenhuma migração SQL. Testes de gesto são eventos touch em jsdom, não teste em dispositivo físico.
