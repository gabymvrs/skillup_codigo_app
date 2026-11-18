export type SimulationId =
  "portas-logicas" | "sistema-solar" | "celula-animal" | "circuito-eletrico";

export type SimulationCatalogItem = {
  id: SimulationId;
  title: string;
  subject: string;
  description: string;
  learningGoals: readonly string[];
  icon: string;
  implementationBatch: 2 | 3 | 4 | 5;
  status: "available" | "planned";
};

export const simulationCatalog: readonly SimulationCatalogItem[] = [
  {
    id: "portas-logicas",
    title: "Portas lógicas",
    subject: "Computação",
    description:
      "Combine entradas binárias e observe como AND, OR e NOT alteram a saída.",
    learningGoals: [
      "Distinguir as regras das portas AND, OR e NOT",
      "Relacionar entradas binárias com a saída do circuito",
    ],
    icon: "cpu",
    implementationBatch: 2,
    status: "available",
  },
  {
    id: "sistema-solar",
    title: "Sistema Solar",
    subject: "Ciências",
    description:
      "Explore órbitas simplificadas e compare a posição dos planetas ao redor do Sol.",
    learningGoals: [
      "Reconhecer a ordem dos planetas",
      "Observar diferenças entre órbitas em um modelo simplificado",
    ],
    icon: "compass",
    implementationBatch: 3,
    status: "available",
  },
  {
    id: "celula-animal",
    title: "Célula animal",
    subject: "Biologia",
    description:
      "Selecione estruturas celulares e consulte a função de cada organela.",
    learningGoals: [
      "Identificar organelas em uma representação 2D",
      "Relacionar cada estrutura com sua função principal",
    ],
    icon: "leaf",
    implementationBatch: 4,
    status: "available",
  },
  {
    id: "circuito-eletrico",
    title: "Circuito elétrico",
    subject: "Eletrônica",
    description:
      "Monte um circuito básico e acompanhe o efeito de abrir ou fechar o caminho da corrente.",
    learningGoals: [
      "Reconhecer os componentes de um circuito simples",
      "Diferenciar circuito aberto e circuito fechado",
    ],
    icon: "zap",
    implementationBatch: 5,
    status: "planned",
  },
] as const;

export function findSimulation(id: string | undefined) {
  return simulationCatalog.find((simulation) => simulation.id === id);
}
