# Case study UI/UX do SkillUp

Referência revisada em 19/11/2026 a partir de `Case_study_UIUX_comprimido.pdf`, de Gabrielly Maria.

- 27 páginas
- SHA-256: `351f22e4199d71a43b2ce6eec7a7d4646b0acf772da0bb46022d910415e71405`
- Protótipo indicado no documento: [SkillUp wireframe no Figma](https://www.figma.com/proto/arCFgubKSMkhWcAKKJLwbv/SkillUp-wireframe?node-id=66-2&t=pUsk6JfOCarBt633-1)

## Objetivo do produto

O estudo parte da falta de informação sobre formação técnica entre jovens e propõe tornar essa modalidade mais acessível, visível e relacionada às oportunidades de trabalho. A pesquisa apresentada destaca três necessidades: conteúdo de qualidade, práticas ligadas ao mercado e acompanhamento docente.

## Direção visual preservada

A aplicação deve manter a identidade registrada nas pranchas 20 a 23 do documento:

- Lexend como fonte principal.
- Escala tipográfica de 32 px, 24 px, 18 px, 14 px e 12 px.
- Azul como cor principal e secundária, azul-claro para fundos e destaques suaves e cinza para texto de apoio, bordas e divisórias.
- Verde, amarelo e vermelho reservados para sucesso, atenção e erro.
- Botão primário para a ação principal, secundário para ações complementares e contorno para ações menos importantes.
- Cards semânticos sempre acompanhados por ícone e texto; a cor não pode ser o único indicador.
- Hierarquia clara, espaçamento consistente, áreas de toque adequadas e adaptação para mobile e desktop.

Esses fundamentos já estão transcritos em `src/styles/tokens.css` e nos componentes compartilhados. Novas telas devem reutilizá-los em vez de criar outra paleta, tipografia ou linguagem de componentes.

## Arquitetura de informação

O sitemap do estudo organiza a experiência por perfil:

- Estudante: Aprenda, Social, Emprego e Configurações.
- Docente: Aprenda, Social e Configurações.
- Instituição: Cursos, Social, Empregabilidade e Configurações.
- Recrutador: Aprenda e Parcerias, Social, Emprego e Configurações.
- Plataforma: comunidade e suporte, órgãos reguladores e infraestrutura.

O aplicativo implementa a navegação principal comum e adapta conteúdos conforme o papel. Alterações futuras devem preservar nomes de áreas e rotas estáveis sempre que possível.

## Funcionalidades propostas no estudo

O documento apresenta como direção de produto:

- suporte a dúvidas com tutores e atendimento automatizado;
- práticas ajustadas à disponibilidade do estudante;
- projetos e simulações relacionados ao trabalho;
- vagas de empresas parceiras;
- certificado digital verificável.

Esses itens são propostas do case study, não comprovação de integrações externas prontas. A interface só deve afirmar chat em tempo real, IA, match automático, parceria, reconhecimento oficial ou validação por MEC/SENAI quando o serviço correspondente estiver implementado e homologado. Enquanto isso, os fluxos demonstrativos devem continuar identificados como demonstração.

## Critérios para próximas alterações

1. Consultar os tokens e componentes existentes antes de criar estilos.
2. Manter a navegação compreensível nos quatro perfis.
3. Priorizar prática real, suporte e ligação com trabalho quando houver dados e serviços que sustentem a experiência.
4. Escrever ações e estados de forma concreta, sem prometer envio, avaliação, parceria ou certificação inexistente.
5. Validar teclado, foco visível, contraste, movimento reduzido e telas a partir de 360 px.

## Relação com a implementação

- `src/styles/tokens.css`: cores, tipografia, espaçamento e foco derivados do case study.
- `src/components/ui.tsx`: botões, cards, avisos e componentes reutilizáveis.
- `src/App.tsx`: rotas e composição das áreas principais.
- `docs/ARQUITETURA.md`: decisões técnicas, acessibilidade e limites do produto.
- `docs/reference-index.json`: inventário das fontes e telas de referência.
