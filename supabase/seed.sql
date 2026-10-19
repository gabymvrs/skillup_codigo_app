-- Original short study materials retained from the previous implementation.
-- Optional sample curriculum; no personal profiles, fake companies or credentials.
begin;
insert into public.subjects (id,name,color,icon) values ('00000000-0000-4000-8000-000000000010','Português','#013DC5','book') on conflict (id) do nothing;
insert into public.subjects (id,name,color,icon) values ('00000000-0000-4000-8000-000000000011','Logística','#8F291C','box') on conflict (id) do nothing;
insert into public.subjects (id,name,color,icon) values ('00000000-0000-4000-8000-000000000012','Biologia','#FACC15','leaf') on conflict (id) do nothing;
insert into public.subjects (id,name,color,icon) values ('00000000-0000-4000-8000-000000000013','Física','#FFC276','zap') on conflict (id) do nothing;
insert into public.subjects (id,name,color,icon) values ('00000000-0000-4000-8000-000000000014','Program.','#000966','code') on conflict (id) do nothing;
insert into public.subjects (id,name,color,icon) values ('00000000-0000-4000-8000-000000000015','Filosofia','#5D4E4A','graduation') on conflict (id) do nothing;
insert into public.subjects (id,name,color,icon) values ('00000000-0000-4000-8000-000000000016','Eletrônica','#8F2D44','cpu') on conflict (id) do nothing;
insert into public.subjects (id,name,color,icon) values ('00000000-0000-4000-8000-000000000017','Redes','#31564A','network') on conflict (id) do nothing;
insert into public.materials (id,subject_id,title,summary,body,kind,file_path,allow_offline,published,owner_id,organization_id) values ('00000000-0000-4000-8000-000000000100','00000000-0000-4000-8000-000000000010','Ortografia e acentuação','Regras básicas de acentuação','Palavras oxítonas terminadas em a, e, o, em e ens geralmente recebem acento: café, também. Paroxítonas têm regras específicas, como fácil e lápis. Proparoxítonas são sempre acentuadas.

Exercício: identifique a sílaba tônica de café, árvore e fácil.','artigo',null,true,true,null,null) on conflict (id) do nothing;
insert into public.materials (id,subject_id,title,summary,body,kind,file_path,allow_offline,published,owner_id,organization_id) values ('00000000-0000-4000-8000-000000000101','00000000-0000-4000-8000-000000000010','Interpretação de texto','Leitura ativa','Identifique assunto, tese e argumentos. Diferencie fato de opinião e procure pistas do contexto antes de concluir.

Exercício: ao ler uma notícia, escreva uma frase com a ideia principal.','artigo',null,true,true,null,null) on conflict (id) do nothing;
insert into public.materials (id,subject_id,title,summary,body,kind,file_path,allow_offline,published,owner_id,organization_id) values ('00000000-0000-4000-8000-000000000102','00000000-0000-4000-8000-000000000011','Cadeia de suprimentos','Da origem ao cliente','A cadeia de suprimentos conecta fornecedores, produção, armazenagem, transporte e consumidor. O fluxo de informações ajuda a reduzir atrasos e desperdícios.

Exercício: desenhe o caminho de um produto até sua casa.','artigo',null,true,true,null,null) on conflict (id) do nothing;
insert into public.materials (id,subject_id,title,summary,body,kind,file_path,allow_offline,published,owner_id,organization_id) values ('00000000-0000-4000-8000-000000000103','00000000-0000-4000-8000-000000000011','Gestão de estoque','Entrada, saída e reposição','O controle de estoque registra entradas, saídas e saldos. Estoque mínimo e ponto de pedido ajudam a evitar faltas.

Exercício: calcule o saldo após receber 20 unidades e vender 7.','artigo',null,true,true,null,null) on conflict (id) do nothing;
insert into public.materials (id,subject_id,title,summary,body,kind,file_path,allow_offline,published,owner_id,organization_id) values ('00000000-0000-4000-8000-000000000104','00000000-0000-4000-8000-000000000012','Células e organelas','A unidade da vida','A membrana plasmática delimita a célula; o citoplasma abriga estruturas e o material genético orienta processos celulares. Mitocôndrias participam da produção de ATP.

Exercício: compare células procariontes e eucariontes.','artigo',null,true,true,null,null) on conflict (id) do nothing;
insert into public.materials (id,subject_id,title,summary,body,kind,file_path,allow_offline,published,owner_id,organization_id) values ('00000000-0000-4000-8000-000000000105','00000000-0000-4000-8000-000000000012','Fotossíntese','Energia e produção de matéria','Organismos fotossintetizantes utilizam energia luminosa para produzir matéria orgânica a partir de água e dióxido de carbono, liberando oxigênio em muitos casos.

Exercício: explique a importância da luz nesse processo.','artigo',null,true,true,null,null) on conflict (id) do nothing;
insert into public.materials (id,subject_id,title,summary,body,kind,file_path,allow_offline,published,owner_id,organization_id) values ('00000000-0000-4000-8000-000000000106','00000000-0000-4000-8000-000000000013','Velocidade média','Movimento no cotidiano','Velocidade média é deslocamento dividido pelo intervalo de tempo: v = Δs/Δt. Observe as unidades, como km/h e m/s.

Exercício: um ciclista percorre 12 km em 2 h. Qual é a velocidade média?','artigo',null,true,true,null,null) on conflict (id) do nothing;
insert into public.materials (id,subject_id,title,summary,body,kind,file_path,allow_offline,published,owner_id,organization_id) values ('00000000-0000-4000-8000-000000000107','00000000-0000-4000-8000-000000000013','Leis de Newton','Força e movimento','A primeira lei trata da inércia. A segunda relaciona força resultante, massa e aceleração: F = m·a. A terceira afirma que as forças de ação e reação têm mesma intensidade e sentidos opostos em corpos diferentes.

Exercício: dê um exemplo de inércia.','artigo',null,true,true,null,null) on conflict (id) do nothing;
insert into public.materials (id,subject_id,title,summary,body,kind,file_path,allow_offline,published,owner_id,organization_id) values ('00000000-0000-4000-8000-000000000108','00000000-0000-4000-8000-000000000014','Variáveis e tipos','Primeiros passos em Dart','Use int para números inteiros, double para decimais, String para textos e bool para verdadeiro ou falso. Exemplo: int idade = 16;

Exercício: declare as variáveis nome, nota e aprovado com tipos adequados.','artigo',null,true,true,null,null) on conflict (id) do nothing;
insert into public.materials (id,subject_id,title,summary,body,kind,file_path,allow_offline,published,owner_id,organization_id) values ('00000000-0000-4000-8000-000000000109','00000000-0000-4000-8000-000000000014','Condicionais','Tomando decisões','Uma estrutura if executa um bloco quando uma condição é verdadeira; else permite tratar o caso alternativo. Exemplo: if (nota >= 7) { print("Aprovado"); } else { print("Revisar"); }

Exercício: crie uma condição para verificar a maioridade.','artigo',null,true,true,null,null) on conflict (id) do nothing;
insert into public.materials (id,subject_id,title,summary,body,kind,file_path,allow_offline,published,owner_id,organization_id) values ('00000000-0000-4000-8000-000000000110','00000000-0000-4000-8000-000000000015','Ética e moral','Refletindo sobre decisões','Moral reúne costumes e normas de grupos sociais. Ética investiga criticamente os fundamentos de nossas escolhas e ações.

Exercício: pense em um dilema cotidiano e apresente duas perspectivas.','artigo',null,true,true,null,null) on conflict (id) do nothing;
insert into public.materials (id,subject_id,title,summary,body,kind,file_path,allow_offline,published,owner_id,organization_id) values ('00000000-0000-4000-8000-000000000111','00000000-0000-4000-8000-000000000015','Conhecimento e argumentação','Como justificar uma ideia','Um argumento reúne premissas que sustentam uma conclusão. Avalie a coerência das premissas e se há evidências suficientes.

Exercício: diferencie opinião de argumento justificado.','artigo',null,true,true,null,null) on conflict (id) do nothing;
insert into public.materials (id,subject_id,title,summary,body,kind,file_path,allow_offline,published,owner_id,organization_id) values ('00000000-0000-4000-8000-000000000112','00000000-0000-4000-8000-000000000016','Tensão, corrente e resistência','Grandezas elétricas','Tensão elétrica é medida em volts, corrente em ampères e resistência em ohms. Em muitos circuitos resistivos, aplica-se a relação V = R·I.

Exercício: qual a corrente em um resistor de 10 Ω sob 20 V?','artigo',null,true,true,null,null) on conflict (id) do nothing;
insert into public.materials (id,subject_id,title,summary,body,kind,file_path,allow_offline,published,owner_id,organization_id) values ('00000000-0000-4000-8000-000000000113','00000000-0000-4000-8000-000000000016','Circuitos em série e paralelo','Conexões elétricas','Em série, a corrente é a mesma nos componentes; em paralelo, os ramos compartilham a diferença de potencial.

Segurança: não faça experimentos diretamente na rede elétrica.','artigo',null,true,true,null,null) on conflict (id) do nothing;
insert into public.materials (id,subject_id,title,summary,body,kind,file_path,allow_offline,published,owner_id,organization_id) values ('00000000-0000-4000-8000-000000000114','00000000-0000-4000-8000-000000000017','Endereços IP','Identificação na rede','Um endereço IP identifica uma interface em uma rede. IPv4 usa quatro grupos numéricos; IPv6 oferece um espaço de endereçamento muito maior.

Exercício: explique a diferença entre um IP local e um IP público.','artigo',null,true,true,null,null) on conflict (id) do nothing;
insert into public.materials (id,subject_id,title,summary,body,kind,file_path,allow_offline,published,owner_id,organization_id) values ('00000000-0000-4000-8000-000000000115','00000000-0000-4000-8000-000000000017','Protocolos e serviços','Comunicação entre computadores','HTTP e HTTPS são usados na web. DNS associa nomes de domínio a endereços; TCP e UDP são protocolos de transporte com características diferentes.

Exercício: descreva o papel do DNS ao abrir um site.','artigo',null,true,true,null,null) on conflict (id) do nothing;
insert into public.tracks (id,title,description,category,skills,duration_hours,owner_id,organization_id,published) values ('00000000-0000-4000-8000-000000000200','Trilha de Fundamentos','Construa sua base em lógica e programação, uma etapa por vez.','Desenvolvimento',array['Lógica','Dart','Algoritmos']::text[],8,null,null,true) on conflict (id) do nothing;
insert into public.tracks (id,title,description,category,skills,duration_hours,owner_id,organization_id,published) values ('00000000-0000-4000-8000-000000000201','Backend Architecture','Da requisição HTTP à organização de serviços e dados.','Desenvolvimento',array['HTTP','APIs','SQL']::text[],6,null,null,true) on conflict (id) do nothing;
insert into public.modules (id,track_id,title,body,position,prerequisite_id,xp) values ('00000000-0000-4000-8000-000000000300','00000000-0000-4000-8000-000000000200','Fundamentos','Um algoritmo é uma sequência finita de passos para resolver um problema. Antes de escrever código, descreva a entrada, o processamento e a saída.

Prática: escreva os passos para calcular a média de duas notas. Identifique quais valores entram e qual resultado deve ser mostrado.',0,null,100) on conflict (id) do nothing;
insert into public.modules (id,track_id,title,body,position,prerequisite_id,xp) values ('00000000-0000-4000-8000-000000000301','00000000-0000-4000-8000-000000000200','Variáveis','Variáveis associam um nome a um valor. Em Dart, int armazena inteiros; double armazena decimais; String representa texto; bool representa verdadeiro ou falso.

Exemplo: int idade = 16; double nota = 8.5; String nome = "Ana"; bool aprovado = true;

Prática: represente nome, preço e quantidade de um produto.',1,'00000000-0000-4000-8000-000000000300',100) on conflict (id) do nothing;
insert into public.modules (id,track_id,title,body,position,prerequisite_id,xp) values ('00000000-0000-4000-8000-000000000302','00000000-0000-4000-8000-000000000200','Lógica','Uma condição produz verdadeiro ou falso. Combine comparações com && (e), || (ou) e ! (negação).

Para aprovar um aluno com nota mínima 7 e frequência mínima 75, use nota >= 7 && frequencia >= 75.

Teste os casos de fronteira: nota 7, frequência 75 e valores logo abaixo.',2,'00000000-0000-4000-8000-000000000301',100) on conflict (id) do nothing;
insert into public.modules (id,track_id,title,body,position,prerequisite_id,xp) values ('00000000-0000-4000-8000-000000000303','00000000-0000-4000-8000-000000000200','Maratona 1','Planeje um programa de cadastro de três produtos. Para cada um, registre nome, preço e quantidade. Calcule o total do estoque.

Divida o problema em entrada, cálculo e apresentação. Verifique o resultado manualmente antes de continuar.',3,'00000000-0000-4000-8000-000000000302',100) on conflict (id) do nothing;
insert into public.modules (id,track_id,title,body,position,prerequisite_id,xp) values ('00000000-0000-4000-8000-000000000304','00000000-0000-4000-8000-000000000200','Condicionais','if executa um bloco quando sua condição é verdadeira. else permite tratar o caso contrário.

if (idade >= 18) { print("Maior de idade"); } else { print("Menor de idade"); }

Prática: adapte o exemplo para classificar uma nota como aprovada ou em revisão.',4,'00000000-0000-4000-8000-000000000303',100) on conflict (id) do nothing;
insert into public.modules (id,track_id,title,body,position,prerequisite_id,xp) values ('00000000-0000-4000-8000-000000000305','00000000-0000-4000-8000-000000000200','Loops','Use um laço quando uma operação precisa se repetir. Um for tem inicialização, condição e atualização.

for (int i = 0; i < 5; i++) { print(i); }

Este laço mostra 0, 1, 2, 3 e 4. Evite condições que nunca se tornam falsas.',5,'00000000-0000-4000-8000-000000000304',100) on conflict (id) do nothing;
insert into public.modules (id,track_id,title,body,position,prerequisite_id,xp) values ('00000000-0000-4000-8000-000000000306','00000000-0000-4000-8000-000000000200','Arrays','Em Dart, List organiza valores em sequência. O primeiro índice é 0.

List<int> notas = [7, 8, 9];
int soma = 0;
for (final nota in notas) { soma += nota; }

Prática final: calcule soma e média, tratando também uma lista vazia.',6,'00000000-0000-4000-8000-000000000305',100) on conflict (id) do nothing;
insert into public.modules (id,track_id,title,body,position,prerequisite_id,xp) values ('00000000-0000-4000-8000-000000000320','00000000-0000-4000-8000-000000000201','Requisições HTTP','O cliente envia uma requisição a um servidor. Método, caminho, cabeçalhos e corpo descrevem a operação. A resposta inclui status e conteúdo.

Compare GET (consulta) e POST (envio). Não coloque senhas no endereço da página.',0,null,150) on conflict (id) do nothing;
insert into public.modules (id,track_id,title,body,position,prerequisite_id,xp) values ('00000000-0000-4000-8000-000000000321','00000000-0000-4000-8000-000000000201','APIs REST','Recursos podem ser representados por endereços como /produtos. Defina contratos de entrada e saída, valide dados no servidor e diferencie erros de validação de falhas internas.

Exercício: desenhe um contrato JSON para cadastrar um produto.',1,'00000000-0000-4000-8000-000000000320',150) on conflict (id) do nothing;
insert into public.modules (id,track_id,title,body,position,prerequisite_id,xp) values ('00000000-0000-4000-8000-000000000322','00000000-0000-4000-8000-000000000201','Microservices Patterns','Separar serviços cria limites claros, mas também falhas de rede e desafios de consistência. Use timeouts, operações idempotentes e contratos versionados.

Prática: desenhe o fluxo de um pedido e identifique o que ocorre se o serviço de pagamento estiver indisponível.',2,'00000000-0000-4000-8000-000000000321',150) on conflict (id) do nothing;
insert into public.questions (id,title,prompt,options,explanation,category,xp) values ('00000000-0000-4000-8000-000000000400','Tipos e variáveis','Qual tipo representa 15,5 em Dart?','["int","double","bool","String"]'::jsonb,'double representa números com parte decimal, como 15.5.','Exercício',50) on conflict (id) do nothing;
insert into public.questions (id,title,prompt,options,explanation,category,xp) values ('00000000-0000-4000-8000-000000000401','Condições e limites','Uma aprovação exige nota maior ou igual a 7. Qual expressão inclui a nota 7?','["nota > 7","nota < 7","nota >= 7","nota == 8"]'::jsonb,'O operador >= inclui o limite 7 e todos os valores maiores.','Exames',100) on conflict (id) do nothing;
insert into public.questions (id,title,prompt,options,explanation,category,xp) values ('00000000-0000-4000-8000-000000000402','Refatoração de Algoritmo de Busca','Você precisa encontrar um item em uma lista não ordenada. Qual estratégia funciona sem reordenar os dados?','["Busca binária diretamente","Retornar sempre o primeiro item","Percorrer até encontrar o item","Comparar somente o último item"]'::jsonb,'A busca linear percorre a lista e funciona sem exigir ordenação.','Laboratório',150) on conflict (id) do nothing;
insert into public.questions (id,title,prompt,options,explanation,category,xp) values ('00000000-0000-4000-8000-000000000403','Decisões em equipe','Um colega não compreendeu um requisito. Qual próximo passo ajuda a equipe?','["Ignorar a dúvida","Confirmar o objetivo e elaborar um exemplo juntos","Implementar sem perguntar","Excluir o requisito"]'::jsonb,'Conversar sobre o objetivo e testar um exemplo reduz interpretações diferentes.','Dinâmica',50) on conflict (id) do nothing;
insert into private.question_answers(question_id,correct_index) values('00000000-0000-4000-8000-000000000400',1) on conflict(question_id) do nothing;
insert into private.question_answers(question_id,correct_index) values('00000000-0000-4000-8000-000000000401',2) on conflict(question_id) do nothing;
insert into private.question_answers(question_id,correct_index) values('00000000-0000-4000-8000-000000000402',2) on conflict(question_id) do nothing;
insert into private.question_answers(question_id,correct_index) values('00000000-0000-4000-8000-000000000403',1) on conflict(question_id) do nothing;
commit;
