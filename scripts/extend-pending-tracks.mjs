import { readFile, writeFile } from "node:fs/promises";

// Rerun from the repository root. Original IDs, answers, XP and ordering stay in
// enrichment/track-activities; only teaching content and lesson associations change.
const uid = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const file = "src/data/beginner-curriculum.json";
const c = JSON.parse(await readFile(file, "utf8"));
const enrichment = JSON.parse(await readFile("src/data/enrichment.json", "utf8"));
const activities = JSON.parse(await readFile("src/data/track-activities.json", "utf8"));
const originalModules = new Map([...enrichment.modules, ...activities.modules].map((m) => [m.id, m]));
const originalQuestions = new Map([...enrichment.questions, ...activities.questions].map((q) => [q.id, q]));
const originalPlans = new Map(JSON.parse(await readFile("src/data/lesson-plans.json", "utf8")).map((p) => [p.module_id, p]));
// Each entry contains five microsteps, contextual checks and an applied case.
const entries = [
  [3040, "Fluxo de materiais", [
    "Logística organiza o caminho dos materiais, desde o fornecedor até o destino. Fluxo de materiais é a sequência de recebimento, armazenamento, separação e envio; cada etapa precisa de informação sobre produto e quantidade.",
    "Fornecedor é quem fornece insumos ou produtos. O estoque guarda os materiais; a distribuição os leva ao destino. Um registro de entrada informa o que chegou, e um de saída informa o que deixou o estoque.",
    "Exemplo: chegam 20 caixas de cadernos do fornecedor. A equipe confere as caixas, registra a entrada e guarda no local indicado. Quando 7 caixas saem para uma escola, o saldo passa a 20 − 7 = 13 caixas.",
    "A sequência deve permitir conferir o caminho: receber e conferir, registrar a entrada, armazenar, separar o pedido, conferir e enviar. Registre as quantidades na mesma unidade; 20 caixas não significam 20 cadernos.",
    "Limite: um registro não prova que o material físico está correto. Se chegarem 19 caixas em vez das 20 esperadas, registre a divergência e confira com o documento antes de prometer a entrega. Distribuir não elimina atrasos e avarias."
  ], [
    ["O que é fluxo de materiais?", "Caminho entre recebimento, armazenamento e envio", "Somente o nome do fornecedor", "Apenas o preço de venda"],
    ["Quem fornece os produtos?", "Fornecedor", "Cliente final em todos os casos", "Etiqueta do pedido"],
    ["Chegaram 20 caixas e saíram 7. Qual é o saldo?", "13 caixas", "27 caixas", "7 caixas"],
    ["Chegaram 19 das 20 caixas esperadas. O que fazer?", "Registrar a divergência e conferir o documento", "Registrar 20 sem conferir", "Enviar tudo sem contar"]
  ], "Desenhe o caminho de 20 caixas do fornecedor ao estoque e de 7 caixas até uma escola. Marque as conferências, os registros de entrada e saída, o saldo e uma possível divergência.", ["Identifiquei fornecedor, estoque e destino", "Registrei 20 caixas na entrada, 7 na saída e saldo 13", "Expliquei como conferir uma divergência"]],
  [3041, "Controle de estoque", [
    "Controle de estoque é o registro das entradas, saídas e saldos de cada item. Identifique produto, quantidade, unidade, data e documento para conseguir conferir cada movimentação depois.",
    "Saldo inicial é a quantidade no começo do período. Some as entradas e subtraia as saídas para obter o saldo registrado. Fornecedor fornece insumos; estoque armazena produtos; distribuição entrega ao destino.",
    "Exemplo de um item: o saldo inicial é 30 unidades, entram 12 e saem 8. O saldo registrado é 30 + 12 − 8 = 34 unidades. A contagem física deve ser comparada às 34 registradas.",
    "Inventário é a contagem dos materiais existentes. Se a contagem mostrar 32 unidades, a diferença é 32 − 34 = −2 unidades. Procure entrada, saída ou avaria sem registro antes de corrigir o saldo.",
    "Limite: itens diferentes não formam um único saldo. Separe produtos, unidades e locais; não some caixas com peças sem conversão conhecida. Uma diferença precisa de investigação e registro, não de ajuste sem motivo."
  ], [
    ["Que dados permitem conferir uma movimentação?", "Produto, quantidade, unidade, data e documento", "Somente a cor da embalagem", "Somente o preço total"],
    ["Saldo 30, entrada 12 e saída 8: qual é o saldo?", "34 unidades", "50 unidades", "10 unidades"],
    ["O que é inventário?", "Contagem física dos materiais", "Envio ao cliente", "Compra de qualquer produto"],
    ["Registro 34 e contagem 32: qual é a diferença física menos registrada?", "−2 unidades", "2 entradas confirmadas", "66 unidades"]
  ], "Monte uma ficha de um item com saldo 30, entrada 12 e saída 8. Compare o saldo com uma contagem de 32 unidades; registre a diferença e dois documentos que verificaria antes de ajustar.", ["Registrei produto, unidade e movimentações", "Calculei saldo 34 e diferença −2", "Propus conferência antes do ajuste"]],
  [3042, "Preparação de pedidos", [
    "Um pedido informa quais produtos e quantidades devem chegar a um destinatário. Preparar o pedido é separar os itens certos, conferir, proteger na embalagem e registrar a saída.",
    "Separação é buscar no estoque os itens listados. Conferência é comparar produto, código e quantidade com o pedido. Embalagem protege o conteúdo; identificação relaciona o pacote ao destinatário e ao pedido.",
    "Exemplo: o pedido pede 2 cadernos, 1 régua e 3 lápis. Separe esses três tipos de produto e conte 6 peças no total. Confira cada linha: ter 6 peças não basta se uma régua foi trocada por um lápis.",
    "Após conferir, escolha proteção adequada, identifique o volume e registre a saída das quantidades efetivamente enviadas. Se faltar a régua, sinalize a falta e confirme o procedimento de envio parcial antes de fechar o pacote.",
    "Limite: não substitua item por conta própria nem registre saída de algo que ficou no estoque. A conferência precisa ocorrer antes do lacre, quando ainda é possível corrigir uma quantidade ou um produto incorreto."
  ], [
    ["O que comparar na conferência?", "Produto, código e quantidade com o pedido", "Somente o peso da caixa", "Somente a cor do pacote"],
    ["Pedido com 2 cadernos, 1 régua e 3 lápis tem quantas peças?", "6 peças", "3 peças", "5 peças"],
    ["Se a régua estiver em falta, o que fazer?", "Sinalizar a falta e confirmar o procedimento", "Trocar por lápis sem autorização", "Registrar como enviada"],
    ["Quando conferir o conteúdo?", "Antes de lacrar a embalagem", "Somente após a entrega", "Depois de descartar o pedido"]
  ], "Prepare no papel um pedido de 2 cadernos, 1 régua e 3 lápis. Liste a separação, a conferência por linha, a proteção, a identificação e o registro de saída. Explique como trataria a falta da régua.", ["Listei cada produto e quantidade", "Conferi antes de lacrar e identifiquei o pacote", "Registrei somente o que seria enviado"]],
  [4011, "Calcular estoque disponível", [
    "Saldo físico é a quantidade existente no estoque. Estoque disponível é a parte que pode atender novas vendas: retire do saldo físico as unidades avariadas e as reservadas para outros pedidos.",
    "Entrada aumenta o saldo físico; saída o reduz. Uma reserva compromete unidades que ainda estão fisicamente presentes. Uma avaria torna a unidade indisponível até que seja tratada; nesta atividade, reservas e avarias são grupos distintos.",
    "Exemplo: há 120 unidades, entram 80 e saem 135. O saldo físico é 120 + 80 − 135 = 65. Dessas 65, há 15 avariadas e 20 reservadas. O disponível é 65 − 15 − 20 = 30 unidades.",
    "A conta completa é 120 + 80 − 135 − 15 − 20 = 30. Confira a decomposição: 30 disponíveis + 15 avariadas + 20 reservadas = 65 físicas. Uma reserva não é uma segunda saída física.",
    "Limite: não desconte a mesma unidade duas vezes. Se uma unidade reservada também estiver avariada, identifique a sobreposição antes da conta. Resultado negativo indica compromissos maiores que o saldo utilizável e exige revisão dos registros."
  ], [
    ["Uma reserva ainda está fisicamente no estoque?", "Sim, até a saída física", "Nunca", "Só depois da entrega"],
    ["120 + 80 − 135 resulta em qual saldo físico?", "65 unidades", "30 unidades", "335 unidades"],
    ["65 físicas, 15 avariadas e 20 reservadas distintas: disponível?", "30 unidades", "65 unidades", "100 unidades"],
    ["Por que verificar sobreposição entre avarias e reservas?", "Para não descontar a mesma unidade duas vezes", "Para somar todas as reservas ao saldo", "Para ignorar as avarias"]
  ], "Monte uma tabela com 50 unidades físicas, 6 avariadas e 9 reservadas, sem sobreposição. Calcule o disponível, confira a soma das três parcelas e explique o efeito de reservar mais 4 unidades.", ["Distingui saldo físico, avarias e reservas", "Calculei 35 disponíveis e depois 31", "Conferi que não descontei unidades duas vezes"]],
  [4012, "Organizar a expedição", [
    "Expedição é a preparação e liberação dos pedidos para transporte. Ela reúne separação, conferência, embalagem, identificação e registro da saída para que o material enviado corresponda ao pedido.",
    "Cada etapa deixa uma evidência: lista de separação, confirmação dos itens, etiqueta do volume e registro de saída. A etiqueta associa o volume ao pedido e ao destinatário; não substitui a contagem do conteúdo.",
    "Exemplo: um pedido contém 4 pastas e 2 cadernos. Separe os itens, confira cada quantidade, embale e identifique. Só então registre a saída de 4 pastas e 2 cadernos correspondentes ao envio preparado.",
    "Se a conferência encontrar apenas 3 pastas, interrompa o fechamento, corrija ou registre a falta conforme o procedimento. Conferir antes de lacrar evita ter de reabrir um volume com conteúdo incorreto.",
    "Limite: a sequência organizada reduz erros, mas não garante ausência de dano no transporte. Verifique proteção, destinatário e rastreabilidade. Não registre como enviado um pedido que ainda está aguardando correção."
  ], [
    ["Qual etapa vem antes de embalar e lacrar?", "Conferir itens e quantidades", "Ignorar o pedido", "Apagar o saldo"],
    ["Para que serve a identificação do volume?", "Relacionar volume, pedido e destinatário", "Substituir a contagem dos itens", "Aumentar o estoque físico"],
    ["Foram pedidas 4 pastas e separadas 3. O que fazer?", "Interromper o fechamento e tratar a falta", "Lacrar e registrar 4", "Trocar o nome do destinatário"],
    ["O registro da saída deve representar o quê?", "O pedido efetivamente preparado e enviado", "Tudo que estava previsto mesmo faltando", "O estoque anterior à separação"]
  ], "Organize uma ficha de expedição para 4 pastas e 2 cadernos. Indique a ordem das etapas, a evidência de cada conferência e o procedimento caso uma pasta esteja em falta antes do lacre.", ["Ordenei separação, conferência, embalagem e registro", "Relacionei etiqueta, pedido e destinatário", "Expliquei a interrupção para corrigir a falta"]],
  [3060, "Células e organelas", [
    "Célula é uma unidade básica dos seres vivos. A membrana delimita a célula, o citoplasma ocupa a região interna e, nas células eucarióticas, o núcleo abriga a maior parte do material genético.",
    "Organelas são estruturas internas com funções específicas. Mitocôndrias participam da respiração celular, processo que disponibiliza energia para a célula. Cloroplastos realizam fotossíntese em células vegetais fotossintetizantes.",
    "Exemplo: em uma célula de folha exposta à luz, cloroplastos participam da produção de matéria orgânica pela fotossíntese. Essa célula também possui mitocôndrias; uma função não elimina a outra.",
    "Compare estruturas e funções: membrana controla trocas com o meio; núcleo contém a maior parte do material genético na célula eucariótica; citoplasma abriga estruturas e reações. Uma célula animal possui mitocôndrias, mas não cloroplastos.",
    "Limite: o desenho didático simplifica formas e proporções. Nem toda célula tem núcleo delimitado: bactérias são procarióticas. Nem toda célula vegetal possui cloroplastos; células de muitas raízes não fazem fotossíntese."
  ], [
    ["O que delimita a célula e controla trocas com o meio?", "Membrana", "Flor", "Fruto"],
    ["Onde fica a maior parte do material genético de uma célula eucariótica?", "Núcleo", "Fora da célula", "Somente na membrana"],
    ["Qual organela realiza fotossíntese?", "Cloroplasto", "Mitocôndria", "Núcleo"],
    ["Uma célula animal geralmente possui qual organela?", "Mitocôndria", "Cloroplasto", "Parede vegetal"],
    ["Toda célula vegetal possui cloroplastos?", "Não, muitas células de raízes não possuem", "Sim, sem exceção", "Somente as células animais possuem"]
  ], "Faça um esquema de célula eucariótica com membrana, citoplasma, núcleo e mitocôndria. Ao lado, represente uma célula de folha com cloroplastos. Relacione cada estrutura à função e explique um limite do desenho.", ["Associei cada estrutura à sua função", "Distingui mitocôndria de cloroplasto", "Expliquei uma simplificação do esquema"]],
  [3061, "Grupos de plantas", [
    "Classificar plantas é comparar características compartilhadas. Vasos condutores transportam água e outras substâncias; sementes protegem o embrião. Flores e frutos ajudam a reconhecer um grupo específico.",
    "Briófitas, como musgos, não possuem vasos condutores verdadeiros nem sementes. Pteridófitas, como samambaias, possuem vasos, mas não sementes. Esses dois grupos se reproduzem por ciclos que incluem esporos.",
    "Gimnospermas, como pinheiros, possuem sementes que não ficam dentro de frutos. Angiospermas produzem flores e frutos; o fruto envolve as sementes. Uma mangueira com flores e mangas é exemplo de angiosperma.",
    "Exemplo de comparação: musgo sem vasos verdadeiros é briófita; samambaia com vasos e sem sementes é pteridófita; pinheiro com sementes sem frutos é gimnosperma; feijoeiro com flores e vagens é angiosperma.",
    "Limite: tamanho e cor não bastam para classificar. Uma angiosperma pode estar sem flores na época observada; ausência momentânea de flor não comprova outro grupo. Registre as características e o que ainda falta verificar."
  ], [
    ["Qual grupo não possui vasos condutores verdadeiros?", "Briófitas", "Gimnospermas", "Angiospermas"],
    ["Samambaia tem vasos e não produz sementes. Qual grupo?", "Pteridófitas", "Angiospermas", "Gimnospermas"],
    ["O que caracteriza as sementes das gimnospermas?", "Não ficam dentro de frutos", "Sempre ficam em frutos", "Não existem"],
    ["Uma planta está sem flor hoje. O que concluir?", "Ainda faltam evidências para definir o grupo", "É obrigatoriamente briófita", "Não pode ser angiosperma"]
  ], "Monte uma tabela para musgo, samambaia, pinheiro e feijoeiro. Compare vasos, sementes e frutos, indique o grupo de cada exemplo e explique por que uma planta sem flores no momento pode continuar sendo angiosperma.", ["Comparei vasos, sementes e frutos", "Classifiquei os quatro exemplos pelas características", "Registrei o limite da ausência momentânea de flor"]],
  [3062, "Observação científica", [
    "Observar cientificamente é registrar características que podem ser verificadas. Separe observação, como ver uma folha verde, de interpretação, como explicar a função daquela folha.",
    "Órgãos vegetais possuem funções: a raiz absorve água e sais e ajuda na fixação; o caule sustenta e transporta substâncias; a folha costuma ser o principal órgão fotossintetizante; a flor participa da reprodução das angiospermas.",
    "Exemplo de registro: em uma planta no vaso, vejo caule, quatro folhas e uma flor. Não vejo a raiz porque está coberta. A frase ‘a raiz absorve água’ é uma explicação de função, não uma observação direta dessa raiz.",
    "Anote data, local, partes visíveis e uma descrição sem arrancar a planta. Um desenho rotulado ou uma foto autorizada pode ajudar a repetir a observação. Se comparar dias, mantenha ponto de vista e condições semelhantes.",
    "Limite: não ver uma estrutura não prova que ela não existe. Não invente cor ou tamanho de uma raiz oculta. Diferencie o que foi visto, a função conhecida do órgão e uma hipótese que precisaria de outra observação."
  ], [
    ["Qual frase é observação direta?", "Vejo quatro folhas e uma flor", "A raiz oculta tem 10 cm", "A planta nunca terá fruto"],
    ["Qual é uma função da raiz?", "Absorver água e sais", "Produzir flores em todos os casos", "Substituir todas as folhas"],
    ["A raiz não está visível no vaso. O que registrar?", "Raiz não visível, sem inventar medidas", "A planta não possui raiz", "Raiz obrigatoriamente vermelha"]
  ], "Observe uma planta sem arrancá-la, ou use uma imagem que permita ver pelo menos dois órgãos. Registre data e partes visíveis; associe duas funções e separe uma observação de uma interpretação. Declare qualquer parte que não conseguiu observar.", ["Registrei o que realmente estava visível", "Relacionei dois órgãos às funções", "Separei observação, interpretação e limite"]],
  [4015, "Identificar estruturas celulares", [
    "Um esquema celular representa estruturas para facilitar a comparação de posições e funções. Neste desenho de célula eucariótica, procure primeiro o limite externo, depois a estrutura central e a região interna ao redor dela.",
    "A membrana delimita a célula e regula trocas. O núcleo abriga a maior parte do material genético. O citoplasma é a região interna entre a membrana e o núcleo, onde ficam diversas estruturas celulares.",
    "No esquema da prática, 1 indica a membrana, 2 indica o núcleo e 3 indica o citoplasma. Siga cada linha até a estrutura: o número 2 está à direita, mas sua linha termina na estrutura arredondada central.",
    "Exemplo: se a pergunta pede o núcleo, escolha 2 porque a linha aponta para a estrutura central delimitada. Se pede o contorno externo, escolha 1. A região ao redor do núcleo corresponde a 3, citoplasma.",
    "Limite: a posição do número no papel não é a posição da estrutura. Cores e proporções são escolhas didáticas; não representam todas as células nem todas as organelas. Use a ponta da linha e a função para conferir."
  ], [
    ["Qual número indica a membrana no esquema da prática?", "1", "2", "3"],
    ["Qual número indica o citoplasma no esquema?", "3", "2", "1"],
    ["Que função corresponde ao núcleo eucariótico?", "Abrigar a maior parte do material genético", "Ser o limite externo da célula", "Ser uma flor"],
    ["Como localizar uma estrutura numerada?", "Seguir a linha até a estrutura indicada", "Olhar apenas a posição do número", "Usar sempre a mesma cor em qualquer desenho"]
  ], "Reproduza um esquema simples da célula eucariótica da prática. Marque 1 na membrana, 2 no núcleo e 3 no citoplasma; escreva uma função de cada estrutura e uma informação que o desenho não permite concluir.", ["Associei 1 à membrana, 2 ao núcleo e 3 ao citoplasma", "Relacionei as estruturas às funções", "Expliquei um limite de cores, formas ou proporções"]],
  [4016, "Classificar grupos de plantas", [
    "Uma classificação precisa de um critério verificável. Para estes grupos, compare vasos condutores, presença de sementes e presença de frutos; não use apenas o tamanho ou o ambiente da planta.",
    "Briófitas não possuem vasos condutores verdadeiros. Pteridófitas possuem vasos, mas não sementes. Gimnospermas têm sementes sem frutos. Angiospermas possuem flores e frutos que envolvem sementes.",
    "Exemplo: a amostra A tem sementes em cones, sem frutos, e corresponde a uma gimnosperma. A amostra B tem flores e frutos com sementes, correspondendo a uma angiosperma. Vasos, sozinhos, não distinguem esses dois grupos.",
    "Organize uma decisão: sem vasos verdadeiros, considere briófitas; com vasos e sem sementes, pteridófitas; com sementes, investigue frutos. Confira mais de uma característica e registre qual evidência sustenta cada associação.",
    "Limite: uma amostra incompleta pode não mostrar semente ou fruto existente em outra época. Escreva ‘dados insuficientes’ quando necessário. Não transforme a falta de uma observação em prova de ausência no grupo."
  ], [
    ["Qual característica separa gimnospermas de angiospermas neste estudo?", "Sementes sem frutos ou sementes dentro de frutos", "Somente a altura", "Somente a presença de vasos"],
    ["Uma planta com vasos e sem sementes pertence a qual grupo estudado?", "Pteridófitas", "Briófitas", "Gimnospermas"],
    ["Amostra com sementes em cones, sem frutos: qual grupo?", "Gimnospermas", "Briófitas", "Angiospermas"],
    ["Uma amostra incompleta não mostra fruto nem semente. O que fazer?", "Registrar dados insuficientes e buscar mais evidências", "Classificar só pela cor", "Afirmar que não produz sementes"]
  ], "Classifique três fichas: A sem vasos verdadeiros; B com sementes em cones sem frutos; C com flores e frutos com sementes. Justifique por características e acrescente uma ficha incompleta em que faltam dados para concluir.", ["Classifiquei A, B e C pelos critérios ensinados", "Distingui sementes e frutos", "Expliquei por que a ficha incompleta exige mais evidência"]],
  [3070, "Grandezas e unidades", [
    "Grandeza física é uma propriedade que pode ser medida, como comprimento, tempo ou massa. Uma medida combina valor e unidade: 2 m indica dois metros, enquanto 2 s indica dois segundos.",
    "No Sistema Internacional, comprimento usa metro (m), tempo usa segundo (s) e massa usa quilograma (kg). Massa expressa uma propriedade do corpo; peso é a força gravitacional sobre ele, medida em newtons (N).",
    "Força descreve uma interação capaz de alterar o movimento ou deformar um corpo e usa newton (N). Energia está associada à capacidade de realizar trabalho ou provocar transformações e usa joule (J). Potência é a energia transferida por tempo e usa watt (W).",
    "Exemplo: registre comprimento de uma mesa como 2 m, duração como 10 s, massa de um pacote como 3 kg, força como 20 N, energia como 100 J e potência como 5 W. Cada unidade identifica uma grandeza diferente.",
    "Limite: o número isolado não basta. ‘O pacote mede 3’ não informa se são metros ou quilogramas. Não troque kg por N nem J por W; comparar valores exige a mesma grandeza e unidades compatíveis."
  ], [
    ["Qual registro representa um comprimento?", "2 m", "2 s", "2 kg"],
    ["Qual unidade do SI mede tempo?", "Segundo (s)", "Quilograma (kg)", "Newton (N)"],
    ["Qual é a diferença entre massa e peso?", "Massa usa kg; peso é força e usa N", "Ambos são sempre medidos em J", "Peso é comprimento e usa m"]
  ], "Monte uma ficha de medidas hipotéticas para um pacote: comprimento em m, massa em kg e tempo de transporte em s. Acrescente associações de força, energia e potência com N, J e W; explique por que kg não é unidade de peso.", ["Registrei valores acompanhados de unidades", "Associei força, energia e potência a N, J e W", "Distingui massa e peso"]],
  [3071, "Movimento", [
    "Movimento é a mudança de posição em relação a um referencial, como uma marca no chão. Distância é o comprimento total do caminho percorrido; tempo é a duração observada. Registre distância em metros e tempo em segundos.",
    "Rapidez média é a distância total dividida pelo tempo total: rapidez = distância / tempo. A unidade m/s significa quantos metros por segundo correspondem à média do trajeto, sem afirmar que o ritmo foi constante.",
    "Exemplo: uma pessoa caminha 10 m em 5 s. Dividindo 10 por 5, a rapidez média é 2 m/s. Se percorrer os mesmos 10 m em 10 s, a média será 1 m/s, menor porque levou mais tempo.",
    "Distância e deslocamento são diferentes: ao andar 5 m e voltar 5 m ao início, a distância é 10 m e o deslocamento total é zero. A velocidade média usa deslocamento e direção; a rapidez média usa distância.",
    "Limite: tempo total precisa ser maior que zero para dividir. Inclua uma parada se ela pertence ao intervalo observado. Uma média de 2 m/s não permite concluir que a pessoa manteve 2 m/s a cada instante."
  ], [
    ["O que caracteriza movimento em relação a um referencial?", "Mudança de posição", "Somente a massa do corpo", "Somente a cor do objeto"],
    ["Como calcular rapidez média?", "Distância total dividida pelo tempo total", "Tempo dividido pela distância", "Distância somada ao tempo"],
    ["10 m em 5 s corresponde a qual rapidez média?", "2 m/s", "50 m/s", "0,5 m/s"],
    ["Andar 5 m e voltar 5 m ao início dá qual distância total?", "10 m", "0 m", "5 m"],
    ["É válido dividir a distância por tempo total zero?", "Não, a divisão por zero não é definida", "Sim, o resultado sempre é zero", "Sim, basta retirar a unidade"]
  ], "Desenhe um trajeto de ida de 5 m e volta de 5 m em 10 s no total. Registre distância, deslocamento e rapidez média; depois acrescente uma parada de 5 s e recalcule a rapidez considerando todo o intervalo.", ["Distingui distância 10 m e deslocamento zero", "Calculei rapidez 1 m/s para 10 s", "Incluí a parada no tempo total de 15 s"]],
  [3072, "Medição e análise", [
    "Medir é comparar uma grandeza com uma unidade usando um instrumento. Para estudar movimento, defina o trecho, meça sua distância e registre o intervalo de tempo com o mesmo critério de início e fim.",
    "Uma fita métrica pode medir distância; um cronômetro registra duração. Anote valor e unidade de cada leitura. Rapidez média usa distância por tempo; velocidade média usa deslocamento por tempo e exige considerar direção.",
    "Exemplo em linha reta sem retorno: entre duas marcas há 12 m e o tempo é 6 s. A rapidez média é 12 / 6 = 2 m/s. Nesse percurso, a distância e o módulo do deslocamento coincidem.",
    "Planeje medições repetidas do mesmo trecho, mantendo o critério. Tempos de 6,0 s e 6,2 s podem diferir por reação ao cronômetro ou variação de movimento; registre as duas leituras em vez de apagar a que não esperava.",
    "Limite: um cálculo não elimina incerteza de medição. Escolha um trajeto seguro para caminhada ou trabalhe com dados hipotéticos. Não faça teste em via com tráfego; não conclua a precisão do instrumento apenas pelo número de casas decimais anotado."
  ], [
    ["Que dados permitem calcular rapidez média?", "Distância e tempo com unidades", "Massa e cor do tênis", "Somente o tempo"],
    ["12 m percorridos em 6 s dão qual rapidez média?", "2 m/s", "72 m/s", "0,5 m/s"],
    ["Duas medições dão tempos ligeiramente diferentes. O que registrar?", "As leituras e as condições de medição", "Somente a leitura preferida", "Um tempo inventado sem variação"],
    ["Que situação permite distância e módulo do deslocamento iguais?", "Trecho em linha reta sem retorno", "Ida e volta ao mesmo ponto", "Qualquer trajeto com curvas e retorno"]
  ], "Planeje uma medição hipotética de caminhada em trecho reto seguro de 12 m. Use tempos de 6,0 s e 6,2 s, registre as unidades e calcule a rapidez de cada tentativa. Explique uma fonte de variação e quando distância e deslocamento coincidem.", ["Defini instrumentos e critérios de início e fim", "Registrei distância, tempos e cálculos com unidades", "Expliquei uma fonte de variação sem apagar leituras"]],
  [4017, "Calcular rapidez média", [
    "Rapidez média é a distância total percorrida dividida pelo tempo total observado. Ela resume um trajeto em um único valor e não informa a direção; velocidade média usa o deslocamento, que pode ser diferente da distância.",
    "Em um trajeto por etapas, some primeiro todas as distâncias e todos os tempos. Inclua intervalos de parada que façam parte da observação. Só depois divida a distância total pelo tempo total, com unidades compatíveis.",
    "Exemplo: uma pessoa percorre 120 m em 60 s e mais 60 m em 30 s. A distância total é 120 + 60 = 180 m e o tempo total é 60 + 30 = 90 s. Logo, 180 m / 90 s = 2 m/s.",
    "Confira com outra situação: 10 m em 10 s e 90 m em 30 s totalizam 100 m em 40 s, ou 2,5 m/s. Fazer a média simples de 1 m/s e 3 m/s daria 2 m/s e estaria errado, pois as durações são diferentes.",
    "Limite: não divida por tempo zero nem some metros com quilômetros sem converter. Se a pessoa retorna ao ponto inicial, o deslocamento é zero, mas a distância e a rapidez podem ser positivas. A média não comprova ritmo constante."
  ], [
    ["Como combinar duas etapas para obter rapidez média?", "Somar distâncias e tempos antes de dividir", "Somar somente as rapidez das etapas", "Ignorar a etapa mais lenta"],
    ["120 m + 60 m e 60 s + 30 s resultam em quê?", "180 m em 90 s", "180 m em 30 s", "60 m em 90 s"],
    ["100 m em 40 s dão qual rapidez média?", "2,5 m/s", "2 m/s", "4 m/s"],
    ["Uma parada de 10 s dentro da observação entra na conta?", "Sim, no tempo total", "Não, tempo parado nunca conta", "Sim, como distância extra"]
  ], "Calcule a rapidez média de 10 m em 10 s seguidos de 90 m em 30 s. Mostre as somas e compare com a média simples das rapidez das etapas. Depois inclua 10 s de parada e explique o novo resultado.", ["Somei 100 m e 40 s para obter 2,5 m/s", "Expliquei por que a média simples de 1 e 3 não serve", "Incluí a parada: 100 m em 50 s, ou 2 m/s"]],
  [4018, "Interpretar uma medição", [
    "Interpretar uma medição é reconhecer a grandeza, a unidade e o que o registro permite concluir. Valores numéricos diferentes podem representar a mesma quantidade quando as unidades mudam.",
    "Um quilômetro corresponde a 1000 metros. Para passar de km para m, multiplique por 1000; para passar de m para km, divida por 1000. Um minuto corresponde a 60 segundos, portanto a conversão de tempo usa outro fator.",
    "Exemplo: 1,5 km × 1000 = 1500 m. Os registros 1,5 km e 1500 m representam a mesma distância. Para comparar com 1200 m, use a mesma unidade: 1500 m é 300 m maior que 1200 m.",
    "Antes de calcular rapidez, converta também o tempo: 0,12 km são 120 m e 1 min são 60 s. Assim, 120 m / 60 s = 2 m/s. Registre as conversões para outra pessoa poder conferir a conta.",
    "Limite: escrever 1500 m em vez de 1,5 km não comprova maior precisão. Precisão depende do instrumento, do procedimento e da repetição; a escrita sozinha não basta. Não compare distância com tempo como se fossem a mesma grandeza."
  ], [
    ["Quanto vale 0,12 km em metros?", "120 m", "12 m", "1200 m"],
    ["Quantos segundos há em 1 minuto?", "60 s", "100 s", "1000 s"],
    ["Qual a diferença entre 1500 m e 1200 m?", "300 m", "0,3 m", "2700 m"],
    ["Escrever 1500 m em lugar de 1,5 km comprova maior precisão?", "Não, é preciso conhecer instrumento e procedimento", "Sim, porque há mais algarismos", "Sim, porque metros sempre são exatos"]
  ], "Compare os registros 1,5 km, 1500 m e 1200 m, mostrando a conversão e a diferença. Em seguida, calcule a rapidez de 0,12 km em 1 min em m/s e explique por que a escrita de uma medida não comprova sua precisão.", ["Converti as distâncias e comparei na mesma unidade", "Converti 0,12 km e 1 min para obter 2 m/s", "Distingui equivalência de unidades e precisão"]]
];

const retained = new Map([
  [3060, []], [3061, [8018]], [3062, [8019, 8020]],
  [3070, [8021, 8022]], [3071, []]
]);
const ids = new Set(entries.map(([n]) => uid(n)));
c.modules = c.modules.filter((m) => !ids.has(m.id));
c.plans = c.plans.filter((p) => !ids.has(p.module_id));
const inRange = (id) => Number(id.slice(-5)) >= 21000 && Number(id.slice(-5)) < 21100;
c.questions = c.questions.filter((q) => !inRange(q.id));
for (const id of Object.keys(c.answers)) if (inRange(id)) delete c.answers[id];
let next = 21000;
for (const [n, title, paragraphs, quiz, task, criteria] of entries) {
  const old = originalModules.get(uid(n)), plan = originalPlans.get(uid(n));
  const originalIds = retained.has(n) ? retained.get(n).map(uid) : plan.question_ids;
  if (!old || !plan || paragraphs.length !== 5 || quiz.length + originalIds.length < 5)
    throw new Error(`Incomplete pending lesson ${n}`);
  const questionIds = quiz.map(([prompt, correct, wrong1, wrong2], index) => {
    const id = uid(next++);
    const answerIndex = (next - 21001) % 3;
    const options = [wrong1, wrong2];
    options.splice(answerIndex, 0, correct);
    c.questions.push({ id, title: `${title} · verifique o conceito`, prompt, options, explanation: `${correct}. ${paragraphs[Math.min(index + 1, 4)]}`, kind: "choice", activity_type: "multiple_choice", category: "Prática guiada", subject_id: originalQuestions.get(old.question_id).subject_id, xp: 40 });
    c.answers[id] = answerIndex;
    return id;
  });
  c.modules.push({ id: old.id, title, body: paragraphs.join("\n\n"), position: old.position, prerequisite_id: old.prerequisite_id, question_id: questionIds[0] });
  c.plans.push({ ...plan, question_ids: [...questionIds, ...originalIds], dynamic: { kind: "applied", title: "Aplique ao caso", prompt: task, criteria, minLength: plan.dynamic.minLength }, resource_ids: [] });
  c.guides[old.id] = { objective: title, prerequisites: old.prerequisite_id ? "Revise os conceitos da bolinha anterior desta trilha quando precisar." : "Nenhum conceito anterior desta trilha é necessário.", competency: task, next: "Resolva os exercícios e registre a aplicação na dinâmica.", steps: paragraphs.map((text, i) => ({ title: ["O que vamos estudar", "Definições", "Exemplo resolvido", "Como aplicar", "Limites e conferência"][i], text })) };
  c.pedagogy[old.id] = { concepts: [title], requires: [], competency: old.position === 0 ? "Primeiro contato" : old.position < 3 ? "Aplicação guiada" : "Aplicação independente", prerequisite_ids: old.prerequisite_id ? [old.prerequisite_id] : [], version: 2 };
}
const updates = [
  { id: uid(8014), explanation: "Confira cada produto e quantidade antes de embalar. Identifique o pedido e registre a saída somente do que foi efetivamente enviado." },
  { id: uid(8018), title: "Grupos de plantas · prática", explanation: "Angiospermas produzem flores e frutos. A ausência de flores em uma observação isolada não exclui esse grupo." },
  { id: uid(8019), title: "Observação científica · órgãos vegetais", explanation: "A raiz absorve água e sais; a folha costuma ser o principal órgão fotossintetizante; a flor participa da reprodução das angiospermas." },
  { id: uid(8020), explanation: "Registre apenas as partes visíveis, sem arrancar a planta. Separe a descrição observada da explicação sobre a função de cada órgão." },
  { id: uid(8022), title: "Grandezas e unidades · associação", explanation: "Força é medida em newtons (N), energia em joules (J) e potência em watts (W). São grandezas distintas." },
  { id: uid(8023), explanation: "Em um trecho reto sem retorno, a distância coincide com o módulo do deslocamento. Registre distância em metros e tempo em segundos; a rapidez média é distância dividida pelo tempo. Fora desse caso, diferencie rapidez de velocidade média." },
  { id: uid(12017), title: "Calcular rapidez média" }
];
const updateIds = new Set(updates.map((q) => q.id));
c.question_updates = [...(c.question_updates || []).filter((q) => !updateIds.has(q.id)), ...updates];
await writeFile(file, JSON.stringify(c, null, 2) + "\n");
console.log(`${entries.length} original lessons expanded; ${next - 21000} new questions; no position, XP or original answer changes.`);
