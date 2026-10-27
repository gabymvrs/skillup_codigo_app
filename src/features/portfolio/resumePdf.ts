export interface ResumeSection {
  title: string;
  lines: string[];
}
export async function resumePdf(
  name: string,
  headline: string,
  sections: ResumeSection[],
) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  let y = 22;
  function text(value: string, size = 11, bold = false) {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(value, 170) as string[];
    for (const line of lines) {
      if (y > 275) {
        doc.addPage();
        y = 22;
      }
      doc.text(line, 20, y);
      y += size * 0.45 + 2;
    }
    y += 3;
  }
  doc.setTextColor(12, 26, 70);
  text(name, 22, true);
  if (headline) text(headline, 12);
  doc.setTextColor(35, 35, 35);
  for (const section of sections) {
    if (!section.lines.length) continue;
    if (y > 255) {
      doc.addPage();
      y = 22;
    }
    text(section.title, 13, true);
    section.lines.forEach((line) => text(line));
    y += 3;
  }
  doc.setProperties({
    title: `Currículo — ${name}`,
    author: name,
    creator: "SkillUp",
  });
  return doc.output("blob");
}
