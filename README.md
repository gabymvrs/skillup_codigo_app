# SkillUp — implementação do wireframe (em progresso)

Interface web responsiva baseada no arquivo enviado **SkillUp wireframe (19).zip**, que contém 78 telas exportadas em PDF.

## O que está implementado nesta etapa
- Interface **Estudante**, com navegação **Home, Aprenda, Social, Emprego e Config.**
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
- **Não é ainda a reprodução completa das 78 telas**. Telas de Docente, Recrutador e Instituição, além de todos os fluxos de acesso/cadastro, ainda não foram implementadas.
- Nenhum backend, login real, integração com instituições ou envio de candidaturas.
- Interações de suporte e vagas são simulações locais. A interface e os fluxos exigem testes manuais no navegador antes de uso em produção.
- Alguns elementos visuais foram aproximados a partir dos PDFs exportados.
