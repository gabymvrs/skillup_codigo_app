import { readFile, writeFile } from "node:fs/promises";

// Authoring data for the remaining JavaScript sequence. Existing IDs and answers stay stable.
const path = "src/data/beginner-curriculum.json";
const c = JSON.parse(await readFile(path, "utf8"));
const original = JSON.parse(await readFile("src/data/track-activities.json", "utf8"));
const plans = JSON.parse(await readFile("src/data/lesson-plans.json", "utf8"));
const uid = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const originalModules = new Map(original.modules.map((m) => [m.id, m]));
const originalPlans = new Map(plans.map((p) => [p.module_id, p]));
const originalQuestions = new Map(original.questions.map((q) => [q.id, q]));
const sequence = [4300, 4301, 4003, 4004, 4305, 4302, 4303, 4304, 4005];
const specs = [
  {
    title: "Mostrar uma saída", concept: "console.log e texto", objective: "Mostrar um valor e distinguir texto de número.",
    steps: [
      ["O que é a saída", "Saída é a informação que o programa apresenta. Neste laboratório, console.log(valor) escreve um valor no painel de saída. Os parênteses contêm o valor a mostrar; o ponto liga console à função log."],
      ["Texto entre aspas", "console.log(\"Olá\") mostra Olá. As aspas indicam um texto (string) e não fazem parte da saída. O ponto e vírgula encerra a instrução."],
      ["Número sem aspas", "console.log(3) mostra 3 como número. Já console.log(\"3\") mostra um texto que parece o mesmo número. O tipo muda o que pode ser calculado."],
      ["Uma conta", "console.log(3 + 4) mostra 7: o sinal + soma os números antes da saída. console.log(\"3\" + \"4\") mostra 34, pois une os textos."],
      ["Conferir", "Leia a instrução, preveja a saída e compare com o painel. Para uma soma, use números sem aspas; para uma mensagem, use texto entre aspas."],
    ],
    quiz: [["Qual comando mostra uma mensagem?", ["console.log(\"Oi\")", "console.log(Oi)", "log.console(\"Oi\")"], 0, "console.log recebe o texto entre parênteses; as aspas indicam texto."], ["Qual é a saída de console.log(2 + 3)?", ["5", "23", "2 + 3"], 0, "Dois números são somados antes de mostrar a saída."], ["As aspas em \"7\" indicam:", ["Texto", "Número calculado", "Variável"], 0, "Aspas delimitam texto em JavaScript."], ["Qual saída produz console.log(\"2\" + \"3\")?", ["23", "5", "Erro"], 0, "Com dois textos, + concatena, isto é, junta os caracteres."], ["O que fica dentro de console.log(...)?", ["O valor a mostrar", "O nome de uma página", "Uma senha"], 0, "O argumento é o valor dentro dos parênteses."]],
    dynamic: "Mostre uma mensagem e o resultado de uma conta pequena; anote as duas saídas e explique a diferença entre texto e número."
  },
  {
    title: "Guardar valores em variáveis", concept: "const e variável", objective: "Guardar e usar um valor com nome.",
    steps: [["Nome e valor", "Uma variável associa um nome a um valor. Em const idade = 16;, idade é o nome e 16 é o número guardado."], ["Atribuição", "O sinal = atribui o valor à esquerda; ele não pergunta se os lados são iguais. const cria uma referência que não será reatribuída."], ["Usar o nome", "const nota = 8; console.log(nota); mostra 8. Sem aspas, nota se refere ao valor guardado. Com aspas, \"nota\" é apenas texto."], ["Somar valores", "const a = 3; const b = 4; console.log(a + b); mostra 7. O + recebe os valores que os nomes representam."], ["Conferir", "Ao ler um programa, anote cada nome e seu valor. Antes de prever a saída, substitua os nomes pelos valores guardados."]],
    quiz: [["Em const idade = 16;, qual é o valor?", ["16", "idade", "const"], 0, "O número 16 foi atribuído ao nome idade."], ["Qual saída resulta de const n = 4; console.log(n)?", ["4", "n", "0"], 0, "Sem aspas, n representa o valor guardado."], ["Qual símbolo atribui um valor?", ["=", "===", "+"], 0, "= atribui; === compara igualdade."], ["O que mostra console.log(\"n\")?", ["n", "O valor da variável n", "Nada"], 0, "Com aspas, o argumento é texto literal."], ["Com a = 2 e b = 5, quanto vale a + b?", ["7", "25", "3"], 0, "Os nomes representam os números 2 e 5."],], dynamic:"Guarde dois números em const, mostre a soma e registre nome, valor e saída de cada teste."
  },
  {
    title: "Organizar um programa", concept: "entrada, processamento e saída", objective: "Ordenar leitura, conversão, cálculo e saída.",
    steps: [["O objetivo", "Para calcular uma soma, o programa precisa de dois valores de entrada. Primeiro é preciso obtê-los; só depois é possível calcular."], ["Entrada de texto", "Neste laboratório, input() lê uma linha digitada e devolve texto. Essa função é oferecida pelo laboratório; não é uma função padrão das páginas do navegador."], ["Conversão", "Number(texto) tenta transformar um texto numérico em número. Number(\"3\") vale 3; texto \"3\" + \"4\" junta caracteres e produz \"34\"."], ["Cálculo e saída", "Depois de ler a e b como números, a + b calcula a soma. console.log(a + b) mostra o resultado no painel."], ["Ordem completa", "Leia os dois valores, converta cada um, calcule e mostre. Confira se nenhum cálculo usa um valor que ainda não foi definido."]],
    quiz: [["O que input() devolve neste laboratório?", ["Texto", "Sempre um número", "Um elemento HTML"],0,"A entrada é texto antes de Number converter."], ["Qual deve vir antes da soma?", ["Ler e converter os valores", "Mostrar o resultado", "Encerrar o programa"],0,"Os valores precisam existir antes do cálculo."], ["O que faz Number(\"4\")?", ["Converte para o número 4", "Mostra 4 no painel", "Junta dois textos"],0,"Number converte texto numérico para número."], ["Qual comando mostra o resultado?", ["console.log(a + b)", "input()", "Number(a)"],0,"console.log apresenta o valor calculado."]], dynamic:"Escreva a sequência para somar duas entradas; teste com 3 e 4 e explique por que a conversão vem antes da soma."
  },
  {
    title:"Identificar um erro", concept:"concatenação e depuração", objective:"Localizar e corrigir uma soma de textos.",
    steps:[["Resultado inesperado", "Se as entradas são os textos \"3\" e \"4\", a expressão a + b produz \"34\". O programa executou, mas não calculou a soma pedida."], ["Concatenar", "Com textos, + concatena: junta os caracteres na ordem dada. Esse comportamento é útil para formar mensagens, mas não resolve uma soma numérica."], ["Encontrar a causa", "Verifique os tipos das entradas e o ponto em que a soma ocorre. input() deste laboratório devolve texto, mesmo quando a pessoa digita algarismos."], ["Corrigir", "Number(\"3\") + Number(\"4\") produz 7. Converta cada entrada antes de somar; converter \"34\" depois da concatenação preservaria o resultado errado."], ["Testar limites", "Confira também -2 e 5 (resultado 3) e 0 e 0 (resultado 0). Compare as saídas esperadas com as observadas antes de encerrar a correção."]],
    quiz:[["Qual é o resultado de \"3\" + \"4\"?",["\"34\"","7","Erro"],0,"O operador + junta dois textos."],["Por que input() + input() não soma números?",["As entradas são textos","Faltam chaves","O painel está vazio"],0,"input() deste laboratório retorna texto."],["Em que momento converter?",["Antes da soma","Depois de juntar os textos","Apenas depois de mostrar"],0,"Converter cada entrada evita concatenação."],["Qual é o resultado de Number(\"-2\") + Number(\"5\")?",["3","-25","7"],0,"Os textos são convertidos para -2 e 5 antes da soma."]], dynamic:"Reproduza o resultado 34 com textos, corrija para 7 com Number e registre a causa e mais um caso de teste."
  },
  {
    title:"Comparar valores", concept:"comparações booleanas", objective:"Prever o resultado de comparações entre números.",
    steps:[["Pergunta verificável", "Uma comparação responde verdadeiro ou falso. 7 >= 7 pergunta se sete é maior ou igual a sete e resulta true."],["Símbolos", "> é maior que, < é menor que, >= é maior ou igual, <= é menor ou igual. Os dois caracteres de >= formam um operador."],["Igualdade", "=== compara valores e tipos: 7 === 7 resulta true; 7 === \"7\" resulta false porque um é número e o outro texto."],["Fronteira", "Para uma nota mínima de 7, nota >= 7 inclui exatamente 7. nota > 7 excluiria esse valor; teste 6, 7 e 8."],["Resultado usado", "Uma condição pode ser guardada: const passou = nota >= 7;. console.log(passou) mostra true ou false."]],
    quiz:[["Quanto vale 7 >= 7?",["true","false","7"],0,"O limite 7 está incluído por >=."],["Quanto vale 6 > 7?",["false","true","6"],0,"6 não é maior que 7."],["Qual operador compara igualdade de valor e tipo?",["===","=","+"],0,"=== compara; = atribui."],["Quanto vale 7 === \"7\"?",["false","true","7"],0,"Número e texto são tipos diferentes."],["Para incluir o valor mínimo 7, qual condição usar?",["nota >= 7","nota > 7","nota < 7"],0,"Maior ou igual inclui a fronteira."]],dynamic:"Teste uma regra de nota mínima 7 com 6, 7 e 8; registre os resultados e explique a fronteira."
  },
  {
    title:"Escolher com if", concept:"condicional if e else", objective:"Executar um bloco conforme uma condição.",
    steps:[["Decisão", "if verifica uma condição verdadeira ou falsa. Em if (nota >= 7) { console.log(\"Aprovado\"); }, o bloco entre chaves só executa se a nota atingir 7."],["Parênteses e chaves", "Os parênteses de if envolvem a condição. As chaves delimitam as instruções sujeitas à decisão."],["Outro caminho", "else { console.log(\"Revisar\"); } trata o caso em que a condição de if é falsa. Apenas um dos caminhos é executado."],["Simular", "Com nota 7, >= 7 é true e sai Aprovado. Com nota 6, a condição é false e sai Revisar."],["Conferir", "Teste valores abaixo, iguais e acima do limite. Localize a condição, decida seu resultado e só então leia o bloco executado."]],
    quiz:[["Com nota 7, if (nota >= 7) executa?",["Sim","Não","Duas vezes"],0,"7 atende ao mínimo inclusivo."],["O que envolve a condição de if?",["Parênteses","Aspas","Colchetes"],0,"if (condição) usa parênteses."],["O que delimita o bloco executado?",["Chaves { }","Aspas","O operador +"],0,"As chaves contêm as instruções do bloco."],["Quando else executa?",["Quando a condição de if é falsa","Sempre após if","Quando a condição é verdadeira"],0,"else fornece o outro caminho."],["Qual saída para nota 6 no exemplo?",["Revisar","Aprovado","6"],0,"6 não atinge o limite de 7."],],dynamic:"Desenhe os dois caminhos de uma regra de nota mínima 7 e teste notas 6 e 7; informe a saída de cada caminho."
  },
  {
    title:"Repetir com for", concept:"laço e contador", objective:"Prever quantas vezes um bloco se repete.",
    steps:[["Por que repetir", "Um laço executa instruções mais de uma vez. for pode controlar a repetição com um contador, isto é, um número que muda a cada volta."],["Início", "Em for (let i = 0; i < 3; i++) { console.log(i); }, let i = 0 cria o contador inicial. Os pontos e vírgulas separam as três partes do controle."],["Condição", "i < 3 permite continuar enquanto i for menor que 3. Com i igual a 3, a condição fica falsa e o laço termina."],["Atualização", "i++ aumenta i em 1 após cada volta. As saídas são 0, 1 e 2, nessa ordem; o limite 3 não aparece."],["Rastrear", "Anote i, resultado da condição e saída a cada volta. Uma condição que nunca se torna falsa pode fazer o programa não terminar."]],
    quiz:[["Qual é o primeiro valor de i no exemplo?",["0","1","3"],0,"let i = 0 inicia o contador."],["Qual é a última saída quando i < 3?",["2","3","4"],0,"O laço executa com i=0,1,2."],["O que faz i++?",["Aumenta i em 1","Zera i","Mostra i"],0,"i++ incrementa o contador."],["Quando o laço para?",["Quando i < 3 fica falso","Quando i vale 2","Quando console.log executa"],0,"A condição é reavaliada a cada volta."],["Quantas saídas há para i=0; i<3; i++?",["3","2","4"],0,"Há uma saída para cada valor 0, 1 e 2."],],dynamic:"Rastreie um for com i de 0 até antes de 4; registre contador, condição e saída em cada volta."
  },
  {
    title:"Criar uma função", concept:"função e retorno", objective:"Definir e chamar uma função que soma dois valores.",
    steps:[["Reutilizar uma ação", "Uma função reúne instruções sob um nome. function somar(a, b) { return a + b; } define uma função; a e b são parâmetros, nomes para os valores recebidos."],["Corpo e retorno", "As chaves delimitam o corpo. return devolve o resultado à chamada e encerra a função naquele ponto."],["Chamada", "somar(2, 5) envia os argumentos 2 e 5 para a e b. O resultado devolvido é 7. Definir a função não a executa automaticamente."],["Mostrar resultado", "console.log(somar(2, 5)) mostra 7 no painel. Sem console.log, a função ainda retorna 7, mas o programa não o mostra."],["Conferir", "Teste também somar(-2, 5) e somar(0, 0). Acompanhe os valores recebidos, a expressão após return e a saída."]],
    quiz:[["O que são a e b na definição?",["Parâmetros","Saídas impressas","Arquivos"],0,"Parâmetros recebem os argumentos de cada chamada."],["Qual valor somar(2, 5) retorna?",["7","25","Nada"],0,"return a + b devolve a soma."],["Definir uma função já a executa?",["Não","Sim","Somente com return"],0,"A execução acontece ao chamar a função."],["Como mostrar o retorno?",["console.log(somar(2, 5))","return console.log","function(2, 5)"],0,"console.log recebe o resultado da chamada."],["Quanto retorna somar(0, 0)?",["0","undefined","2"],0,"A soma de zero e zero é zero."],],dynamic:"Defina somar(a,b), chame com dois pares diferentes e anote argumento, retorno e saída mostrada."
  },
  {
    title:"Somar com JavaScript", concept:"programa completo de soma", objective:"Ler, converter, somar e testar entradas numéricas.",
    steps:[["O pedido", "Leia dois números, um por linha, e mostre somente a soma. Neste laboratório, input() fornece cada linha como texto; ele não é uma API padrão de páginas do navegador."],["Converter cada linha", "const a = Number(input()); guarda a primeira entrada como número. const b = Number(input()); faz o mesmo com a segunda. Os parênteses internos chamam input antes de Number converter."],["Calcular e mostrar", "console.log(a + b); soma os números e mostra o resultado. Evite outras mensagens no painel, pois a avaliação compara a saída pedida."],["Testar", "Digite 3 e 4 em linhas separadas: a saída deve ser 7. Tente -2 e 5: a saída deve ser 3. Tente 0 e 0: a saída deve ser 0."],["Investigar erro", "Se aparecer 34, você juntou textos sem converter cada entrada. Se houver saída extra, confira todos os console.log. Depois de conferir a resposta, a área de entrada e execução permite repetir seus testes."]],
    quiz:[["Qual função lê uma linha neste laboratório?",["input()","console.log()","Number()"],0,"input() lê uma linha de texto no laboratório."],["Qual expressão converte a entrada?",["Number(input())","console.log(input())","String(Number)"],0,"Number converte o texto devolvido por input."],["Qual é a saída para -2 e 5?",["3","-25","7"],0,"Os dois números convertidos são somados."],["Qual comando mostra apenas a soma?",["console.log(a + b)","console.log(\"a + b\")","input(a + b)"],0,"Sem aspas, a expressão é calculada antes da saída."]], dynamic:"Execute ao menos dois pares de entradas, compare as saídas esperadas e explique a conversão e o formato da saída."
  }
];
const previous = [null, 4300, 4301, 4003, 4004, 4305, 4302, 4303, 4304];
const oldIds = new Set(sequence.map(uid));
c.modules = c.modules.filter((m) => !oldIds.has(m.id));
c.plans = c.plans.filter((p) => !oldIds.has(p.module_id));
c.questions = c.questions.filter((q) => Number(q.id.slice(-4)) < 18000 || Number(q.id.slice(-4)) > 18050);
for (const q of Object.keys(c.answers)) if (Number(q.slice(-4)) >= 18000 && Number(q.slice(-4)) <= 18050) delete c.answers[q];
let counter = 18000;
for (let i = 0; i < sequence.length; i++) {
  const n = sequence[i], spec = specs[i], moduleId = uid(n), old = originalModules.get(moduleId);
  const body = spec.steps.map((step) => step[1]).join("\n\n");
  c.modules.push(old ? { id: moduleId, title: spec.title, body, position: i, prerequisite_id: previous[i] ? uid(previous[i]) : null, question_id: uid(counter) }
    : { id: moduleId, track_id: uid(2101), title: spec.title, body, position: i, prerequisite_id: previous[i] ? uid(previous[i]) : null, xp: 100, question_id: uid(counter) });
  const questions = [];
  for (const [prompt, options, correct, explanation] of spec.quiz) {
    const questionId = uid(counter++);
    c.questions.push({ id: questionId, title: "Verifique o conceito", prompt, options, explanation, kind: "choice", activity_type: "multiple_choice", category: "Prática guiada", subject_id: uid(14), xp: 40 });
    c.answers[questionId] = correct;
    questions.push(questionId);
  }
  if (old) questions.push(originalPlans.get(moduleId).question_ids[0]);
  c.plans.push({ module_id: moduleId, level: i < 3 ? 1 : i < 7 ? 2 : 3, question_ids: questions, dynamic: { kind: "applied", title: "Teste e explique", prompt: spec.dynamic, criteria: ["Comparei entradas com saídas esperadas", "Expliquei o conceito aplicado e a saída"], minLength: 100 }, resource_ids: [i < 2 ? "js-intro" : i < 5 ? "js-number" : "js-functions"] });
  c.guides[moduleId] = { objective: spec.objective, prerequisites: previous[i] ? `Rever antes: ${specs[i - 1].concept}.` : "Nenhum conceito anterior de JavaScript é necessário.", competency: spec.objective, next: "Resolva a prática e aplique a ideia na dinâmica. Você pode voltar à teoria para revisar.", steps: spec.steps.map(([title, text]) => ({ title, text })) };
  c.pedagogy[moduleId] = { concepts: [spec.concept], requires: previous[i] ? [specs[i - 1].concept] : [], competency: i < 3 ? "Primeiro contato" : i < 7 ? "Aplicação guiada" : "Aplicação independente", prerequisite_ids: previous[i] ? [uid(previous[i])] : [], version: 2 };
}
await writeFile(path, JSON.stringify(c, null, 2) + "\n");
const resourcePath = "src/data/learning-resources.json";
const resources = JSON.parse(await readFile(resourcePath, "utf8"));
const additions = [
  ["js-intro", "Introdução ao JavaScript", "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Guide/Introduction"],
  ["js-number", "Números e conversão", "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Number"],
  ["js-functions", "Funções em JavaScript", "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Guide/Functions"]
];
for (const [id, title, url] of additions) if (!resources.some((r) => r.id === id)) resources.push({ id, title, publisher: "MDN Web Docs", url, kind: "artigo", language: "Português brasileiro", level: "Consulta após a aula" });
await writeFile(resourcePath, JSON.stringify(resources, null, 2) + "\n");
console.log(`JavaScript: ${sequence.length} modules; ${counter - 18000} new questions`);
