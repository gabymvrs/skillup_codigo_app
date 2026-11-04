import { readFile, writeFile } from "node:fs/promises";
const uid = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const file = "src/data/beginner-curriculum.json";
const c = JSON.parse(await readFile(file, "utf8"));
const enrichment = JSON.parse(await readFile("src/data/enrichment.json", "utf8"));
const activities = JSON.parse(await readFile("src/data/track-activities.json", "utf8"));
const oldModules = new Map([...enrichment.modules, ...activities.modules].map((m) => [m.id, m]));
const oldQuestions = new Map([...enrichment.questions, ...activities.questions].map((q) => [q.id, q]));
const oldPlans = new Map(JSON.parse(await readFile("src/data/lesson-plans.json", "utf8")).map((p) => [p.module_id, p]));
const entries = [
  [3020, "Rede local e internet", [
    "Uma rede local conecta dispositivos em uma área, como computadores e um roteador de uma escola. Compartilhar essa rede não significa alcançar qualquer site na internet.",
    "Wi-Fi é uma forma de ligação sem fio até um equipamento local. Um aparelho pode mostrar Wi-Fi conectado mesmo quando o acesso externo está indisponível.",
    "Internet interliga várias redes. O roteador encaminha pacotes, pequenas partes de dados, de uma rede para outra conforme o destino.",
    "Uma página é procurada por nome. DNS é o serviço que relaciona o nome de domínio a um endereço IP, identificação usada para localizar o destino na rede.",
    "Separe as observações: há ligação à rede local? Há acesso externo por endereço? Um nome de site é resolvido? Cada resposta aponta para uma etapa diferente."],
    [["O que uma rede local conecta?", "Dispositivos de uma área", "Todos os sites do mundo", "Somente monitores"], ["Wi-Fi conectado garante internet?", "Não", "Sim", "Somente com DNS"], ["O que um roteador encaminha?", "Pacotes entre redes", "Títulos HTML", "Baterias"], ["Qual serviço relaciona nome e IP?", "DNS", "CSS", "Bluetooth"]], "Desenhe dois aparelhos e um roteador; explique como verificaria rede local, internet e resolução de nomes."],
  [3021, "Endereçamento e DNS", [
    "Um endereço IP identifica uma interface em uma rede. Ele permite que dados tenham um destino, mas não substitui um nome fácil de lembrar.",
    "DNS consulta a relação entre um nome, como um domínio escolar, e o endereço IP usado para chegar ao destino. Resolver o nome é uma etapa distinta de manter o enlace local.",
    "O roteador encaminha pacotes para outras redes. Se o aparelho alcança o roteador, isso confirma parte do caminho local, não todas as etapas externas.",
    "HTTPS indica comunicação Web protegida por criptografia entre navegador e servidor, com verificação de identidade do servidor; não significa que todo conteúdo de uma página seja confiável.",
    "Em um relato de falha, identifique o que foi testado: acesso ao roteador, acesso a um IP externo e acesso pelo nome. Não atribua toda falha ao DNS sem evidência."],
    [["O que identifica uma interface na rede?", "Endereço IP", "Título da página", "Rótulo do formulário"], ["Qual tarefa cabe ao DNS?", "Resolver nome para endereço", "Trocar um cabo", "Desenhar uma página"], ["O que um roteador faz?", "Encaminha pacotes entre redes", "Converte palavras em imagens", "Valida o conteúdo do site"], ["HTTPS protege que trecho?", "Comunicação entre navegador e servidor", "Todas as decisões do usuário", "O monitor do computador"]], "Relate a visita a um site em três etapas: nome, endereço de destino e encaminhamento entre redes."],
  [3022, "Diagnóstico de conexão", [
    "Diagnosticar é localizar uma etapa que falhou com testes observáveis. Comece anotando o que funciona e o que não funciona, sem trocar equipamentos por palpite.",
    "Confira o enlace local: o dispositivo está conectado ao Wi-Fi e alcança o roteador? O ícone de Wi-Fi sozinho não comprova acesso à internet.",
    "Depois confira acesso externo por endereço IP conhecido e autorizado para o teste. Se não funcionar, investigue o caminho externo antes de culpar nomes de sites.",
    "Se o acesso externo por IP funciona, mas por nome não, teste configuração e resposta do DNS. A diferença entre os dois testes é a evidência relevante.",
    "Registre horário, teste, resultado e próxima hipótese. Repita o mesmo teste após uma mudança para verificar se ela corrigiu a falha."],
    [["O que registrar primeiro?", "O que funciona e o que falha", "Uma peça para trocar", "A conclusão antes do teste"], ["Wi-Fi conectado comprova internet?", "Não", "Sim", "Comprova o DNS"], ["IP externo funciona, nome falha: investigar o quê?", "DNS", "Cor do monitor", "Teclado"], ["Após uma mudança, o que fazer?", "Repetir o teste e comparar", "Apagar o registro", "Trocar tudo"]], "Monte um roteiro para um aparelho conectado ao Wi-Fi que não abre sites: teste local, externo, nome e registro dos resultados."],
  [4009, "Interpretar uma topologia", [
    "Topologia descreve como os equipamentos estão ligados. Em estrela, cada computador tem um enlace até um equipamento central, como um switch.",
    "Um switch conecta equipamentos na rede local. Ele encaminha tráfego entre portas conforme os endereços observados; cada cabo do desenho corresponde a um enlace.",
    "No diagrama da prática, o cabo X liga somente o computador B ao switch. Se apenas X for retirado, B perde esse enlace; A mantém o seu cabo.",
    "Se o equipamento central falha, vários computadores ligados a ele podem perder a comunicação. Essa situação difere de desligar um cabo periférico.",
    "Para prever o impacto, siga o caminho de cada computador até o centro e marque exatamente o trecho interrompido."],
    [["O que caracteriza uma estrela?", "Enlaces individuais ao centro", "Um único cabo em linha", "Nenhum equipamento central"], ["Qual é o papel do switch?", "Ligar equipamentos da rede local", "Medir corrente elétrica", "Resolver nomes em todos os casos"], ["Se só o cabo B falha, quem perde esse enlace?", "B", "Todos", "A apenas"], ["O que pode afetar vários enlaces?", "Falha do equipamento central", "Falha de um único cabo periférico", "Mudança de título"]], "Desenhe A e B ligados a um switch. Marque uma falha em B e outra no switch e compare o impacto."],
  [4010, "Diagnóstico por evidências", [
    "Teste cada parte da conexão separadamente: enlace local, roteador, acesso externo por IP e resolução de nomes. Um teste positivo elimina algumas hipóteses, não todas.",
    "Se o computador alcança o roteador, há comunicação local até ele no momento do teste. Isso não comprova o caminho até um servidor externo.",
    "Se um servidor externo responde por IP, o caminho externo funciona para aquele teste. Quando o mesmo destino não abre pelo nome, o DNS torna-se a hipótese principal.",
    "Verifique o endereço do servidor DNS configurado e sua resposta. Não conclua que todo cabo ou todo acesso externo está quebrado quando os testes por IP funcionam.",
    "Documente a sequência e a evidência que levou à hipótese; mude um fator de cada vez e repita o teste afetado."],
    [["Alcançar o roteador confirma o quê?", "Trecho local até ele", "Todo site", "Resolução DNS"], ["Alcançar IP externo confirma o quê?", "Caminho externo daquele teste", "Todos os nomes", "Todas as páginas seguras"], ["IP funciona e nome falha: hipótese principal?", "DNS", "Monitor", "Bateria"], ["Por que mudar um fator por vez?", "Para relacionar mudança e resultado", "Para evitar registro", "Para pular testes"]], "Escreva a evidência para um caso em que IP externo funciona e nomes falham; proponha o próximo teste."],
  [3030, "Tensão, corrente e resistência", [
    "Tensão elétrica é a diferença de potencial entre dois pontos; mede-se em volts (V). Uma fonte de baixa tensão pode ser representada em um desenho de circuito.",
    "Corrente é o fluxo de carga elétrica; mede-se em amperes (A). O valor da corrente depende do circuito fechado e de seus componentes.",
    "Resistência oferece oposição à corrente; mede-se em ohms (Ω). Um resistor é um componente que pode limitar a corrente em um circuito.",
    "Compare as unidades: V para tensão, A para corrente e Ω para resistência. Elas descrevem grandezas diferentes e não devem ser trocadas.",
    "Por enquanto, desenhe e simule somente circuitos de baixa tensão. Não ligue componentes de estudo diretamente à rede elétrica."],
    [["Qual unidade mede tensão?", "Volt (V)", "Ampere (A)", "Ohm (Ω)"], ["Qual unidade mede corrente?", "Ampere (A)", "Volt (V)", "Metro (m)"], ["Qual unidade mede resistência?", "Ohm (Ω)", "Ampere (A)", "Segundo (s)"], ["Que componente pode limitar corrente?", "Resistor", "Fio ideal", "Conector"]], "Desenhe uma fonte de baixa tensão e um resistor; rotule V, A e Ω e explique o papel de cada grandeza."],
  [3031, "Circuito com resistor", [
    "Em um circuito simples de baixa tensão, a corrente percorre um caminho fechado. Um resistor em série faz parte desse mesmo caminho.",
    "A lei de Ohm relaciona tensão V, corrente I e resistência R: I = V / R. A divisão usa volts e ohms e resulta em amperes.",
    "Para 2 V em um resistor de 100 Ω, I = 2 / 100 = 0,02 A, ou 20 mA. Um miliampere (mA) é um milésimo de ampere.",
    "Com os mesmos 2 V e 200 Ω, I = 2 / 200 = 0,01 A, ou 10 mA. Dobrar a resistência reduz a corrente calculada à metade nesse modelo.",
    "O cálculo idealizado não substitui conferir limites da fonte e do componente. Use o exercício em desenho ou simulador de baixa tensão, sem rede elétrica."],
    [["Qual é a relação da lei de Ohm?", "I = V / R", "I = V + R", "I = R / V"], ["Quanto é 2 V / 100 Ω?", "0,02 A", "2 A", "200 A"], ["Quanto é 0,01 A em mA?", "10 mA", "1 mA", "100 mA"], ["Com tensão fixa, dobrar R faz I:", "Cair à metade", "Dobrar", "Ficar sempre igual"]], "Compare, em um desenho ou simulador, 2 V com 100 Ω e 200 Ω; registre as correntes e explique a diferença."],
  [3032, "Simulação de LED", [
    "LED é um diodo que emite luz quando ligado de forma apropriada. Neste exercício, represente uma fonte de baixa tensão, resistor e LED em série.",
    "Um LED tem polaridade: ânodo e cátodo indicam os lados. No desenho simplificado, a corrente convencional segue da saída positiva da fonte, pelo resistor e LED orientado, até o retorno.",
    "O resistor limita a corrente. Antes de uma montagem física, seria necessário consultar a especificação do LED, da fonte e do resistor; apenas a cor do LED não determina esses valores.",
    "No simulador ou papel, observe o que muda ao inverter o LED: ele normalmente deixa de conduzir no sentido contrário dentro dos limites especificados.",
    "Registre a orientação, a função do resistor e uma verificação de baixa tensão. Não use a rede elétrica nesta atividade."],
    [["Qual é a função do resistor em série?", "Limitar corrente", "Trocar a cor", "Substituir a fonte"], ["Por que marcar ânodo e cátodo?", "Para orientar o LED", "Para medir comprimento", "Para escolher o nome"], ["O que consultar antes de montar?", "Especificações dos componentes", "Só a cor do LED", "A velocidade da internet"], ["Qual ambiente usar nesta atividade?", "Papel ou simulação de baixa tensão", "Tomada da rede elétrica", "Ligação direta sem resistor"]], "Desenhe ou simule fonte de baixa tensão, resistor e LED; explique polaridade, resistor e o que testaria ao inverter o LED."],
];
const backend = [
  [320, "Requisições HTTP", "Descrever uma consulta e interpretar a resposta.", [
    "Um cliente, como o navegador, envia uma requisição HTTP a um servidor. O servidor responde com um status, cabeçalhos e, quando apropriado, um corpo.",
    "Uma requisição tem método e caminho. GET /produtos pede uma representação da lista de produtos; GET indica consulta, não autoriza por si só acesso a dados privados.",
    "POST costuma enviar dados para criar ou processar um recurso. Um corpo pode carregar dados; não coloque senhas no caminho ou na URL, que pode aparecer em históricos e registros.",
    "O status 200 indica sucesso da consulta; 404 indica que o recurso não foi encontrado. Um status precisa ser interpretado com o contexto e o corpo da resposta.",
    "Desenhe o caminho cliente → requisição → servidor → resposta. Identifique método, caminho, status e conteúdo sem misturar as partes."],
    "Desenhe uma consulta GET /produtos e uma resposta 200 com lista; depois uma resposta 404 para um recurso ausente."],
  [321, "APIs REST", "Descrever um contrato de recurso com validação.", [
    "Uma API define como programas trocam dados. Um contrato descreve caminho, método, campos de entrada, resposta e erros esperados.",
    "Em /produtos, GET consulta a coleção. POST /produtos pode solicitar a criação de um produto com nome e preço no corpo JSON.",
    "JSON organiza dados em pares de nome e valor: {\"nome\":\"Lápis\",\"preco\":2}. As aspas delimitam chaves e textos; números como 2 ficam sem aspas.",
    "O servidor valida campos e permissões. Se preco não é um número válido, devolva um erro de entrada, por exemplo 400, sem tratar isso como falha interna 500.",
    "Escreva um exemplo válido, um inválido e as respostas correspondentes; confira se outra pessoa consegue usar o contrato sem adivinhar campos."],
    "Especifique POST /produtos com JSON, uma resposta válida e um erro de validação, incluindo status e campo problemático."],
  [322, "Falhas entre serviços", "Explicar a recuperação de uma falha parcial.", [
    "Um sistema pode dividir pedido, estoque e pagamento entre serviços. Uma operação pode completar em um serviço e falhar em outro, por isso o estado precisa ser acompanhado.",
    "Uma chamada pela rede pode demorar ou falhar. Um timeout limita quanto tempo a aplicação espera; ao expirar, não se deve presumir automaticamente que a operação remota nunca ocorreu.",
    "Repetir uma solicitação pode duplicar um pagamento. Uma chave de idempotência permite reconhecer uma repetição como a mesma tentativa, desde que o serviço implemente esse contrato.",
    "Em um pedido, reserve estoque e solicite pagamento. Se o pagamento falhar de modo confirmado, uma compensação pode liberar a reserva; se o resultado é desconhecido, consulte o estado antes de repetir.",
    "Registre identificador do pedido, etapa concluída, falha observada e próxima ação. Essas decisões são de nível avançado; o exemplo não exige implantar serviços reais."],
    "Desenhe pedido, estoque e pagamento. Simule timeout no pagamento e descreva como verificar o estado antes de repetir ou liberar a reserva."],
];
const ids = new Set([...entries, ...backend].map(([n]) => uid(n)));
c.modules = c.modules.filter((m) => !ids.has(m.id));
c.plans = c.plans.filter((p) => !ids.has(p.module_id));
c.questions = c.questions.filter((q) => Number(q.id.slice(-5)) < 20000 || Number(q.id.slice(-5)) > 20099);
for (const q of Object.keys(c.answers)) if (Number(q.slice(-5)) >= 20000 && Number(q.slice(-5)) <= 20099) delete c.answers[q];
let next = 20000;
for (const [n, title, paragraphs, quiz, task] of entries) {
  const old = oldModules.get(uid(n)), plan = oldPlans.get(uid(n));
  if (!old || !plan || paragraphs.length !== 5 || quiz.length !== 4) throw new Error(`Incomplete ${n}`);
  const ids = quiz.map(([prompt, correct, wrong1, wrong2], i) => {
    const id = uid(next++);
    c.questions.push({ id, title: "Verifique o conceito", prompt, options: [correct, wrong1, wrong2], explanation: `${correct}. ${paragraphs[Math.min(i + 1, 4)]}`, kind: "choice", activity_type: "multiple_choice", category: "Prática guiada", subject_id: oldQuestions.get(old.question_id).subject_id, xp: 40 });
    c.answers[id] = 0;
    return id;
  });
  c.modules.push({ id: uid(n), title, body: paragraphs.join("\n\n"), position: old.position, prerequisite_id: old.prerequisite_id, question_id: ids[0] });
  c.plans.push({ module_id: uid(n), level: plan.level, question_ids: [...ids, ...plan.question_ids], dynamic: { kind: "applied", title: "Investigue um caso", prompt: task, criteria: ["Descrevi a situação e os passos", "Registrei o resultado esperado e como conferi"], minLength: 100 }, resource_ids: [] });
  c.guides[uid(n)] = { objective: title, prerequisites: old.prerequisite_id ? "Revise a bolinha anterior desta trilha." : "Nenhum conceito anterior desta trilha é necessário.", competency: title, next: "Resolva a prática e aplique a ideia na dinâmica.", steps: paragraphs.map((text, i) => ({ title: ["Situação", "Conceito", "Exemplo", "Aplicação", "Conferência"][i], text })) };
  c.pedagogy[uid(n)] = { concepts: [title], requires: [], competency: old.position === 0 ? "Primeiro contato" : old.position < 3 ? "Aplicação guiada" : "Aplicação independente", prerequisite_ids: old.prerequisite_id ? [old.prerequisite_id] : [], version: 2 };
}
for (let i = 0; i < backend.length; i++) {
  const [n, title, objective, paragraphs, task] = backend[i], old = oldPlans.get(uid(n));
  const prerequisite = i ? uid(backend[i - 1][0]) : null;
  c.modules.push({ id: uid(n), title, body: paragraphs.join("\n\n"), position: i, prerequisite_id: prerequisite, question_id: old.question_ids[0] });
  c.plans.push({ ...old, level: i === 2 ? 3 : i + 1, dynamic: { kind: "applied", title: "Desenhe e explique", prompt: task, criteria: ["Identifiquei as partes do fluxo", "Expliquei uma resposta ou falha verificável"], minLength: 120 }, resource_ids: i === 0 ? ["http-overview"] : i === 2 ? ["retry-pattern"] : [] });
  c.guides[uid(n)] = { objective, prerequisites: prerequisite ? "Revise a bolinha anterior de Backend." : "Nenhum conceito anterior de Backend é necessário.", competency: objective, next: "Resolva a prática e aplique o caso na dinâmica.", steps: paragraphs.map((text, j) => ({ title: ["Situação", "Partes", "Exemplo", "Falha", "Conferência"][j], text })) };
  c.pedagogy[uid(n)] = { concepts: [title], requires: i ? [backend[i - 1][1]] : [], competency: i === 2 ? "Resolução avançada" : i ? "Aplicação guiada" : "Primeiro contato", prerequisite_ids: prerequisite ? [prerequisite] : [], version: 2 };
}
c.question_updates = [...(c.question_updates || []).filter((q) => ![8007, 8008, 8011].includes(Number(q.id.slice(-4)))),
  { id: uid(8007), explanation: "DNS relaciona nomes a endereços IP; roteadores encaminham pacotes entre redes; IP identifica uma interface na rede." },
  { id: uid(8008), explanation: "O roteiro separa enlace local, acesso externo por IP e resolução de nomes, com registro dos resultados de cada teste." },
  { id: uid(8011), explanation: "O desenho ou simulação de baixa tensão mostra LED com polaridade e resistor em série para limitar corrente. Não use a rede elétrica." }];
await writeFile(file, JSON.stringify(c, null, 2) + "\n");
const resourceFile = "src/data/learning-resources.json";
const resources = JSON.parse(await readFile(resourceFile, "utf8"));
if (!resources.some((r) => r.id === "http-overview")) resources.push({ id: "http-overview", title: "Visão geral do HTTP", publisher: "MDN Web Docs", url: "https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Guides/Overview", kind: "artigo", language: "Português brasileiro", level: "Consulta após a aula" });
await writeFile(resourceFile, JSON.stringify(resources, null, 2) + "\n");
console.log(`${entries.length + backend.length} modules; ${next - 20000} new questions`);
