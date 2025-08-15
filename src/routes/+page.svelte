<script lang="ts">
  import { goto } from "$app/navigation";
  import Button from "$lib/components/ui/button.svelte";
  import Card from "$lib/components/ui/card.svelte";
  import {
    ChevronRight,
    Users,
    BookOpen,
    Target,
    Award,
    Star,
  } from "lucide-svelte";

  const courses = [
    {
      name: "Inglês",
      description:
        "Aprenda inglês com nossa metodologia inovadora e tecnologia de IA.",
      href: "/cursos/ingles",
      color: "from-blue-500 to-blue-600",
    },
    {
      name: "Espanhol",
      description:
        "Domine o espanhol com aulas personalizadas e conversação natural.",
      href: "/cursos/espanhol",
      color: "from-green-500 to-green-600",
    },
    {
      name: "Francês",
      description: "Descubra a elegância do francês com nossa abordagem única.",
      href: "/cursos/frances",
      color: "from-purple-500 to-purple-600",
    },
  ];

  const modalities = [
    {
      icon: Users,
      title: "Aulas em Grupo",
      description: "Aprenda com outros estudantes em um ambiente colaborativo.",
    },
    {
      icon: BookOpen,
      title: "Aulas Particulares",
      description: "Receba atenção individualizada e personalizada.",
    },
    {
      icon: Target,
      title: "Preparação para Testes",
      description: "Prepare-se para exames de proficiência com sucesso.",
    },
  ];

  const testimonials = [
    {
      name: "Maria Silva",
      role: "Estudante de Inglês",
      content:
        "Em apenas 6 meses consegui me comunicar fluentemente em inglês. A metodologia é incrível!",
      rating: 5,
    },
    {
      name: "João Santos",
      role: "Estudante de Espanhol",
      content:
        "As aulas são dinâmicas e os professores são muito atenciosos. Recomendo para todos!",
      rating: 5,
    },
    {
      name: "Ana Costa",
      role: "Estudante de Francês",
      content:
        "Nunca imaginei que aprender francês seria tão divertido e eficaz.",
      rating: 5,
    },
  ];

  const team = [
    {
      name: "Nagui Pinetta",
      role: "Founder, Director, Content Manager",
      description:
        "Fundador, diretor e gerente de conteúdo da BigStepLabs, com vasta experiência em educação e tecnologia.",
      image: "/images/team/nagui-pinetta.svg?v=1",
    },
    {
      name: "Rodrigo",
      role: "Course Coordinator",
      description:
        "Coordenador de cursos responsável pelo planejamento e implementação de todos os programas de idiomas.",
      image: "/images/team/rodrigo.svg?v=1",
    },
    {
      name: "Michele",
      role: "German Course Admin",
      description:
        "Administradora especializada no curso de alemão com profundo conhecimento da língua germânica.",
      image: "/images/team/michele.svg?v=1",
    },
    {
      name: "Riccelli",
      role: "Pedagogical Coordinator",
      description:
        "Coordenador pedagógico especializado em metodologias de ensino inovadoras.",
      image: "/images/team/riccelli.svg?v=1",
    },
  ];

  const faqs = [
    {
      question: "Como funciona a metodologia BigStepLabs?",
      answer:
        "Nossa metodologia combina tecnologia de IA avançada com técnicas comprovadas de ensino de idiomas, criando uma experiência personalizada e eficaz para cada estudante.",
    },
    {
      question: "Quanto tempo leva para ficar fluente?",
      answer:
        "O tempo varia de acordo com o nível inicial e dedicação do estudante. Em média, nossos alunos alcançam fluência conversacional em 6-12 meses.",
    },
    {
      question: "Oferecem aulas online?",
      answer:
        "Sim! Oferecemos tanto aulas presenciais quanto online, com a mesma qualidade e metodologia.",
    },
    {
      question: "Posso fazer uma aula experimental?",
      answer:
        "Claro! Oferecemos uma aula experimental gratuita para que você conheça nossa metodologia antes de se matricular.",
    },
  ];

  function goToContact() {
    goto("/contato");
  }

  function goToCourses() {
    goto("/cursos");
  }
</script>

<svelte:head>
  <title>BigStepLabs - Transforme seu Aprendizado de Idiomas</title>
  <meta
    name="description"
    content="Aprenda idiomas com nossa metodologia inovadora e tecnologia de IA avançada. Cursos de inglês, espanhol e francês com resultados comprovados."
  />
</svelte:head>

<!-- Hero Section -->
<section
  class="bg-gradient-to-br from-red-600 via-red-500 to-orange-600 text-white py-20"
>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
    <!-- Logo -->
    <div class="flex justify-center mb-8">
      <img
        src="/images/bigstep-logo.png"
        alt="BigStepLabs Logo"
        class="w-20 h-20 object-contain"
      />
    </div>

    <h1 class="text-4xl md:text-6xl font-bold mb-6 leading-tight">
      Transforme seu<br />
      <span class="text-yellow-300">Aprendizado de Idiomas</span>
    </h1>
    <p class="text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed">
      Descubra nossa metodologia inovadora que combina tecnologia de IA avançada
      com técnicas comprovadas para resultados excepcionais.
    </p>
    <div class="flex flex-col sm:flex-row gap-4 justify-center">
      <Button
        size="lg"
        on:click={goToContact}
        class="bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-lg px-8 py-4"
      >
        Começar Agora
        <ChevronRight class="ml-2 h-5 w-5" />
      </Button>
      <Button
        variant="outline"
        size="lg"
        on:click={goToCourses}
        class="border-white text-white hover:bg-white hover:text-gray-900 text-lg px-8 py-4"
      >
        Ver Cursos
      </Button>
    </div>
  </div>
</section>

<!-- Nossos Cursos Section -->
<section class="py-20 bg-gray-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-16">
      <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
        Nossos Cursos
      </h2>
      <p class="text-xl text-gray-600 max-w-2xl mx-auto">
        Oferecemos cursos personalizados em inglês, espanhol e francês,
        adaptados às suas necessidades e objetivos.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      {#each courses as course}
        <Card
          class="overflow-hidden hover:shadow-lg transition-shadow duration-300"
        >
          <div class="p-6">
            <div
              class="w-16 h-16 bg-gradient-to-r {course.color} rounded-lg flex items-center justify-center mb-4"
            >
              <BookOpen class="w-8 h-8 text-white" />
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">
              {course.name}
            </h3>
            <p class="text-gray-600 mb-4">{course.description}</p>
            <a
              href={course.href}
              class="inline-flex items-center text-red-600 hover:text-red-700 font-medium"
            >
              Saiba mais
              <ChevronRight class="ml-1 h-4 w-4" />
            </a>
          </div>
        </Card>
      {/each}
    </div>
  </div>
</section>

<!-- Nossas Modalidades Section -->
<section class="py-20">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-16">
      <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
        Nossas Modalidades
      </h2>
      <p class="text-xl text-gray-600 max-w-2xl mx-auto">
        Escolha a modalidade que melhor se adapta ao seu estilo de aprendizado e
        disponibilidade.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      {#each modalities as modality}
        <div class="text-center">
          <div
            class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <svelte:component
              this={modality.icon}
              class="w-10 h-10 text-red-600"
            />
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-3">
            {modality.title}
          </h3>
          <p class="text-gray-600">{modality.description}</p>
        </div>
      {/each}
    </div>
  </div>
</section>

<!-- Nossos Resultados Section -->
<section class="py-20 bg-gray-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-16">
      <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
        Nossos Resultados
      </h2>
      <p class="text-xl text-gray-600 max-w-2xl mx-auto">
        Veja o que nossos alunos dizem sobre sua experiência de aprendizado.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      {#each testimonials as testimonial}
        <Card class="p-6">
          <div class="flex items-center mb-4">
            {#each Array(testimonial.rating) as _, i}
              <Star class="w-5 h-5 text-yellow-400 fill-current" />
            {/each}
          </div>
          <p class="text-gray-600 mb-4 italic">"{testimonial.content}"</p>
          <div>
            <p class="font-semibold text-gray-900">{testimonial.name}</p>
            <p class="text-sm text-gray-500">{testimonial.role}</p>
          </div>
        </Card>
      {/each}
    </div>
  </div>
</section>

<!-- Nossa Equipe Section -->
<section class="py-20">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-16">
      <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
        Nossa Equipe
      </h2>
      <p class="text-xl text-gray-600 max-w-2xl mx-auto">
        Conheça os profissionais experientes que fazem parte do nosso time.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      {#each team as member}
        <Card class="text-center p-6">
          <div class="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden">
            <img
              src={member.image}
              alt={`Foto de ${member.name}`}
              class="w-full h-full object-cover"
            />
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">
            {member.name}
          </h3>
          <p class="text-red-600 font-medium mb-3">{member.role}</p>
          <p class="text-gray-600">{member.description}</p>
        </Card>
      {/each}
    </div>
  </div>
</section>

<!-- FAQ Section -->
<section class="py-20 bg-gray-50">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-16">
      <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
        Perguntas Frequentes
      </h2>
      <p class="text-xl text-gray-600">
        Tire suas dúvidas sobre nossa metodologia e cursos.
      </p>
    </div>

    <div class="space-y-4">
      {#each faqs as faq}
        <Card class="p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-3">
            {faq.question}
          </h3>
          <p class="text-gray-600">{faq.answer}</p>
        </Card>
      {/each}
    </div>
  </div>
</section>

<!-- CTA Section -->
<section class="py-20 bg-gradient-to-r from-red-600 to-orange-600 text-white">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
    <h2 class="text-3xl md:text-4xl font-bold mb-6">
      Pronto para dar o próximo passo?
    </h2>
    <p class="text-xl mb-8 max-w-2xl mx-auto">
      Entre em contato conosco e descubra como podemos ajudar você a alcançar
      seus objetivos de idiomas.
    </p>
    <Button
      size="lg"
      on:click={goToContact}
      class="bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-lg px-8 py-4"
    >
      Começar Agora
      <ChevronRight class="ml-2 h-5 w-5" />
    </Button>
  </div>
</section>
