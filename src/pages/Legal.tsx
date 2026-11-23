import { Link } from "react-router-dom";

type LegalDocument = "privacidade" | "termos" | "cookies";

const documents = {
  privacidade: {
    title: "Política de Privacidade",
    sections: [
      [
        "Quais dados aparecem no SkillUp",
        "O cadastro usa e-mail e perfil de acesso. Conforme o tipo de perfil, o SkillUp também pode receber nome, apresentação, formação, experiências, habilidades, documentos de verificação e arquivos enviados pelo usuário. A plataforma registra progresso de aprendizagem, respostas, mensagens, publicações, projetos, candidaturas e preferências.",
      ],
      [
        "Para que os dados são usados",
        "Os dados sustentam autenticação, cadastro, aprendizagem, comunicação dentro da plataforma, portfólio, comunidade, oportunidades profissionais e suporte. Recursos demonstrativos ficam no navegador e não devem receber documentos pessoais.",
      ],
      [
        "Onde os dados ficam",
        "Contas reais usam Supabase para autenticação, banco de dados, arquivos privados e funções de servidor. Preferências, progresso demonstrativo e materiais offline podem ficar no armazenamento do navegador. A hospedagem da aplicação usa Vercel. Recursos específicos podem usar serviços externos identificados na interface ou na documentação técnica.",
      ],
      [
        "Visibilidade e compartilhamento",
        "O usuário controla opções de visibilidade disponíveis nas configurações. Publicações e perfis marcados para a comunidade podem ser vistos por pessoas autenticadas. Dados de candidatura podem ser apresentados ao responsável pela oportunidade. Documentos de verificação não são conteúdo público.",
      ],
      [
        "Controles disponíveis",
        "A área de configurações permite revisar informações do perfil, controlar opções de visibilidade e solicitar a exclusão da conta. Materiais offline podem ser removidos no próprio dispositivo.",
      ],
      [
        "Crianças e adolescentes",
        "O repositório ainda não define o procedimento empresarial para consentimento de responsáveis, verificação de idade ou atendimento de solicitações relacionadas a menores. Esses fluxos precisam ser definidos antes do uso com esse público.",
      ],
    ],
  },
  termos: {
    title: "Termos de Uso",
    sections: [
      [
        "Uso da conta",
        "Use informações verdadeiras, mantenha sua senha protegida e não compartilhe o acesso. Perfis profissionais podem depender da análise de documentos; o envio não garante aprovação.",
      ],
      [
        "Uso da plataforma",
        "O SkillUp oferece recursos de aprendizagem, comunidade, portfólio e oportunidades. Não use esses recursos para fraude, assédio, discriminação, divulgação indevida de dados pessoais, violação de direitos autorais ou outras atividades ilegais.",
      ],
      [
        "Conteúdo enviado",
        "Envie apenas conteúdo que você possa utilizar. Antes de publicar, retire dados pessoais desnecessários. Publicações, projetos e mensagens devem respeitar a finalidade educacional e profissional do espaço em que aparecem.",
      ],
      [
        "Demonstração e recursos externos",
        "A demonstração usa dados ilustrativos e armazenamento local. Ela não deve receber documentos ou outros dados pessoais reais. Links externos abrem serviços de terceiros e seguem as condições desses serviços.",
      ],
      [
        "Suspensão e encerramento",
        "Contas que coloquem pessoas ou o serviço em risco podem precisar de restrição. Os critérios empresariais, o processo de contestação e os canais responsáveis ainda precisam ser definidos antes da publicação definitiva destes Termos.",
      ],
    ],
  },
  cookies: {
    title: "Aviso de Cookies e Armazenamento Local",
    sections: [
      [
        "Recursos essenciais",
        "O SkillUp usa recursos do navegador para manter a sessão, guardar preferências, preservar dados da demonstração e disponibilizar conteúdo offline. Bloquear esses recursos pode impedir o login ou apagar informações mantidas apenas no dispositivo.",
      ],
      [
        "O que fica no dispositivo",
        "Podem ficar no navegador a sessão de acesso, o perfil usado na demonstração, preferências de interface, rascunhos, progresso demonstrativo, materiais recentes e a confirmação de leitura deste aviso.",
      ],
      [
        "Publicidade e análise",
        "O código auditado não instala cookies de publicidade nem uma ferramenta própria de análise de comportamento. Essa declaração precisa ser revista se novos serviços forem adicionados.",
      ],
      [
        "Como remover",
        "Você pode limpar dados do site nas configurações do navegador. Materiais offline também podem ser removidos dentro do SkillUp. A limpeza pode encerrar a sessão e apagar dados da demonstração que não foram enviados a um servidor.",
      ],
    ],
  },
} satisfies Record<
  LegalDocument,
  { title: string; sections: Array<[string, string]> }
>;

export function LegalPage({ document }: { document: LegalDocument }) {
  const content = documents[document];
  return (
    <main className="standalone legal-page">
      <Link to="/">Voltar ao início</Link>
      <header>
        <p className="eyebrow">Informações legais</p>
        <h1>{content.title}</h1>
        <p>Revisão técnica: 23 de novembro de 2026.</p>
      </header>
      <aside className="legal-draft" role="note">
        <strong>Documento em revisão.</strong> A organização responsável ainda
        precisa informar nome jurídico, contato de privacidade, bases legais e
        prazos de retenção. Este texto não substitui revisão jurídica.
      </aside>
      <div className="legal-content">
        {content.sections.map(([title, text]) => (
          <section key={title}>
            <h2>{title}</h2>
            <p>{text}</p>
          </section>
        ))}
        <section>
          <h2>Contato e solicitações</h2>
          <p>
            O canal oficial de privacidade ainda não foi informado. Até sua
            definição, não inclua um endereço fictício neste documento.
          </p>
        </section>
      </div>
    </main>
  );
}
