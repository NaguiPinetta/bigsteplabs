<script lang="ts">
  import { goto } from "$app/navigation";
  import Button from "$lib/components/ui/button.svelte";
  import Card from "$lib/components/ui/card.svelte";
  import { ChevronRight, Brain, Target, Users, BookOpen, Award, TrendingUp } from "lucide-svelte";
  
  function goToContact() {
    goto('/contato');
  }
</script>

<svelte:head>
  <title>Metodologia - BigStepLabs</title>
  <meta name="description" content="Conheça nossa metodologia inovadora que combina tecnologia de IA com técnicas comprovadas de ensino de idiomas." />
</svelte:head>

<!-- Hero Section -->
<section class="bg-gradient-to-br from-red-600 via-red-500 to-orange-600 text-white py-20">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
    <h1 class="text-4xl md:text-6xl font-bold mb-6 leading-tight">
      Nossa<br />
      <span class="text-yellow-300">Metodologia</span>
    </h1>
    <p class="text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed">
      Descubra como nossa abordagem única combina tecnologia de IA avançada com técnicas comprovadas para resultados excepcionais.
    </p>
  </div>
</section>

<!-- Methodology Overview -->
<section class="py-20">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-16">
      <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
        Como Funciona Nossa Metodologia
      </h2>
      <p class="text-xl text-gray-600 max-w-3xl mx-auto">
        Nossa metodologia é baseada em anos de pesquisa e experiência prática, combinando os melhores aspectos do ensino tradicional com inovações tecnológicas.
      </p>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <Card class="p-6 text-center">
        <div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Brain class="w-10 h-10 text-red-600" />
        </div>
        <h3 class="text-xl font-semibold text-gray-900 mb-3">Avaliação Personalizada</h3>
        <p class="text-gray-600">Cada estudante passa por uma avaliação completa para determinar seu nível atual e objetivos de aprendizado.</p>
      </Card>
      
      <Card class="p-6 text-center">
        <div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Target class="w-10 h-10 text-red-600" />
        </div>
        <h3 class="text-xl font-semibold text-gray-900 mb-3">Plano Individualizado</h3>
        <p class="text-gray-600">Criamos um plano de estudos personalizado que se adapta ao seu ritmo e estilo de aprendizado.</p>
      </Card>
      
      <Card class="p-6 text-center">
        <div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Users class="w-10 h-10 text-red-600" />
        </div>
        <h3 class="text-xl font-semibold text-gray-900 mb-3">Aulas Interativas</h3>
        <p class="text-gray-600">Nossas aulas são altamente interativas, com foco em conversação e uso prático do idioma.</p>
      </Card>
      
      <Card class="p-6 text-center">
        <div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <BookOpen class="w-10 h-10 text-red-600" />
        </div>
        <h3 class="text-xl font-semibold text-gray-900 mb-3">Material Adaptativo</h3>
        <p class="text-gray-600">Utilizamos material didático que se adapta ao seu progresso e necessidades específicas.</p>
      </Card>
      
      <Card class="p-6 text-center">
        <div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Award class="w-10 h-10 text-red-600" />
        </div>
        <h3 class="text-xl font-semibold text-gray-900 mb-3">Acompanhamento Contínuo</h3>
        <p class="text-gray-600">Monitoramos seu progresso constantemente e ajustamos o plano conforme necessário.</p>
      </Card>
      
      <Card class="p-6 text-center">
        <div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <TrendingUp class="w-10 h-10 text-red-600" />
        </div>
        <h3 class="text-xl font-semibold text-gray-900 mb-3">Resultados Mensuráveis</h3>
        <p class="text-gray-600">Você pode acompanhar seu progresso através de métricas claras e feedback regular.</p>
      </Card>
    </div>
  </div>
</section>

<!-- Technology Integration -->
<section class="py-20 bg-gray-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      <div>
        <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
          Tecnologia de IA Avançada
        </h2>
        <p class="text-lg text-gray-600 mb-6">
          Nossa plataforma utiliza inteligência artificial para criar uma experiência de aprendizado verdadeiramente personalizada.
        </p>
        <ul class="space-y-4">
          <li class="flex items-start">
            <div class="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center mr-3 mt-1 flex-shrink-0">
              <div class="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <span class="text-gray-700">Análise de padrões de aprendizado em tempo real</span>
          </li>
          <li class="flex items-start">
            <div class="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center mr-3 mt-1 flex-shrink-0">
              <div class="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <span class="text-gray-700">Adaptação automática do conteúdo baseada no seu progresso</span>
          </li>
          <li class="flex items-start">
            <div class="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center mr-3 mt-1 flex-shrink-0">
              <div class="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <span class="text-gray-700">Feedback instantâneo sobre pronúncia e gramática</span>
          </li>
          <li class="flex items-start">
            <div class="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center mr-3 mt-1 flex-shrink-0">
              <div class="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <span class="text-gray-700">Recomendações personalizadas de exercícios e materiais</span>
          </li>
        </ul>
      </div>
      
      <div class="bg-gradient-to-br from-red-100 to-orange-100 p-8 rounded-2xl">
        <div class="text-center">
          <div class="w-32 h-32 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Brain class="w-16 h-16 text-red-600" />
          </div>
          <h3 class="text-2xl font-bold text-gray-900 mb-4">IA Inteligente</h3>
          <p class="text-gray-700">
            Nossa tecnologia aprende com você e se adapta constantemente para maximizar seu aprendizado.
          </p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Success Stories -->
<section class="py-20">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-16">
      <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
        Histórias de Sucesso
      </h2>
      <p class="text-xl text-gray-600 max-w-2xl mx-auto">
        Veja como nossa metodologia transformou a vida de milhares de estudantes.
      </p>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <Card class="p-6">
        <div class="text-center">
          <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span class="text-2xl font-bold text-blue-600">M</span>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Maria Silva</h3>
          <p class="text-sm text-gray-500 mb-3">Estudante de Inglês</p>
          <p class="text-gray-600 text-sm">
            "Em apenas 6 meses consegui me comunicar fluentemente em inglês. A metodologia é incrível e os professores são muito atenciosos."
          </p>
        </div>
      </Card>
      
      <Card class="p-6">
        <div class="text-center">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span class="text-2xl font-bold text-green-600">J</span>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">João Santos</h3>
          <p class="text-sm text-gray-500 mb-3">Estudante de Espanhol</p>
          <p class="text-gray-600 text-sm">
            "As aulas são dinâmicas e a tecnologia de IA realmente faz diferença. Recomendo para todos que querem aprender espanhol."
          </p>
        </div>
      </Card>
      
      <Card class="p-6">
        <div class="text-center">
          <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span class="text-2xl font-bold text-purple-600">A</span>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Ana Costa</h3>
          <p class="text-sm text-gray-500 mb-3">Estudante de Francês</p>
          <p class="text-gray-600 text-sm">
            "Nunca imaginei que aprender francês seria tão divertido e eficaz. A metodologia é perfeita para adultos."
          </p>
        </div>
      </Card>
    </div>
  </div>
</section>

<!-- CTA Section -->
<section class="py-20 bg-gradient-to-r from-red-600 to-orange-600 text-white">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
    <h2 class="text-3xl md:text-4xl font-bold mb-6">
      Experimente Nossa Metodologia
    </h2>
    <p class="text-xl mb-8 max-w-2xl mx-auto">
      Agende uma aula experimental gratuita e descubra como nossa abordagem pode transformar seu aprendizado de idiomas.
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
