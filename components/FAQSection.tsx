interface FaqItem {
  question: string
  answerHtml: string
}

const faqItems: FaqItem[] = [
  {
    question: "Quel est le role principal du pharmacien d'officine au Maroc ?",
    answerHtml:
      "Le <strong>pharmacien d'officine au Maroc</strong> est un professionnel de sante de premiere ligne. Son role principal est la <strong>dispensation des medicaments</strong> sur ordonnance ou en vente libre, en s'assurant de leur bon usage. Au-dela de cela, il conseille le patient, previent les interactions medicamenteuses, oriente vers d'autres professionnels de sante et participe a la prevention.",
  },
  {
    question: 'Quelle est la difference entre une pharmacie et une parapharmacie ?',
    answerHtml:
      "Une <strong>pharmacie</strong> peut vendre des <strong>medicaments</strong> et est dirigee par un pharmacien diplome. Une <strong>parapharmacie</strong> propose des produits de sante et de bien-etre (hygiene, cosmetiques, complements) mais ne delivre pas de medicaments sur ordonnance.",
  },
  {
    question: 'Un pharmacien a-t-il le droit de refuser de delivrer une ordonnance ?',
    answerHtml:
      "Oui. Un pharmacien peut refuser de delivrer une ordonnance s'il existe un doute sur son authenticite, sa conformite ou un risque manifeste pour le patient. Il contacte alors le medecin prescripteur pour clarification.",
  },
  {
    question: 'Comment savoir si mon medicament est soumis a prescription ?',
    answerHtml:
      "La fiche medicament indique souvent le tableau reglementaire (A, B, C). Les tableaux A et B concernent generalement des substances soumises a prescription stricte. En cas de doute, demandez confirmation a votre pharmacien.",
  },
  {
    question: 'Mon medicament est introuvable ou en rupture de stock, que faire ?',
    answerHtml:
      "En cas de rupture, le pharmacien peut proposer une alternative ou un generique lorsque cela est approprie, en coordination avec le medecin si necessaire. Il peut aussi orienter vers une autre officine.",
  },
  {
    question: "Est-ce que les medicaments sont rembourses par la mutuelle ou l'AMO au Maroc ?",
    answerHtml:
      "De nombreux medicaments prescrits sont remboursables par l'AMO ou une mutuelle selon les conditions de prise en charge. L'ordonnance doit etre valide et le medicament eligibile au remboursement.",
  },
  {
    question: 'Comment se debarrasser des medicaments perimes ou non utilises au Maroc ?',
    answerHtml:
      "Ne jetez pas les medicaments perimes a la poubelle ni dans les toilettes. Rapportez-les a la pharmacie afin qu'ils soient collectes et elimines via les filieres adaptees.",
  },
]

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  inLanguage: 'fr-MA',
  mainEntity: faqItems.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answerHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
    },
  })),
}

export default function FAQSection() {
  return (
    <section id="faq" className="container max-w-2xl mx-auto px-4 py-12 md:py-16">
      <h2 className="text-2xl md:text-3xl font-semibold text-center mb-8">FAQ : Le metier de pharmacien au Maroc</h2>

      <div className="w-full divide-y divide-border rounded-xl border border-border bg-background">
        {faqItems.map((item, index) => (
          <details key={item.question} className="group px-5 py-3">
            <summary className="list-none cursor-pointer min-h-11 flex items-center justify-between gap-2 text-foreground text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md">
              <span>{item.question}</span>
              <span className="text-muted-foreground transition-transform group-open:rotate-180" aria-hidden>
                v
              </span>
            </summary>
            <div className="pt-2 pb-1 text-sm text-muted-foreground leading-relaxed">
              <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: item.answerHtml }} />
            </div>
            {index < faqItems.length - 1 ? null : <span className="sr-only" />}
          </details>
        ))}
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
    </section>
  )
}
