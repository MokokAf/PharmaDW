"use client"

import React from "react"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"

interface FaqItem {
  question: string
  answerHtml: string
}

const faqItems: FaqItem[] = [
  {
    question: "Quel est le rôle principal du pharmacien d'officine au Maroc ?",
    answerHtml:
      "Le <strong>pharmacien d'officine au Maroc</strong> est un professionnel de santé de première ligne. Son rôle principal est la <strong>dispensation des médicaments</strong> sur ordonnance ou en vente libre, en s'assurant de leur bon usage. Au-delà de ça, il est aussi là pour vous conseiller sur votre traitement, prévenir les interactions médicamenteuses, vous orienter vers d'autres professionnels de santé si besoin, et vous offrir des services de prévention et de suivi.",
  },
  {
    question: "Quelle est la différence entre une pharmacie et une parapharmacie ?",
    answerHtml:
      "Une <strong>pharmacie</strong> est autorisée à vendre des <strong>médicaments</strong> (avec ou sans ordonnance) et est dirigée par un pharmacien diplômé. Une <strong>parapharmacie</strong>, quant à elle, propose des produits de santé et de bien-être (cosmétiques, produits d'hygiène, compléments alimentaires, articles de puériculture, etc.) mais n'est pas autorisée à vendre des médicaments. Les produits de parapharmacie peuvent souvent être trouvés aussi en pharmacie.",
  },
  {
    question: "Un pharmacien a-t-il le droit de refuser de délivrer une ordonnance ?",
    answerHtml:
      "Oui, un <strong>pharmacien a le droit de refuser de délivrer une ordonnance</strong> si celle-ci présente un doute sur son authenticité, sa conformité (par exemple, des informations manquantes) ou si la prescription est manifestement excessive ou dangereuse pour le patient. Dans de tels cas, le pharmacien doit contacter le médecin prescripteur pour clarification. C'est une mesure de sécurité pour votre bien-être.",
  },
  {
    question:
      "Comment savoir si mon médicament est soumis à prescription ?",
    answerHtml:
      `Pour savoir si un médicament nécessite une <strong>ordonnance médicale</strong> au Maroc, vous pouvez consulter la <strong>fiche produit dédiée</strong> sur notre site. Chaque fiche spécifie le « Tableau » du médicament (Tableau A, B, ou C).<br/><br/>Ces « Tableaux » sont des classifications réglementaires qui indiquent la nature et le niveau de contrôle des substances vénéneuses :<ul class="list-disc ml-6 my-2"><li><strong>Tableau A :</strong> Concerne les substances ou préparations vénéneuses qui sont <strong>toxiques</strong> et généralement soumises à une <strong>prescription médicale obligatoire</strong> et un contrôle strict.</li><li><strong>Tableau B :</strong> Regroupe les substances ou préparations vénéneuses qui sont <strong>dangereuses</strong>, également soumises à une <strong>prescription médicale obligatoire</strong> et un suivi rigoureux.</li><li><strong>Tableau C :</strong> Vise les substances ou préparations vénéneuses qui sont <strong>moins dangereuses</strong> mais nécessitent néanmoins une attention particulière. Elles peuvent parfois être disponibles sans ordonnance ou sous des conditions de délivrance spécifiques.</li></ul>Au-delà de ces classifications, les <strong>psychotropes et les stupéfiants</strong> (souvent liés aux Tableaux A et B) sont soumis à une <strong>réglementation encore plus stricte</strong>, exigeant des ordonnances spécifiques, non renouvelables, et une traçabilité rigoureuse.<br/><br/>En résumé, si la fiche médicament indique un « Tableau », il est fort probable que le médicament nécessite une prescription. Pour toute incertitude, le plus simple est de <strong>demander confirmation à votre pharmacien</strong>, qui est le professionnel habilité à vous renseigner précisément.`,
  },
  {
    question: "Mon médicament est introuvable ou en rupture de stock, que faire ?",
    answerHtml:
      "Les <strong>ruptures de stock de médicaments</strong> peuvent malheureusement arriver. Si votre pharmacien ne peut pas vous procurer le médicament prescrit, il peut vous proposer des <strong>alternatives ou des génériques</strong> s'ils existent et sont appropriés, après vérification avec le médecin si nécessaire. Il peut aussi vous orienter vers d'autres pharmacies qui pourraient l'avoir en stock. Les autorités sanitaires marocaines travaillent pour minimiser ces situations.",
  },
  {
    question: "Est-ce que les médicaments sont remboursés par la mutuelle ou l'AMO au Maroc ?",
    answerHtml:
      "Oui, de nombreux médicaments prescrits par un médecin sont <strong>remboursables</strong> par l'Assurance Maladie Obligatoire (AMO) ou par votre mutuelle privée, en fonction des accords et du type de médicament. Pour que le remboursement soit effectif, l'ordonnance doit être valide et le médicament doit figurer sur la liste des médicaments remboursables. Votre pharmacien peut vous aider à comprendre les démarches et les conditions de remboursement.",
  },
  {
    question: "Comment se débarrasser des médicaments périmés ou non utilisés au Maroc ?",
    answerHtml:
      "Il est très important de ne pas jeter les médicaments périmés ou non utilisés à la poubelle ou dans les toilettes. Pour un <strong>recyclage sûr et écologique</strong>, vous devez les rapporter à votre <strong>pharmacie</strong>. Les pharmaciens disposent de circuits spécifiques pour collecter et éliminer ces produits de manière responsable, afin d'éviter la pollution et les risques pour la santé publique.",
  },
]

// JSON-LD Schema.org markup for SEO
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  inLanguage: "fr-MA",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answerHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(), // plain text for JSON-LD
    },
  })),
}

const FAQSection: React.FC = () => {
  return (
    <section id="faq" className="container max-w-2xl mx-auto px-4 py-12 md:py-16">
      <h2 className="text-2xl md:text-3xl font-semibold text-center mb-8">
        FAQ : Le métier de Pharmacien au Maroc
      </h2>

      <Accordion
        type="single"
        collapsible
        className="w-full divide-y divide-border rounded-xl border border-border bg-background"
      >
        {faqItems.map((item, idx) => (
          <AccordionItem value={`item-${idx}`} key={idx}>
            <AccordionTrigger className="px-5 py-4 text-foreground text-left text-sm font-medium hover:no-underline">{item.question}</AccordionTrigger>
            <AccordionContent className="px-5 pb-4">
              <div
                className="prose prose-sm max-w-none text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: item.answerHtml }}
              />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
    </section>
  )
}

export default FAQSection
