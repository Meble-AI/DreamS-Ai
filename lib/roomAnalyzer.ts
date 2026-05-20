export function buildRoomAnalysisPrompt(
  imageAnalysis: string
) {

  return `

PRZEANALIZOWANE POMIESZCZENIE:

${imageAnalysis}

BARDZO WAŻNE:

- projekt musi pasować do rzeczywistego pomieszczenia,
- respektuj ściany,
- respektuj okna,
- respektuj drzwi,
- zachowaj realistyczną ergonomię,
- zachowaj realistyczne odległości,
- zachowaj realistyczną wysokość zabudowy,
- projekt musi wyglądać jak możliwy do wykonania.

`;
}