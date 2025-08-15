<script lang="ts">
  import Card from "$lib/components/ui/card.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Accordion from "$lib/components/ui/accordion.svelte";
  import AccordionContent from "$lib/components/ui/accordion-content.svelte";
  import AccordionItem from "$lib/components/ui/accordion-item.svelte";
  import AccordionTrigger from "$lib/components/ui/accordion-trigger.svelte";

  // FAQ data
  const faqs = [
    {
      question: "É possível aprender uma língua em poucos meses?",
      answer:
        "Sim! Com foco e planejamento é possível evoluir rapidamente. Na BigStep, oferecemos programas de estudo personalizados que já ajudaram muitos alunos a alcançar níveis comprovados de proficiência em prazos curtos. O segredo está em aproveitar cada momento do aprendizado com dedicação.",
    },
    {
      question: "Aulas individuais ou em grupo: qual escolher?",
      answer:
        "Ambas as modalidades têm vantagens distintas:\n\nIndividuais: perfeitas para quem busca um acompanhamento totalmente personalizado, focado nas suas metas e necessidades.\n\nEm grupo: ótimas para praticar a comunicação de forma dinâmica e realista, simulando situações do dia a dia em um ambiente colaborativo e divertido.\n\nNa BigStep, ajudamos você a escolher a melhor opção de acordo com o seu perfil.",
    },
    {
      question:
        "O que preciso aprimorar para me sair bem em uma entrevista de trabalho?",
      answer:
        "Além de domínio do idioma, é essencial transmitir confiança e clareza. Nossas aulas abordam:\n\n• Como descrever experiências profissionais e rotinas\n• Como falar de metas, aspirações e hobbies\n• Simulações de perguntas frequentes em entrevistas\n\nNosso objetivo é prepará-lo para causar uma excelente impressão em qualquer situação profissional.",
    },
    {
      question: "Como faço para começar a estudar na BigStep?",
      answer:
        "É simples e sem compromisso. Entre em contato conosco via WhatsApp, Telegram ou e-mail. Faremos um teste de nivelamento para entender suas necessidades e metas e montar a melhor proposta de estudo para você. Sua jornada começa aqui!",
    },
    {
      question: "Posso aproveitar o que já estudei em outros cursos?",
      answer:
        "Claro! Durante nossa entrevista inicial, você poderá contar suas experiências e objetivos. Realizamos um teste de nivelamento completo para identificar o programa ideal para aproveitar ao máximo seus conhecimentos prévios e evoluir ainda mais.",
    },
    {
      question: "A BigStep emite certificados de proficiência?",
      answer:
        "Nosso foco é que você se comunique fluentemente, tanto em conversas informais quanto em apresentações, entrevistas ou provas. Embora não emitamos certificados próprios, preparamos você para conquistar certificações reconhecidas internacionalmente, como IELTS, TOEFL, DELE ou GOETHE. Nossos alunos alcançam excelentes resultados nesses exames.",
    },
    {
      question: "Qual metodologia é utilizada na BigStep?",
      answer:
        "Adotamos uma abordagem baseada na Abordagem Comunicativa (CLT) combinada com atividades práticas, tradução, interpretação oral e gramática contextualizada. As aulas são pensadas para que você fixe as estruturas aprendidas e consiga aplicá-las naturalmente em situações reais. O resultado é um processo de aprendizado dinâmico e eficiente.",
    },
    {
      question: "Quanto tempo leva para ficar fluente?",
      answer:
        "O tempo varia de acordo com o nível inicial e dedicação do estudante. Em média, nossos alunos alcançam fluência conversacional em 6-12 meses com aulas regulares e prática consistente.",
    },
    {
      question: "Oferecem aulas online?",
      answer:
        "Sim! Oferecemos tanto aulas presenciais quanto online, com a mesma qualidade e metodologia. Nossas aulas online utilizam tecnologia avançada para garantir uma experiência interativa e eficaz.",
    },
    {
      question: "Posso fazer uma aula experimental?",
      answer:
        "Claro! Oferecemos uma aula experimental gratuita para que você conheça nossa metodologia antes de se matricular. É uma ótima oportunidade de experimentar nossa abordagem única.",
    },
    {
      question: "Como funciona o teste de nivelamento?",
      answer:
        "Nosso teste de nivelamento é completo e avalia suas habilidades em leitura, escrita, compreensão auditiva e expressão oral. Com base nos resultados, criamos um plano de estudos personalizado para maximizar seu progresso.",
    },
    {
      question: "Que materiais didáticos vocês utilizam?",
      answer:
        "Utilizamos materiais exclusivos da BigStep, combinados com recursos de alta qualidade de editoras reconhecidas. Nossos materiais são atualizados regularmente e adaptados às necessidades específicas de cada aluno.",
    },
  ];

  const categories = [
    {
      name: "Metodologia",
      icon: "🎯",
      description: "Como funciona nossa abordagem única de aprendizado",
    },
    {
      name: "Início dos Estudos",
      icon: "🚀",
      description: "Como começar e aproveitar conhecimentos prévios",
    },
    {
      name: "Modalidades de Aula",
      icon: "👥",
      description: "Aulas individuais ou em grupo",
    },
    {
      name: "Preparação Profissional",
      icon: "💼",
      description: "Dicas para entrevistas e situações de trabalho",
    },
    {
      name: "Tempo e Progresso",
      icon: "⏱️",
      description: "Sobre prazos e desenvolvimento das habilidades",
    },
    {
      name: "Materiais e Recursos",
      icon: "📚",
      description: "Sobre nossos materiais didáticos e recursos",
    },
  ];
</script>

<svelte:head>
  <title>Perguntas Frequentes - BigStepLabs</title>
  <meta
    name="description"
    content="Encontre respostas para as perguntas mais comuns sobre nossa plataforma de aprendizado de idiomas com IA."
  />
  <meta property="og:title" content="Perguntas Frequentes - BigStepLabs" />
  <meta
    property="og:description"
    content="Encontre respostas para as perguntas mais comuns sobre nossa plataforma de aprendizado de idiomas com IA."
  />
</svelte:head>

<!-- Hero Section -->
<section class="bg-gradient-to-br from-red-50 to-white py-20">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
    <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
      Perguntas Frequentes
    </h1>
    <p class="text-xl text-gray-600 max-w-3xl mx-auto">
      Encontre respostas para as dúvidas mais comuns sobre nossa metodologia,
      modalidades de aula e como começar sua jornada de aprendizado.
    </p>
  </div>
</section>

<!-- FAQ Categories -->
<section class="py-16 bg-white">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-12">
      <h2 class="text-3xl font-bold text-gray-900 mb-4">
        Categorias de Perguntas
      </h2>
      <p class="text-lg text-gray-600">
        Organizamos as perguntas por categoria para facilitar sua busca
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {#each categories as category}
        <Card
          class="text-center p-6 hover:shadow-lg transition-shadow duration-300 cursor-pointer"
        >
          <div class="text-4xl mb-4">{category.icon}</div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">
            {category.name}
          </h3>
          <p class="text-sm text-gray-600">
            {category.description}
          </p>
        </Card>
      {/each}
    </div>
  </div>
</section>

<!-- FAQ Accordion -->
<section class="py-16 bg-gray-50">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-12">
      <h2 class="text-3xl font-bold text-gray-900 mb-4">
        Perguntas Mais Frequentes
      </h2>
      <p class="text-lg text-gray-600">
        Clique nas perguntas para ver as respostas detalhadas
      </p>
    </div>

    <Card class="p-8">
      <Accordion type="single" collapsible classList="w-full">
        {#each faqs as faq, index}
          <AccordionItem value={`item-${index}`}>
            <AccordionTrigger classList="text-left">
              <span class="font-medium text-gray-900">{faq.question}</span>
            </AccordionTrigger>
            <AccordionContent>
              <p class="text-gray-600 leading-relaxed pt-2">
                {faq.answer}
              </p>
            </AccordionContent>
          </AccordionItem>
        {/each}
      </Accordion>
    </Card>
  </div>
</section>

<!-- Still Have Questions Section -->
<section class="py-20 bg-white">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
    <h2 class="text-3xl font-bold text-gray-900 mb-6">Ainda Tem Dúvidas?</h2>
    <p class="text-lg text-gray-600 mb-8">
      Nossa equipe está sempre pronta para ajudar. Entre em contato conosco e
      responderemos o mais rápido possível.
    </p>

    <div class="flex flex-col sm:flex-row gap-4 justify-center">
      <Button variant="default" size="lg" class="bg-red-600 hover:bg-red-700">
        <a href="/contato">Falar com Suporte</a>
      </Button>
      <Button
        variant="outline"
        size="lg"
        class="border-red-600 text-red-600 hover:bg-red-50"
      >
        <a href="/app/auth/login">Fazer Login</a>
      </Button>
    </div>
  </div>
</section>

<!-- Quick Tips Section -->
<section class="py-16 bg-red-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-12">
      <h2 class="text-3xl font-bold text-gray-900 mb-4">Dicas Rápidas</h2>
      <p class="text-lg text-gray-600">
        Algumas sugestões para aproveitar ao máximo nossa plataforma
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div class="text-center">
        <div
          class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <span class="text-2xl">⏰</span>
        </div>
        <h3 class="text-xl font-semibold text-gray-900 mb-3">
          Estude Regularmente
        </h3>
        <p class="text-gray-600">
          Dedique pelo menos 20-30 minutos por dia para melhores resultados. A
          consistência é mais importante que a duração.
        </p>
      </div>

      <div class="text-center">
        <div
          class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <span class="text-2xl">🎯</span>
        </div>
        <h3 class="text-xl font-semibold text-gray-900 mb-3">
          Defina Metas Claras
        </h3>
        <p class="text-gray-600">
          Estabeleça objetivos específicos e mensuráveis. Isso ajuda a manter o
          foco e motivação durante o aprendizado.
        </p>
      </div>

      <div class="text-center">
        <div
          class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <span class="text-2xl">🔄</span>
        </div>
        <h3 class="text-xl font-semibold text-gray-900 mb-3">
          Revise Regularmente
        </h3>
        <p class="text-gray-600">
          Use os recursos de revisão da plataforma para reforçar o que aprendeu
          e identificar áreas que precisam de mais atenção.
        </p>
      </div>
    </div>
  </div>
</section>
