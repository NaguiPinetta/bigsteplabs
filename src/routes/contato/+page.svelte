<script lang="ts">
  import { goto } from "$app/navigation";
  import Button from "$lib/components/ui/button.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import Textarea from "$lib/components/ui/textarea.svelte";
  import Select from "$lib/components/ui/select.svelte";
  import Card from "$lib/components/ui/card.svelte";
  import { Mail, Phone, MapPin, Send, CheckCircle } from "lucide-svelte";
  import { enhance } from "$app/forms";

  let formData = {
    name: "",
    email: "",
    phone: "",
    interest: "",
    message: "",
  };

  let success = false;
  let error = "";

  // Handle form action result
  export let form;

  $: if (form?.success) {
    success = true;
    error = "";
    // Reset form on success
    formData = {
      name: "",
      email: "",
      phone: "",
      interest: "",
      message: "",
    };
    // Reset success message after 5 seconds
    setTimeout(() => {
      success = false;
    }, 5000);
  }

  $: if (form?.error) {
    error = form.error;
    success = false;
    // Restore form values on error
    if (form.values && typeof form.values === 'object') {
      formData = { ...formData, ...form.values };
    }
  }

  const interests = [
    { label: "Inglês", value: "ingles" },
    { label: "Espanhol", value: "espanhol" },
    { label: "Francês", value: "frances" },
    { label: "Outro idioma", value: "outro" },
    { label: "Informações gerais", value: "geral" },
  ];

  function goToCourses() {
    goto("/cursos");
  }
</script>

<svelte:head>
  <title>Contato - BigStepLabs</title>
  <meta
    name="description"
    content="Entre em contato conosco para mais informações sobre nossos cursos de idiomas ou para agendar uma aula experimental."
  />
</svelte:head>

<!-- Hero Section -->
<section
  class="bg-gradient-to-br from-red-600 via-red-500 to-orange-600 text-white py-20"
>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
    <h1 class="text-4xl md:text-6xl font-bold mb-6 leading-tight">
      Entre em<br />
      <span class="text-yellow-300">Contato</span>
    </h1>
    <p class="text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed">
      Estamos aqui para ajudar você a encontrar o curso perfeito e começar sua
      jornada de aprendizado de idiomas.
    </p>
  </div>
</section>

<!-- Contact Form Section -->
<section class="py-20">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <!-- Contact Form -->
      <div>
        <h2 class="text-3xl font-bold text-gray-900 mb-6">
          Envie sua mensagem
        </h2>
        <p class="text-lg text-gray-600 mb-8">
          Preencha o formulário abaixo e nossa equipe entrará em contato em até
          24 horas.
        </p>

        {#if success}
          <Card class="p-6 bg-green-50 border-green-200 mb-6">
            <div class="flex items-center">
              <CheckCircle class="w-6 h-6 text-green-600 mr-3" />
              <div>
                <h3 class="text-lg font-semibold text-green-800">
                  Mensagem enviada com sucesso!
                </h3>
                <p class="text-green-700">Entraremos em contato em breve.</p>
              </div>
            </div>
          </Card>
        {/if}

        {#if error}
          <Card class="p-6 bg-red-50 border-red-200 mb-6">
            <div class="flex items-center">
              <div class="w-6 h-6 text-red-600 mr-3">⚠️</div>
              <div>
                <h3 class="text-lg font-semibold text-red-800">
                  Erro ao enviar mensagem
                </h3>
                <p class="text-red-700">{error}</p>
              </div>
            </div>
          </Card>
        {/if}

        <form method="POST" use:enhance class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                for="name"
                class="block text-sm font-medium text-gray-700 mb-2"
              >
                Nome completo *
              </label>
              <Input
                id="name"
                name="name"
                bind:value={formData.name}
                placeholder="Seu nome completo"
                required
              />
            </div>

            <div>
              <label
                for="email"
                class="block text-sm font-medium text-gray-700 mb-2"
              >
                Email *
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                bind:value={formData.email}
                placeholder="seu@email.com"
                required
              />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                for="phone"
                class="block text-sm font-medium text-gray-700 mb-2"
              >
                Telefone
              </label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                bind:value={formData.phone}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <label
                for="interest"
                class="block text-sm font-medium text-gray-700 mb-2"
              >
                Interesse *
              </label>
              <Select
                id="interest"
                name="interest"
                bind:value={formData.interest}
                options={interests}
                placeholder="Selecione seu interesse"
                required
              />
            </div>
          </div>

          <div>
            <label
              for="message"
              class="block text-sm font-medium text-gray-700 mb-2"
            >
              Mensagem
            </label>
            <Textarea
              id="message"
              name="message"
              bind:value={formData.message}
              placeholder="Conte-nos mais sobre seus objetivos de aprendizado..."
              rows={4}
            />
          </div>

          <Button
            type="submit"
            class="w-full bg-red-600 hover:bg-red-700"
          >
            <Send class="mr-2 h-5 w-5" />
            Enviar mensagem
          </Button>
        </form>
      </div>

      <!-- Contact Information -->
      <div class="lg:pl-8">
        <h2 class="text-3xl font-bold text-gray-900 mb-6">
          Informações de contato
        </h2>
        <p class="text-lg text-gray-600 mb-8">
          Você também pode nos contatar diretamente através dos canais abaixo.
        </p>

        <div class="space-y-6">
          <div class="flex items-start">
            <div
              class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0"
            >
              <Mail class="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900 mb-1">Email</h3>
              <p class="text-gray-600">contato@bigsteplabs.xyz</p>
              <p class="text-sm text-gray-500">Resposta em até 24 horas</p>
            </div>
          </div>

          <div class="flex items-start">
            <div
              class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0"
            >
              <Phone class="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900 mb-1">Telefone</h3>
              <p class="text-gray-600">+55 (11) 99999-9999</p>
              <p class="text-sm text-gray-500">Segunda a sexta, 9h às 18h</p>
            </div>
          </div>

          <div class="flex items-start">
            <div
              class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0"
            >
              <MapPin class="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900 mb-1">Endereço</h3>
              <p class="text-gray-600">Rua das Flores, 123</p>
              <p class="text-gray-600">Vila Madalena, São Paulo - SP</p>
              <p class="text-sm text-gray-500">CEP: 01234-567</p>
            </div>
          </div>
        </div>

        <div class="mt-8 p-6 bg-gray-50 rounded-lg">
          <h3 class="text-lg font-semibold text-gray-900 mb-3">
            Aula experimental gratuita
          </h3>
          <p class="text-gray-600 mb-4">
            Experimente nossa metodologia sem compromisso. Agende uma aula
            experimental gratuita e descubra como podemos transformar seu
            aprendizado.
          </p>
          <Button on:click={goToCourses} variant="outline" class="w-full">
            Ver cursos disponíveis
          </Button>
        </div>
      </div>
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
        Respostas para as dúvidas mais comuns sobre nossos cursos e metodologia.
      </p>
    </div>

    <div class="space-y-6">
      <Card class="p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-3">
          Como funciona a aula experimental?
        </h3>
        <p class="text-gray-600">
          A aula experimental é gratuita e tem duração de 45 minutos. Durante a
          aula, você conhecerá nossa metodologia, fará uma avaliação de nível e
          terá uma experiência prática de aprendizado.
        </p>
      </Card>

      <Card class="p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-3">
          Quais são as opções de horário?
        </h3>
        <p class="text-gray-600">
          Oferecemos aulas em diferentes horários, incluindo manhã, tarde e
          noite. Também temos opções para fins de semana. Entre em contato para
          verificar a disponibilidade no horário desejado.
        </p>
      </Card>

      <Card class="p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-3">
          Posso cancelar ou remarcar aulas?
        </h3>
        <p class="text-gray-600">
          Sim! Permitimos o cancelamento ou remarcação de aulas com até 24 horas
          de antecedência. Isso garante que possamos reorganizar nossa agenda
          adequadamente.
        </p>
      </Card>
    </div>
  </div>
</section>
