# SkillUp — implementação do wireframe (em progresso)

Interface web responsiva baseada no arquivo enviado **SkillUp wireframe (19).zip**, que contém 78 telas exportadas em PDF.

## O que está implementado nesta etapa
- Interface **Estudante** e painéis iniciais de **Docente, Recrutador e Instituição**, com navegação **Home, Aprenda, Social, Emprego e Config.**
- Aprenda: **Material, Prática, Trilhas e Suporte**
- Social: **Início, Fóruns, Projetos e Feed**
- Home: progresso, trilha atual, agenda, suporte, conquistas e dica de carreira
- Emprego: selo de empregabilidade, vagas **ilustrativas** e depoimentos ilustrativos
- Configurações: perfil editável
- Experiência mobile com navegação inferior e web com menu lateral
- Funcionalidades locais demonstrativas: concluir módulos, desafio diário, registrar interesse, editar nome, navegação e filtros básicos

## Como executar
Abra `index.html` em um navegador; não precisa de instalação. Os arquivos **ativos** são:
- `index.html`
- `figma-student.css`
- `figma-student.js`

`style.css` e `script.js` são os arquivos da versão experimental anterior e **não são carregados** pela interface atual.

## Limitações importantes
- **Não é ainda a reprodução completa das 78 telas**. Os quatro painéis iniciais e fluxos demonstrativos de entrada/cadastro por perfil já existem, mas várias telas específicas de Docente, Recrutador e Instituição ainda não têm conteúdo próprio e os fluxos completos das 78 telas não foram concluídos.
- Login e cadastro são demonstrações locais sem validação de credenciais; nenhum backend, login real, integração com instituições ou envio de candidaturas.
- Interações de suporte e vagas são simulações locais. A interface e os fluxos exigem testes manuais no navegador antes de uso em produção.
- Alguns elementos visuais foram aproximados a partir dos PDFs exportados.

## Experiência de entrada
O SkillUp sempre apresenta uma tela de acesso antes de exibir o conteúdo, exceto durante a mesma sessão de navegação após entrar. O login é **apenas demonstrativo**: não valida usuários ou senhas, não protege dados e não concede acesso seguro. A sessão é mantida com `sessionStorage`, enquanto nome, perfil e progresso de demonstração ficam no `localStorage`. Para produção, será necessário autenticação real no servidor e proteção de rotas.
