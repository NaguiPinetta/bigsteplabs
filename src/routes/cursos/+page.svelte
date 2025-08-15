<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Card from "$lib/components/ui/card.svelte";
  import {
    ChevronRight,
    BookOpen,
    Users,
    Target,
    Clock,
    Award,
  } from "lucide-svelte";
  import {
    coursesPublic,
    coursesLoading,
    coursesError,
    initializeVitrine,
  } from "$lib/stores/vitrine";

  console.log("Courses page script executing");
  console.log("Initial coursesLoading state:", $coursesLoading);
  console.log("Initial coursesPublic state:", $coursesPublic);

  // Try to initialize immediately
  console.log("Calling initializeVitrine immediately");
  initializeVitrine()
    .then(() => {
      console.log("initializeVitrine completed");
    })
    .catch((error) => {
      console.error("Error in initializeVitrine:", error);
    });

  function goToCourse(slug: string) {
    goto(`/cursos/${slug}`);
  }

  function goToContact() {
    goto("/contato");
  }
</script>

<svelte:head>
  <title>Cursos de Idiomas - BigStepLabs</title>
  <meta
    name="description"
    content="Descubra nossos cursos de inglês, espanhol e francês. Metodologia inovadora com tecnologia de IA para resultados excepcionais."
  />
</svelte:head>

<!-- Hero Section -->
<section
  class="bg-gradient-to-br from-red-600 via-red-500 to-orange-600 text-white py-20"
>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
    <h1 class="text-4xl md:text-6xl font-bold mb-6 leading-tight">
      Nossos Cursos de<br />
      <span class="text-yellow-300">Idiomas</span>
    </h1>
    <p class="text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed">
      Escolha o idioma que deseja aprender e descubra nossa metodologia
      inovadora que combina tecnologia de IA com técnicas comprovadas.
    </p>
    <Button
      size="lg"
      on:click={goToContact}
      class="bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-lg px-8 py-4"
    >
      Solicitar Aula Experimental
      <ChevronRight class="ml-2 h-5 w-5" />
    </Button>
  </div>
</section>

<!-- Courses Section -->
<section class="py-16 bg-gray-900">
  <div class="container mx-auto px-4">
    <div class="text-center mb-12">
      <h2 class="text-4xl font-bold text-white mb-4">Escolha seu Curso</h2>
      <p class="text-xl text-gray-300 max-w-3xl mx-auto">
        Todos os nossos cursos seguem a mesma metodologia comprovada, adaptada
        para cada idioma e nível de proficiência.
      </p>
    </div>

    {#if $coursesLoading}
      <div class="flex justify-center items-center py-12">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"
        ></div>
      </div>
    {:else if $coursesError}
      <div class="text-center py-12">
        <p class="text-red-400 text-lg mb-4">
          Erro ao carregar cursos: {$coursesError}
        </p>
        <Button
          on:click={initializeVitrine}
          class="bg-red-600 hover:bg-red-700"
        >
          Tentar Carregar Novamente
        </Button>
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {#each $coursesPublic.filter((course) => course.is_active !== false) as course}
          <Card
            class="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
          >
            <!-- Course Header -->
            <div class="bg-gradient-to-r {course.color_scheme} text-white p-6">
              <div class="flex items-center justify-between mb-4">
                <div
                  class="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center"
                >
                  <BookOpen class="w-8 h-8 text-white" />
                </div>
                <span
                  class="text-sm font-medium bg-white/20 px-3 py-1 rounded-full"
                >
                  {course.level || "Todos os níveis"}
                </span>
              </div>
              <h3 class="text-2xl font-bold mb-2">{course.name}</h3>
              <p class="text-white/90">{course.short_description}</p>
            </div>

            <!-- Course Content -->
            <div class="p-6">
              <p class="text-gray-600 mb-6">
                {course.long_description || course.short_description}
              </p>

              <!-- Features -->
              {#if course.features && course.features.length > 0}
                <div class="mb-6">
                  <h4 class="font-semibold text-gray-900 mb-3">
                    O que está incluído:
                  </h4>
                  <ul class="space-y-2">
                    {#each course.features as feature}
                      <li class="flex items-start">
                        <div
                          class="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0"
                        >
                          <div class="w-2 h-2 bg-green-600 rounded-full"></div>
                        </div>
                        <span class="text-sm text-gray-600">{feature}</span>
                      </li>
                    {/each}
                  </ul>
                </div>
              {/if}

              <!-- Course Details -->
              <div class="grid grid-cols-2 gap-4 mb-6">
                {#if course.duration}
                  <div class="text-center p-3 bg-gray-50 rounded-lg">
                    <Clock class="w-5 h-5 text-gray-500 mx-auto mb-1" />
                    <p class="text-xs text-gray-500">Duração</p>
                    <p class="text-sm font-medium text-gray-900">
                      {course.duration}
                    </p>
                  </div>
                {/if}
                {#if course.price}
                  <div class="text-center p-3 bg-gray-50 rounded-lg">
                    <Award class="w-5 h-5 text-gray-500 mx-auto mb-1" />
                    <p class="text-xs text-gray-500">Preço</p>
                    <p class="text-sm font-medium text-gray-900">
                      {course.price}
                    </p>
                  </div>
                {/if}
              </div>

              <!-- CTA Buttons -->
              <div class="space-y-3">
                <Button
                  on:click={() => goToCourse(course.slug)}
                  class="w-full bg-red-600 hover:bg-red-700"
                >
                  Ver Detalhes
                  <ChevronRight class="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" on:click={goToContact} class="w-full">
                  Solicitar Aula Experimental
                </Button>
              </div>
            </div>
          </Card>
        {/each}
      </div>
    {/if}
  </div>
</section>

<!-- Why Choose Us Section -->
<section class="py-20 bg-gray-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-16">
      <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
        Por que Escolher a BigStepLabs?
      </h2>
      <p class="text-xl text-gray-600 max-w-2xl mx-auto">
        Nossa metodologia única combina o melhor da tecnologia moderna com
        técnicas comprovadas de ensino.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div class="text-center">
        <div
          class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <Users class="w-10 h-10 text-red-600" />
        </div>
        <h3 class="text-xl font-semibold text-gray-900 mb-3">
          Professores Experientes
        </h3>
        <p class="text-gray-600">
          Nossa equipe é composta por professores certificados e com vasta
          experiência no ensino de idiomas.
        </p>
      </div>

      <div class="text-center">
        <div
          class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <Target class="w-10 h-10 text-red-600" />
        </div>
        <h3 class="text-xl font-semibold text-gray-900 mb-3">
          Metodologia Comprovada
        </h3>
        <p class="text-gray-600">
          Nossa metodologia já ajudou milhares de estudantes a alcançarem
          fluência em diferentes idiomas.
        </p>
      </div>

      <div class="text-center">
        <div
          class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <Award class="w-10 h-10 text-red-600" />
        </div>
        <h3 class="text-xl font-semibold text-gray-900 mb-3">
          Resultados Garantidos
        </h3>
        <p class="text-gray-600">
          Comprometemo-nos com o sucesso de nossos alunos, oferecendo suporte
          contínuo e acompanhamento personalizado.
        </p>
      </div>
    </div>
  </div>
</section>

<!-- CTA Section -->
<section class="py-20 bg-gradient-to-r from-red-600 to-orange-600 text-white">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
    <h2 class="text-3xl md:text-4xl font-bold mb-6">
      Pronto para começar sua jornada?
    </h2>
    <p class="text-xl mb-8 max-w-2xl mx-auto">
      Entre em contato conosco e agende sua aula experimental gratuita. Descubra
      como podemos transformar seu aprendizado de idiomas.
    </p>
    <Button
      size="lg"
      on:click={goToContact}
      class="bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-lg px-8 py-4"
    >
      Agendar Aula Experimental
      <ChevronRight class="ml-2 h-5 w-5" />
    </Button>
  </div>
</section>
