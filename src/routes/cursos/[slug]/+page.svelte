<script lang="ts">
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import Card from "$lib/components/ui/card.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import {
    Check,
    Clock,
    Users,
    Star,
    BookOpen,
    Video,
    FileText,
    Award,
    ArrowLeft,
  } from "lucide-svelte";
  import {
    coursesPublic,
    coursesLoading,
    coursesError,
    initializeVitrine,
  } from "$lib/stores/vitrine";

  export let data: any;

  let course: any = null;
  let loading = true;
  let error: string | null = null;

  onMount(async () => {
    try {
      await initializeVitrine();
      const slug = $page.params.slug;
      course = $coursesPublic.find((c) => c.slug === slug);

      if (!course) {
        error = "Curso não encontrado";
      }
    } catch (err) {
      error = "Erro ao carregar o curso";
      console.error(err);
    } finally {
      loading = false;
    }
  });

  function goToContact() {
    goto("/contato");
  }

  function goToCourses() {
    goto("/cursos");
  }

  function getLessonIcon(type: string) {
    switch (type) {
      case "video":
        return Video;
      case "exercise":
        return FileText;
      default:
        return BookOpen;
    }
  }

  function enrollCourse() {
    // Redirect to login if not authenticated, or to payment if authenticated
    window.location.href = "/app/auth/login";
  }
</script>

<svelte:head>
  <title>{course?.name || "Curso"} - BigStepLabs</title>
  <meta
    name="description"
    content={course?.short_description || "Descrição do curso"}
  />
  <meta property="og:title" content="{course?.name || 'Curso'} - BigStepLabs" />
  <meta
    property="og:description"
    content={course?.short_description || "Descrição do curso"}
  />
</svelte:head>

{#if loading}
  <div class="flex justify-center items-center py-20">
    <div
      class="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"
    ></div>
  </div>
{:else if error}
  <div class="text-center py-20">
    <h1 class="text-2xl font-bold text-gray-900 mb-4">Erro</h1>
    <p class="text-gray-600 mb-6">{error}</p>
    <Button on:click={goToCourses} class="bg-red-600 hover:bg-red-700">
      <ArrowLeft class="w-4 h-4 mr-2" />
      Voltar aos Cursos
    </Button>
  </div>
{:else if course}
  <!-- Hero Section -->
  <section class="bg-gradient-to-br from-red-50 to-white py-20">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <!-- Course Info -->
        <div>
          <div class="flex items-center gap-4 mb-6">
            <Button variant="ghost" on:click={goToCourses} class="p-2">
              <ArrowLeft class="w-5 h-5" />
            </Button>
            <div
              class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800"
            >
              {course.level || "Todos os níveis"}
            </div>
          </div>
          <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {course.name}
          </h1>
          <p class="text-xl text-gray-600 mb-6">
            {course.short_description}
          </p>
          <p class="text-lg text-gray-700 mb-8 leading-relaxed">
            {course.long_description}
          </p>

          <!-- Course Stats -->
          <div class="flex flex-wrap gap-6 mb-8">
            <div class="flex items-center text-gray-600">
              <Clock class="w-5 h-5 mr-2" />
              <span>{course.duration}</span>
            </div>
            <div class="flex items-center text-gray-600">
              <Award class="w-5 h-5 mr-2" />
              <span>{course.level}</span>
            </div>
            <div class="flex items-center text-gray-600">
              <Star class="w-5 h-5 mr-2 text-yellow-400 fill-current" />
              <span>4.8</span>
            </div>
          </div>

          <!-- CTA Buttons -->
          <div class="flex flex-col sm:flex-row gap-4">
            <Button
              variant="default"
              size="lg"
              class="bg-red-600 hover:bg-red-700 text-lg px-8 py-3"
              on:click={goToContact}
            >
              Solicitar Aula Experimental
            </Button>
            <Button variant="outline" size="lg" class="text-lg px-8 py-3">
              Ver Currículo Completo
            </Button>
          </div>
        </div>

        <!-- Course Card -->
        <div class="lg:justify-self-end">
          <Card class="p-8 max-w-md">
            <div class="text-center mb-6">
              <div class="text-4xl mb-4">🎓</div>
              <h3 class="text-2xl font-bold text-gray-900 mb-2">
                {course.name}
              </h3>
              <p class="text-gray-600">{course.short_description}</p>
            </div>

            <!-- Pricing -->
            <div class="text-center mb-6">
              <div class="flex items-center justify-center gap-3 mb-2">
                <span class="text-3xl font-bold text-red-600"
                  >{course.price}</span
                >
              </div>
              <p class="text-sm text-gray-500">Preço mensal</p>
            </div>

            <!-- Features -->
            {#if course.features && course.features.length > 0}
              <div class="mb-6">
                <h4 class="font-semibold text-gray-900 mb-3">
                  O que está incluído:
                </h4>
                <ul class="space-y-2">
                  {#each course.features as feature}
                    <li class="flex items-start">
                      <Check
                        class="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                      />
                      <span class="text-sm text-gray-600">{feature}</span>
                    </li>
                  {/each}
                </ul>
              </div>
            {/if}

            <!-- CTA -->
            <Button
              on:click={goToContact}
              class="w-full bg-red-600 hover:bg-red-700"
            >
              Começar Agora
            </Button>
          </Card>
        </div>
      </div>
    </div>
  </section>
{/if}

<!-- Instructor Section -->
<section class="py-16 bg-white">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-12">
      <h2 class="text-3xl font-bold text-gray-900 mb-4">
        Conheça seu Professor
      </h2>
    </div>

    <div class="max-w-2xl mx-auto">
      <Card class="p-8">
        <div class="flex items-center space-x-6">
          <img
            src={course.instructor.avatar}
            alt={`Foto de ${course.instructor.name}`}
            class="w-20 h-20 rounded-full object-cover"
          />
          <div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">
              {course.instructor.name}
            </h3>
            <p class="text-gray-600 leading-relaxed">
              {course.instructor.bio}
            </p>
          </div>
        </div>
      </Card>
    </div>
  </div>
</section>

<!-- Curriculum Section -->
<section class="py-16 bg-gray-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-12">
      <h2 class="text-3xl font-bold text-gray-900 mb-4">
        O que você vai aprender
      </h2>
      <p class="text-lg text-gray-600 max-w-2xl mx-auto">
        Um currículo estruturado e progressivo para garantir seu sucesso no
        aprendizado
      </p>
    </div>

    <div class="max-w-4xl mx-auto">
      <Card class="p-8">
        <div class="space-y-6">
          {#each course.curriculum as module, moduleIndex}
            <div class="border-b border-gray-200 pb-6 last:border-b-0">
              <h3
                class="text-lg font-semibold text-gray-900 mb-4 flex items-center"
              >
                <span
                  class="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-sm font-bold mr-3"
                >
                  {moduleIndex + 1}
                </span>
                {module.module}
              </h3>

              <div class="space-y-3 ml-11">
                {#each module.lessons as lesson, lessonIndex}
                  <div
                    class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div class="flex items-center">
                      {#if lesson.type === "video"}
                        <Video class="w-4 h-4 text-red-500 mr-3" />
                      {:else if lesson.type === "exercise"}
                        <FileText class="w-4 h-4 text-blue-500 mr-3" />
                      {:else}
                        <BookOpen class="w-4 h-4 text-green-500 mr-3" />
                      {/if}
                      <span class="text-gray-700">{lesson.title}</span>
                    </div>
                    <span class="text-sm text-gray-500">{lesson.duration}</span>
                  </div>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      </Card>
    </div>
  </div>
</section>

<!-- What You'll Get Section -->
<section class="py-16 bg-white">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-12">
      <h2 class="text-3xl font-bold text-gray-900 mb-4">O que está incluído</h2>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div class="text-center">
        <div
          class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <Video class="w-8 h-8 text-red-600" />
        </div>
        <h3 class="text-xl font-semibold text-gray-900 mb-3">+50 Vídeos HD</h3>
        <p class="text-gray-600">
          Aulas em vídeo de alta qualidade, gravadas por professores nativos
        </p>
      </div>

      <div class="text-center">
        <div
          class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <FileText class="w-8 h-8 text-red-600" />
        </div>
        <h3 class="text-xl font-semibold text-gray-900 mb-3">
          Material Complementar
        </h3>
        <p class="text-gray-600">
          Exercícios, apostilas e recursos extras para reforçar o aprendizado
        </p>
      </div>

      <div class="text-center">
        <div
          class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <Award class="w-8 h-8 text-red-600" />
        </div>
        <h3 class="text-xl font-semibold text-gray-900 mb-3">Certificado</h3>
        <p class="text-gray-600">
          Certificado de conclusão reconhecido para seu currículo
        </p>
      </div>
    </div>
  </div>
</section>

<!-- Final CTA Section -->
<section class="py-20 bg-red-600">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
    <h2 class="text-3xl font-bold text-white mb-6">
      Pronto para começar sua jornada?
    </h2>
    <p class="text-xl text-red-100 mb-8">
      Junte-se a milhares de alunos que já transformaram seu aprendizado com a
      BigStepLabs
    </p>

    <div class="flex flex-col sm:flex-row gap-4 justify-center">
      <Button
        variant="secondary"
        size="lg"
        class="bg-white text-red-600 hover:bg-gray-100 text-lg px-8 py-3"
        on:click={enrollCourse}
      >
        Matricular-se Agora
      </Button>
      <Button
        variant="outline"
        size="lg"
        class="border-white text-white hover:bg-white hover:text-red-600 text-lg px-8 py-3"
      >
        <a href="/cursos">Ver Outros Cursos</a>
      </Button>
    </div>
  </div>
</section>
