import originalMaterials from "./legacy-materials.json";
import type { Material, Module, Question, Subject, Track } from "../lib/types";
export const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const names = [
  "Português",
  "Logística",
  "Biologia",
  "Física",
  "Program.",
  "Filosofia",
  "Eletrônica",
  "Redes",
];
// Subject colors sampled from vector fills in the supplied material wireframe.
export const subjects: Subject[] = names.map((name, i) => ({
  id: id(10 + i),
  name,
  color: [
    "#013DC5",
    "#8F291C",
    "#FACC15",
    "#FFC276",
    "#000966",
    "#5D4E4A",
    "#8F2D44",
    "#31564A",
  ][i],
  icon: ["book", "box", "leaf", "zap", "code", "graduation", "cpu", "network"][
    i
  ],
}));
export const materials: Material[] = Object.entries(originalMaterials).flatMap(
  ([name, items], s) =>
    items.map(([title, summary, body], i) => ({
      id: id(100 + s * 2 + i),
      subject_id: subjects.find((x) => x.name === name)!.id,
      title,
      summary,
      body,
      kind: "artigo" as const,
      file_path: null,
      allow_offline: true,
      published: true,
      owner_id: null,
      organization_id: null,
    })),
);
export const tracks: Track[] = [
  {
    id: id(200),
    title: "Trilha de Fundamentos",
    description:
      "Construa sua base em lógica e programação, uma etapa por vez.",
    category: "Desenvolvimento",
    skills: ["Lógica", "Dart", "Algoritmos"],
    duration_hours: 8,
    owner_id: null,
    organization_id: null,
    published: true,
  },
  {
    id: id(201),
    title: "Backend Architecture",
    description: "Da requisição HTTP à organização de serviços e dados.",
    category: "Desenvolvimento",
    skills: ["HTTP", "APIs", "SQL"],
    duration_hours: 6,
    owner_id: null,
    organization_id: null,
    published: true,
  },
];
const lessons = [
  [
    "Fundamentos",
    "Um algoritmo é uma sequência finita de passos para resolver um problema. Antes de escrever código, descreva a entrada, o processamento e a saída.\n\nPrática: escreva os passos para calcular a média de duas notas. Identifique quais valores entram e qual resultado deve ser mostrado.",
  ],
  [
    "Variáveis",
    'Variáveis associam um nome a um valor. Em Dart, int armazena inteiros; double armazena decimais; String representa texto; bool representa verdadeiro ou falso.\n\nExemplo: int idade = 16; double nota = 8.5; String nome = "Ana"; bool aprovado = true;\n\nPrática: represente nome, preço e quantidade de um produto.',
  ],
  [
    "Lógica",
    "Uma condição produz verdadeiro ou falso. Combine comparações com && (e), || (ou) e ! (negação).\n\nPara aprovar um aluno com nota mínima 7 e frequência mínima 75, use nota >= 7 && frequencia >= 75.\n\nTeste os casos de fronteira: nota 7, frequência 75 e valores logo abaixo.",
  ],
  [
    "Maratona 1",
    "Planeje um programa de cadastro de três produtos. Para cada um, registre nome, preço e quantidade. Calcule o total do estoque.\n\nDivida o problema em entrada, cálculo e apresentação. Verifique o resultado manualmente antes de continuar.",
  ],
  [
    "Condicionais",
    'if executa um bloco quando sua condição é verdadeira. else permite tratar o caso contrário.\n\nif (idade >= 18) { print("Maior de idade"); } else { print("Menor de idade"); }\n\nPrática: adapte o exemplo para classificar uma nota como aprovada ou em revisão.',
  ],
  [
    "Loops",
    "Use um laço quando uma operação precisa se repetir. Um for tem inicialização, condição e atualização.\n\nfor (int i = 0; i < 5; i++) { print(i); }\n\nEste laço mostra 0, 1, 2, 3 e 4. Evite condições que nunca se tornam falsas.",
  ],
  [
    "Arrays",
    "Em Dart, List organiza valores em sequência. O primeiro índice é 0.\n\nList<int> notas = [7, 8, 9];\nint soma = 0;\nfor (final nota in notas) { soma += nota; }\n\nPrática final: calcule soma e média, tratando também uma lista vazia.",
  ],
];
export const modules: Module[] = lessons.map(([title, body], i) => ({
  id: id(300 + i),
  track_id: id(200),
  title,
  body,
  position: i,
  prerequisite_id: i ? id(299 + i) : null,
  xp: 100,
}));
modules.push(
  ...[
    [
      "Requisições HTTP",
      "O cliente envia uma requisição a um servidor. Método, caminho, cabeçalhos e corpo descrevem a operação. A resposta inclui status e conteúdo.\n\nCompare GET (consulta) e POST (envio). Não coloque senhas no endereço da página.",
    ],
    [
      "APIs REST",
      "Recursos podem ser representados por endereços como /produtos. Defina contratos de entrada e saída, valide dados no servidor e diferencie erros de validação de falhas internas.\n\nExercício: desenhe um contrato JSON para cadastrar um produto.",
    ],
    [
      "Microservices Patterns",
      "Separar serviços cria limites claros, mas também falhas de rede e desafios de consistência. Use timeouts, operações idempotentes e contratos versionados.\n\nPrática: desenhe o fluxo de um pedido e identifique o que ocorre se o serviço de pagamento estiver indisponível.",
    ],
  ].map(([title, body], i) => ({
    id: id(320 + i),
    track_id: id(201),
    title,
    body,
    position: i,
    prerequisite_id: i ? id(319 + i) : null,
    xp: 150,
  })),
);
export const questions: Question[] = [
  {
    id: id(400),
    title: "Tipos e variáveis",
    prompt: "Qual tipo representa 15,5 em Dart?",
    options: ["int", "double", "bool", "String"],
    explanation: "double representa números com parte decimal, como 15.5.",
    category: "Exercício",
    xp: 50,
  },
  {
    id: id(401),
    title: "Condições e limites",
    prompt:
      "Uma aprovação exige nota maior ou igual a 7. Qual expressão inclui a nota 7?",
    options: ["nota > 7", "nota < 7", "nota >= 7", "nota == 8"],
    explanation: "O operador >= inclui o limite 7 e todos os valores maiores.",
    category: "Exames",
    xp: 100,
  },
  {
    id: id(402),
    title: "Refatoração de Algoritmo de Busca",
    prompt:
      "Você precisa encontrar um item em uma lista não ordenada. Qual estratégia funciona sem reordenar os dados?",
    options: [
      "Busca binária diretamente",
      "Retornar sempre o primeiro item",
      "Percorrer até encontrar o item",
      "Comparar somente o último item",
    ],
    explanation:
      "A busca linear percorre a lista e funciona sem exigir ordenação.",
    category: "Laboratório",
    xp: 150,
  },
  {
    id: id(403),
    title: "Decisões em equipe",
    prompt:
      "Um colega não compreendeu um requisito. Qual próximo passo ajuda a equipe?",
    options: [
      "Ignorar a dúvida",
      "Confirmar o objetivo e elaborar um exemplo juntos",
      "Implementar sem perguntar",
      "Excluir o requisito",
    ],
    explanation:
      "Conversar sobre o objetivo e testar um exemplo reduz interpretações diferentes.",
    category: "Dinâmica",
    xp: 50,
  },
];
// Demo answers are intentionally separate. Real answers are kept in a private SQL schema.
export const demoAnswers: Record<string, number> = {
  [id(400)]: 1,
  [id(401)]: 2,
  [id(402)]: 2,
  [id(403)]: 1,
};
