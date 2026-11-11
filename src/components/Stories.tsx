import { Card, SectionTitle } from "./ui";
const stories = [
  {
    name: "Nina da Hora",
    area: "Ciência da Computação",
    title: "Pesquisa em inteligência artificial",
    body: "Nina pesquisa inteligência artificial, visão computacional, avaliação técnica de modelos e governança de IA.",
    source: "https://ninadahora.dev/",
    image:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Retrato fotográfico de uma jovem sorrindo",
    photographer: "Aiony Haust",
    photographerUrl: "https://unsplash.com/@aiony",
  },
  {
    name: "Bianca Muniz",
    area: "Análise de Dados",
    title: "Da biomedicina ao jornalismo de dados",
    body: "Bianca é analista de dados da Agência Pública. Formada em Biomedicina, fez mestrado em Ciências e especialização em Jornalismo de Dados e Automação.",
    source: "https://www.pretalab.com/rede/bianca-aparecida-muniz-pereira-739",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Retrato fotográfico de uma mulher sorrindo",
    photographer: "Christopher Campbell",
    photographerUrl: "https://unsplash.com/@chrisjoelcampbell",
  },
  {
    name: "Ire Aderinokun",
    area: "Engenharia de Software",
    title: "Tecnologia e empreendedorismo",
    body: "Ire é engenheira de software, empreendedora e investidora. Há uma década, trabalha na construção e no apoio a negócios de tecnologia em mercados emergentes.",
    source: "https://ireaderinokun.com/",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Retrato fotográfico de uma mulher olhando para a câmera",
    photographer: "Michael Dam",
    photographerUrl: "https://unsplash.com/@michaeldam",
  },
];
export function Stories() {
  return (
    <section aria-labelledby="stories-title">
      <SectionTitle>
        <span id="stories-title">Histórias que inspiram</span>
      </SectionTitle>
      <p className="small muted">
        Trajetórias reais, resumidas a partir das fontes indicadas. As fotos são
        ilustrativas e mostram pessoas reais fotografadas para o Unsplash.
      </p>
      <div className="stories-grid">
        {stories.map((s) => (
          <Card key={s.name} className="story-card">
            <img
              src={s.image}
              alt={s.imageAlt}
              width={900}
              height={600}
              loading="lazy"
              decoding="async"
            />
            <div>
              <small>
                {s.name} · {s.area}
              </small>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
              <a
                className="story-source"
                href={s.source}
                target="_blank"
                rel="noreferrer"
              >
                Ler fonte original
              </a>
              <small className="story-photo-credit">
                Foto ilustrativa: {" "}
                <a
                  href={`${s.photographerUrl}?utm_source=skillup&utm_medium=referral`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {s.photographer}
                </a>{" "}
                / Unsplash
              </small>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
