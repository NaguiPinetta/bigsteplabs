<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Card } from "$lib/components/ui/card";
  import { goto } from "$app/navigation";
  import type { CoursePublic } from "$lib/types/database";

  export let course: CoursePublic;

  function goToCourse() {
    goto(`/cursos/${course.slug}`);
  }
</script>

<Card class="h-full flex flex-col bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
  <div class="relative">
    <img
      src={course.hero_image_url || "/images/courses/default-hero.jpg"}
      alt={`${course.name} course`}
      class="w-full h-48 object-cover rounded-t-lg"
    />
    <div class="absolute top-4 right-4">
      <span class="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
        {course.level}
      </span>
    </div>
  </div>
  
  <div class="p-6 flex-1 flex flex-col">
    <!-- Flag and Course Name -->
    <div class="flex items-center mb-3">
      {#if course.flag_image_url}
        <img
          src={course.flag_image_url}
          alt={`${course.name} flag`}
          class="w-8 h-8 rounded-full mr-3 object-cover"
        />
      {/if}
      <h3 class="text-xl font-bold text-gray-900">{course.name}</h3>
    </div>
    
    <p class="text-gray-600 mb-4 flex-1">{course.short_description}</p>
    
    <!-- Features -->
    <div class="mb-4">
      <h4 class="font-semibold text-gray-800 mb-2">Destaques:</h4>
      <ul class="space-y-1">
        {#each course.features?.slice(0, 3) as feature}
          <li class="text-sm text-gray-600 flex items-center">
            <span class="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
            {feature}
          </li>
        {/each}
      </ul>
    </div>
    
    <!-- Course Info -->
    <div class="space-y-2 mb-6 text-sm text-gray-600">
      <div class="flex justify-between">
        <span>Duração:</span>
        <span class="font-medium">{course.duration}</span>
      </div>
      <div class="flex justify-between">
        <span>Preço:</span>
        <span class="font-medium text-green-600">{course.price}</span>
      </div>
    </div>
    
    <!-- CTA Button -->
    <Button 
      on:click={goToCourse}
      class="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-105"
    >
      {course.cta_text || "Ver Detalhes"}
    </Button>
  </div>
</Card>



