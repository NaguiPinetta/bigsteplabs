<script lang="ts">
  import { goto } from "$app/navigation";
  import Button from "$lib/components/ui/button.svelte";
  import Card from "$lib/components/ui/card.svelte";
  import CourseCard from "$lib/components/vitrine/CourseCard.svelte";
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

  function goToContact() {
    goto("/contato");
  }
</script>

<!-- Hero Section -->
<section
  class="bg-gradient-to-br from-red-600 via-red-500 to-orange-600 text-white py-16 sm:py-20"
>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
    <div class="mb-8">
      <img
        src="/images/bigstep-logo.png"
        alt="BigStepLabs Logo"
        class="w-20 h-20 mx-auto mb-6"
      />
    </div>

    <h1 class="text-4xl md:text-6xl font-bold mb-6 leading-tight">
      Domine um novo idioma<br />
      <span class="text-yellow-300">mais rápido</span>
    </h1>
    <p class="text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed">
      Aulas ao vivo, plano sob medida e agentes de IA para dúvidas 24/7
    </p>

    <!-- Benefit bullets -->
    <ul
      class="mt-4 mb-8 grid gap-2 sm:grid-cols-3 text-textInvLo max-w-2xl mx-auto"
    >
      <li class="flex items-center justify-center gap-2">
        <span class="w-2 h-2 bg-yellow-300 rounded-full"></span>
        Plano semanal claro
      </li>
      <li class="flex items-center justify-center gap-2">
        <span class="w-2 h-2 bg-yellow-300 rounded-full"></span>
        Prática de conversação
      </li>
      <li class="flex items-center justify-center gap-2">
        <span class="w-2 h-2 bg-yellow-300 rounded-full"></span>
        Correções com IA
      </li>
    </ul>

    <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
      <Button
        size="lg"
        on:click={goToContact}
        class="inline-flex items-center rounded-xl2 bg-brand px-5 py-3 font-semibold text-white shadow-soft hover:bg-brandHover focus:outline-none focus:ring-4 focus:ring-brandRing text-lg px-8 py-4"
      >
        Começar agora
        <ChevronRight class="ml-2 h-5 w-5" />
      </Button>
      <a
        href="/cursos"
        class="inline-flex items-center text-textInvHi hover:text-yellow-300 font-semibold text-lg px-8 py-4 transition-colors"
      >
        Ver cursos
      </a>
    </div>
  </div>
</section>

<!-- Nossos Cursos Section -->
<section class="py-16 sm:py-20 bg-bg">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-16">
      <h2 class="text-3xl md:text-4xl font-bold text-textHi mb-4">
        Nossos Cursos
      </h2>
      <p class="text-xl text-textLo max-w-2xl mx-auto">
        Oferecemos cursos personalizados em inglês, espanhol e francês,
        adaptados às suas necessidades e objetivos.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <CourseCard
        title="Inglês"
        benefit="Conversação guiada + correções com IA"
        href="/cursos/ingles"
        badges={["B1–C1", "+200h"]}
      />
      <CourseCard
        title="Espanhol"
        benefit="Fluência ativa em 6-12 meses"
        href="/cursos/espanhol"
        badges={["A2–B2", "Foco conversação"]}
      />
      <CourseCard
        title="Francês"
        benefit="Comunicação para trabalho/estudos"
        href="/cursos/frances"
        badges={["A2–C1", "Exames"]}
      />
    </div>
  </div>
</section>

<!-- Nossas Modalidades Section -->
<section class="py-16 sm:py-20">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-16">
      <h2 class="text-3xl md:text-4xl font-bold text-textHi mb-4">
        Nossas Modalidades
      </h2>
      <p class="text-xl text-textLo max-w-2xl mx-auto">
        Escolha a modalidade que melhor se adapta ao seu estilo de aprendizado e
        disponibilidade.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div
        class="text-center rounded-xl2 bg-surface p-6 shadow-soft hover:shadow-lift transition-all duration-300"
      >
        <div
          class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <svelte:component
            this={modalities[0].icon}
            class="w-10 h-10 text-red-600"
          />
        </div>
        <h3 class="text-xl font-semibold text-textHi mb-3">
          {modalities[0].title}
        </h3>
        <p class="text-textLo mb-3">{modalities[0].description}</p>
        <p class="text-sm text-textLo mb-2">Interação real e dinâmica</p>
        <span
          class="inline-block rounded-full bg-info/10 text-info text-xs px-3 py-1 font-medium"
          >2–6 alunos</span
        >
      </div>

      <div
        class="text-center rounded-xl2 bg-surface p-6 shadow-soft hover:shadow-lift transition-all duration-300"
      >
        <div
          class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <svelte:component
            this={modalities[1].icon}
            class="w-10 h-10 text-red-600"
          />
        </div>
        <h3 class="text-xl font-semibold text-textHi mb-3">
          {modalities[1].title}
        </h3>
        <p class="text-textLo mb-3">{modalities[1].description}</p>
        <p class="text-sm text-textLo mb-2">Plano 100% sob medida</p>
        <span
          class="inline-block rounded-full bg-info/10 text-info text-xs px-3 py-1 font-medium"
          >1:1</span
        >
      </div>

      <div
        class="text-center rounded-xl2 bg-surface p-6 shadow-soft hover:shadow-lift transition-all duration-300"
      >
        <div
          class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <svelte:component
            this={modalities[2].icon}
            class="w-10 h-10 text-red-600"
          />
        </div>
        <h3 class="text-xl font-semibold text-textHi mb-3">
          {modalities[2].title}
        </h3>
        <p class="text-textLo mb-3">{modalities[2].description}</p>
        <p class="text-sm text-textLo mb-2">Aprovação com estratégia</p>
        <span
          class="inline-block rounded-full bg-info/10 text-info text-xs px-3 py-1 font-medium"
          >IELTS/DELE/Goethe</span
        >
      </div>
    </div>
  </div>
</section>

<!-- Nossos Resultados Section -->
<section class="py-16 sm:py-20 bg-bg">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-16">
      <h2 class="text-3xl md:text-4xl font-bold text-textHi mb-4">
        Nossos Resultados
      </h2>
      <p class="text-xl text-textLo max-w-2xl mx-auto">
        Veja o que nossos alunos dizem sobre sua experiência de aprendizado.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div
        class="rounded-xl2 bg-surface p-6 shadow-soft hover:shadow-lift transition-all duration-300"
      >
        <div class="mb-4">
          <span
            class="inline-block rounded-full bg-success/10 text-success text-xs px-3 py-1 font-medium mb-3"
            >Resultados em 6–12 meses*</span
          >
        </div>
        <div class="flex items-center mb-4">
          <div
            class="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg mr-3"
          >
            MS
          </div>
          <div>
            <p class="font-semibold text-textHi">{testimonials[0].name}</p>
            <div class="flex items-center">
              {#each Array(testimonials[0].rating) as _, i}
                <Star class="w-4 h-4 text-yellow-400 fill-current" />
              {/each}
            </div>
          </div>
        </div>
        <p class="text-textLo mb-4 italic leading-relaxed">
          "{testimonials[0].content}"
        </p>
        <p class="text-sm text-textLo">{testimonials[0].role}</p>
      </div>

      <div
        class="rounded-xl2 bg-surface p-6 shadow-soft hover:shadow-lift transition-all duration-300"
      >
        <div class="mb-4">
          <span
            class="inline-block rounded-full bg-success/10 text-success text-xs px-3 py-1 font-medium mb-3"
            >Resultados em 6–12 meses*</span
          >
        </div>
        <div class="flex items-center mb-4">
          <div
            class="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg mr-3"
          >
            JS
          </div>
          <div>
            <p class="font-semibold text-textHi">{testimonials[1].name}</p>
            <div class="flex items-center">
              {#each Array(testimonials[1].rating) as _, i}
                <Star class="w-4 h-4 text-yellow-400 fill-current" />
              {/each}
            </div>
          </div>
        </div>
        <p class="text-textLo mb-4 italic leading-relaxed">
          "{testimonials[1].content}"
        </p>
        <p class="text-sm text-textLo">{testimonials[1].role}</p>
      </div>

      <div
        class="rounded-xl2 bg-surface p-6 shadow-soft hover:shadow-lift transition-all duration-300"
      >
        <div class="mb-4">
          <span
            class="inline-block rounded-full bg-success/10 text-success text-xs px-3 py-1 font-medium mb-3"
            >Resultados em 6–12 meses*</span
          >
        </div>
        <div class="flex items-center mb-4">
          <div
            class="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg mr-3"
          >
            AC
          </div>
          <div>
            <p class="font-semibold text-textHi">{testimonials[2].name}</p>
            <div class="flex items-center">
              {#each Array(testimonials[2].rating) as _, i}
                <Star class="w-4 h-4 text-yellow-400 fill-current" />
              {/each}
            </div>
          </div>
        </div>
        <p class="text-textLo mb-4 italic leading-relaxed">
          "{testimonials[2].content}"
        </p>
        <p class="text-sm text-textLo">{testimonials[2].role}</p>
      </div>
    </div>

    <div class="text-center mt-8">
      <p class="text-sm text-textLo">
        * <a
          href="/metodologia"
          class="text-brand hover:text-brandHover underline">Ver metodologia</a
        >
      </p>
    </div>
  </div>
</section>

<!-- Nossa Equipe Section -->
<section class="py-16 sm:py-20">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-16">
      <h2 class="text-3xl md:text-4xl font-bold text-textHi mb-4">
        Nossa Equipe
      </h2>
      <p class="text-xl text-textLo max-w-2xl mx-auto">
        Conheça os profissionais experientes que fazem parte do nosso time.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {#each team as member}
        <div
          class="text-center rounded-xl2 bg-surface p-6 shadow-soft hover:shadow-lift transition-all duration-300"
        >
          <div class="w-20 h-20 rounded-full mx-auto mb-4 overflow-hidden">
            <img
              src={member.image}
              alt={`Foto de ${member.name}`}
              class="w-full h-full object-cover"
            />
          </div>
          <h3 class="text-lg font-semibold text-textHi mb-2">
            {member.name}
          </h3>
          <p class="text-brand font-medium mb-3 text-sm">{member.role}</p>
          <p class="text-textLo text-sm leading-relaxed mb-3">
            {member.description}
          </p>
          <a
            href="https://linkedin.com/company/bigsteplabs"
            target="_blank"
            rel="noopener noreferrer"
            class="text-info hover:text-info/80 text-xs font-medium">LinkedIn</a
          >
        </div>
      {/each}
    </div>
  </div>
</section>

<!-- FAQ Section -->
<section class="py-16 sm:py-20 bg-bg">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-16">
      <h2 class="text-3xl md:text-4xl font-bold text-textHi mb-4">
        Perguntas Frequentes
      </h2>
      <p class="text-xl text-textLo">
        Tire suas dúvidas sobre nossa metodologia e cursos.
      </p>
    </div>

    <div class="space-y-6">
      <div class="rounded-xl2 bg-surface p-6 shadow-soft">
        <h3 class="text-lg font-semibold text-textHi mb-3">
          Quanto tempo leva para ficar fluente?
        </h3>
        <p class="text-textLo mb-4">
          Com 2–4h/semana, a maioria atinge conversação em 6–12 meses.
        </p>
        <a
          href="https://wa.me/5585999883225?text=Olá! Gostaria de saber mais sobre os cursos de idiomas da BigStepLabs."
          class="inline-flex items-center gap-2 text-brand font-semibold hover:text-brandHover"
        >
          Falar no WhatsApp →
        </a>
      </div>

      <div class="rounded-xl2 bg-surface p-6 shadow-soft">
        <h3 class="text-lg font-semibold text-textHi mb-3">
          Oferecem certificados reconhecidos?
        </h3>
        <p class="text-textLo mb-4">
          Preparamos para IELTS/TOEFL/DELE/Goethe com simulações e correções.
        </p>
        <a
          href="https://wa.me/5585999883225?text=Olá! Gostaria de saber mais sobre os cursos de idiomas da BigStepLabs."
          class="inline-flex items-center gap-2 text-brand font-semibold hover:text-brandHover"
        >
          Falar no WhatsApp →
        </a>
      </div>

      <div class="rounded-xl2 bg-surface p-6 shadow-soft">
        <h3 class="text-lg font-semibold text-textHi mb-3">
          Posso reagendar aulas perdidas?
        </h3>
        <p class="text-textLo mb-4">
          Política flexível: reagende com até 12h de antecedência.
        </p>
        <a
          href="https://wa.me/5585999883225?text=Olá! Gostaria de saber mais sobre os cursos de idiomas da BigStepLabs."
          class="inline-flex items-center gap-2 text-brand font-semibold hover:text-brandHover"
        >
          Falar no WhatsApp →
        </a>
      </div>

      <div class="rounded-xl2 bg-surface p-6 shadow-soft">
        <h3 class="text-lg font-semibold text-textHi mb-3">
          Posso fazer uma aula experimental?
        </h3>
        <p class="text-textLo mb-4">Sim — aula gratuita e nivelamento.</p>
        <a
          href="https://wa.me/5585999883225?text=Olá! Gostaria de saber mais sobre os cursos de idiomas da BigStepLabs."
          class="inline-flex items-center gap-2 text-brand font-semibold hover:text-brandHover"
        >
          Falar no WhatsApp →
        </a>
      </div>

      <div class="rounded-xl2 bg-surface p-6 shadow-soft">
        <h3 class="text-lg font-semibold text-textHi mb-3">
          Como funciona a metodologia BigStepLabs?
        </h3>
        <p class="text-textLo mb-4">
          Nossa metodologia combina tecnologia de IA avançada com técnicas
          comprovadas de ensino de idiomas, criando uma experiência
          personalizada e eficaz para cada estudante.
        </p>
        <a
          href="https://wa.me/5585999883225?text=Olá! Gostaria de saber mais sobre os cursos de idiomas da BigStepLabs."
          class="inline-flex items-center gap-2 text-brand font-semibold hover:text-brandHover"
        >
          Falar no WhatsApp →
        </a>
      </div>
    </div>
  </div>
</section>

<!-- CTA Section -->
<section
  class="py-16 sm:py-20 bg-gradient-to-r from-brand to-brandHover text-white"
>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
    <h2 class="text-3xl md:text-4xl font-bold mb-6">
      Pronto para dar o próximo passo?
    </h2>
    <p class="text-xl mb-8 max-w-2xl mx-auto text-textInvLo">
      Entre em contato conosco e descubra como podemos ajudar você a alcançar
      seus objetivos de idiomas.
    </p>
    <Button
      size="lg"
      on:click={goToContact}
      class="inline-flex items-center rounded-xl2 bg-yellow-400 hover:bg-yellow-500 text-textHi text-lg px-8 py-4 shadow-soft hover:shadow-lift transition-all duration-300"
    >
      Começar agora
      <ChevronRight class="ml-2 h-5 w-5" />
    </Button>
  </div>
</section>
