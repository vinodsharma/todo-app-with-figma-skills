import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'Is it free to use?',
    answer:
      'Yes! Todo App is completely free to use with all features included. We plan to introduce optional paid plans in the future for advanced features like team collaboration.',
  },
  {
    question: 'How is my data protected?',
    answer:
      'Your data is securely stored in a PostgreSQL database with encryption. We use industry-standard authentication with NextAuth.js. Your todos are private and only accessible to you.',
  },
  {
    question: 'Is there a mobile app?',
    answer:
      'Todo App is fully responsive and works great on mobile browsers. Native iOS and Android apps are on our roadmap for future development.',
  },
  {
    question: 'Can I import from other todo apps?',
    answer:
      'Import functionality is coming soon. We\'re planning to support imports from popular apps like Todoist, Things, and CSV files.',
  },
  {
    question: 'Will there be paid plans?',
    answer:
      'We\'re exploring premium features like team collaboration, integrations, and advanced analytics. Sign up to be notified when pricing is available.',
  },
];

export function FAQ() {
  return (
    <section id="faq" className="container py-24">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
          Frequently Asked Questions
        </h2>
        <p className="text-muted-foreground text-lg">
          Everything you need to know about Todo App
        </p>
      </div>
      <div className="max-w-3xl mx-auto">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
