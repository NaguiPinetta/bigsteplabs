<script lang="ts">
  import Card from "$lib/components/ui/card.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import { Mail, Linkedin, Globe } from "lucide-svelte";

  // Team data
  const team = [
    {
      name: "Nagui Pinetta",
      role: "Founder, Director, Content Manager",
      bio: "Fundador, diretor e gerente de conteúdo da BigStepLabs, com vasta experiência em educação e tecnologia. Lidera a visão estratégica da empresa, o desenvolvimento de metodologias inovadoras de ensino de idiomas e a gestão de todo o conteúdo educacional.",
      image: "/images/team/nagui-pinetta.svg?v=1",
      social: {
        linkedin: "https://linkedin.com/in/nagui-pinetta",
        email: "nagui@bigsteplabs.xyz",
      },
    },
    {
      name: "Rodrigo",
      role: "Course Coordinator",
      bio: "Coordenador de cursos responsável pelo planejamento, desenvolvimento e implementação de todos os programas de idiomas. Garante a qualidade e eficácia de cada curso oferecido.",
      image: "/images/team/rodrigo.svg?v=1",
      social: {
        linkedin: "https://linkedin.com/in/rodrigo-bigsteplabs",
        email: "rodrigo@bigsteplabs.xyz",
      },
    },
    {
      name: "Michele",
      role: "German Course Admin",
      bio: "Administradora especializada no curso de alemão, com profundo conhecimento da língua e cultura germânica. Coordena todo o conteúdo e metodologia específica para o aprendizado do alemão.",
      image: "/images/team/michele.svg?v=1",
      social: {
        linkedin: "https://linkedin.com/in/michele-bigsteplabs",
        email: "michele@bigsteplabs.xyz",
      },
    },
    {
      name: "Riccelli",
      role: "Pedagogical Coordinator",
      bio: "Coordenador pedagógico especializado em metodologias de ensino inovadoras. Responsável por desenvolver e implementar estratégias educacionais que maximizam o aprendizado dos alunos, integrando tecnologia e práticas pedagógicas comprovadas para criar experiências de ensino excepcionais.",
      image: "/images/team/riccelli.svg?v=1",
      social: {
        linkedin: "https://linkedin.com/in/riccelli-bigsteplabs",
        email: "riccelli@bigsteplabs.xyz",
      },
    },
  ];
</script>

<svelte:head>
  <title>Nossa Equipe - BigStepLabs</title>
  <meta
    name="description"
    content="Conheça nossa equipe de especialistas em educação e tecnologia que está revolucionando o aprendizado de idiomas."
  />
  <meta property="og:title" content="Nossa Equipe - BigStepLabs" />
  <meta
    property="og:description"
    content="Conheça nossa equipe de especialistas em educação e tecnologia que está revolucionando o aprendizado de idiomas."
  />
</svelte:head>

<!-- Hero Section -->
<section class="bg-gradient-to-br from-red-50 to-white py-20">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
    <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
      Nossa Equipe
    </h1>
    <p class="text-xl text-gray-600 max-w-3xl mx-auto">
      Especialistas apaixonados por educação e tecnologia, trabalhando juntos
      para transformar o aprendizado de idiomas através da inovação e da IA.
    </p>
  </div>
</section>

<!-- Team Section -->
<section class="py-20 bg-white">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-16">
      <h2 class="text-3xl font-bold text-gray-900 mb-4">
        Conheça os Especialistas
      </h2>
      <p class="text-lg text-gray-600 max-w-2xl mx-auto">
        Nossa equipe combina expertise em educação, tecnologia e inovação para
        criar a melhor experiência de aprendizado possível.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {#each team as member}
        <Card
          class="text-center p-6 hover:shadow-lg transition-shadow duration-300"
        >
          <div class="mb-4">
            <img
              src={member.image}
              alt={`Foto de ${member.name}`}
              class="w-32 h-32 rounded-full mx-auto object-cover border-4 border-red-100"
            />
          </div>

          <h3 class="text-xl font-semibold text-gray-900 mb-2">
            {member.name}
          </h3>

          <p class="text-red-600 font-medium mb-3">
            {member.role}
          </p>

          <p class="text-gray-600 text-sm mb-4 leading-relaxed">
            {member.bio}
          </p>

          <div class="flex justify-center space-x-3">
            <a
              href={`mailto:${member.social.email}`}
              class="text-gray-400 hover:text-red-500 transition-colors"
              title="Email"
            >
              <Mail class="w-5 h-5" />
            </a>
            <a
              href={member.social.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              class="text-gray-400 hover:text-red-500 transition-colors"
              title="LinkedIn"
            >
              <Linkedin class="w-5 h-5" />
            </a>
            <a
              href="https://www.google.com"
              target="_blank"
              rel="noopener noreferrer"
              class="text-gray-400 hover:text-red-500 transition-colors"
              title="Website"
            >
              <Globe class="w-5 h-5" />
            </a>
          </div>
        </Card>
      {/each}
    </div>
  </div>
</section>

<!-- Values Section -->
<section class="py-20 bg-gray-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-16">
      <h2 class="text-3xl font-bold text-gray-900 mb-4">Nossos Valores</h2>
      <p class="text-lg text-gray-600 max-w-2xl mx-auto">
        Os princípios que guiam nosso trabalho e nossa missão de transformar a
        educação.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div class="text-center">
        <div
          class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <span class="text-2xl">🎯</span>
        </div>
        <h3 class="text-xl font-semibold text-gray-900 mb-3">
          Inovação Constante
        </h3>
        <p class="text-gray-600">
          Sempre buscamos novas formas de melhorar a experiência de aprendizado
          através da tecnologia mais avançada.
        </p>
      </div>

      <div class="text-center">
        <div
          class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <span class="text-2xl">🤝</span>
        </div>
        <h3 class="text-xl font-semibold text-gray-900 mb-3">Colaboração</h3>
        <p class="text-gray-600">
          Trabalhamos em equipe, compartilhando conhecimento e experiências para
          alcançar resultados excepcionais.
        </p>
      </div>

      <div class="text-center">
        <div
          class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <span class="text-2xl">💡</span>
        </div>
        <h3 class="text-xl font-semibold text-gray-900 mb-3">Excelência</h3>
        <p class="text-gray-600">
          Comprometidos com a qualidade em tudo que fazemos, desde o
          desenvolvimento até o suporte ao usuário.
        </p>
      </div>
    </div>
  </div>
</section>

<!-- CTA Section -->
<section class="py-20 bg-red-600">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
    <h2 class="text-3xl font-bold text-white mb-6">Junte-se à Nossa Equipe</h2>
    <p class="text-xl text-red-100 mb-8">
      Estamos sempre procurando por talentos apaixonados por educação e
      tecnologia.
    </p>
    <div class="flex flex-col sm:flex-row gap-4 justify-center">
      <Button
        variant="secondary"
        size="lg"
        class="bg-white text-red-600 hover:bg-gray-100"
      >
        Ver Vagas Abertas
      </Button>
      <Button
        variant="outline"
        size="lg"
        class="border-white text-white hover:bg-white hover:text-red-600"
      >
        Enviar Currículo
      </Button>
    </div>
  </div>
</section>
