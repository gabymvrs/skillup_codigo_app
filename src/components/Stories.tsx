import { Card, SectionTitle } from "./ui";
const stories = [
  {
    name: "Ana",
    area: "Desenvolvimento de Sistemas",
    title: "De estudante a desenvolvedora",
    body: "Ana começou com exercícios de lógica e reuniu seus projetos em um portfólio. Agora consegue mostrar o que aprendeu ao explorar oportunidades.",
    achievement: "Primeiro portfólio publicado",
  },
  {
    name: "Lucas",
    area: "Redes de Computadores",
    title: "Meu primeiro projeto em equipe",
    body: "Lucas tinha dificuldade para dividir tarefas. Com acordos simples e revisões em grupo, participou da documentação de uma rede para a escola.",
    achievement: "Projeto colaborativo concluído",
  },
  {
    name: "Júlia",
    area: "UI/UX Design",
    title: "Descobrindo meu caminho no design",
    body: "Ao observar as dificuldades dos colegas, Júlia começou a desenhar interfaces. Testou um protótipo e descobriu uma nova área de interesse.",
    achievement: "Primeiro teste de usabilidade",
  },
];
export function Stories() {
  return (
    <section aria-labelledby="stories-title">
      <SectionTitle>
        <span id="stories-title">Histórias que inspiram</span>
      </SectionTitle>
      <p className="small muted">
        Histórias fictícias e ilustrativas sobre caminhos possíveis na educação
        técnica.
      </p>
      <div className="stories-grid">
        {stories.map((s, i) => (
          <Card key={s.name} className="story-card">
            <img
              src={`/assets/story-${i + 1}.svg`}
              alt={`Ilustração de ${s.name}, personagem fictício`}
              width={240}
              height={180}
            />
            <div>
              <small>
                {s.name} · {s.area}
              </small>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
              <strong className="story-achievement">{s.achievement}</strong>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
