<script lang="ts">
  export let title: string;
  export let benefit: string;
  export let href: string;
  export let badges: string[] = [];
</script>

<article
  class="rounded-xl2 bg-surface p-5 shadow-soft hover:shadow-lift transition-all duration-300"
>
  <div class="mb-3 flex flex-wrap gap-2">
    {#each badges as badge}
      <span
        class="rounded-full bg-info/10 text-info text-xs px-2.5 py-1 font-medium"
        >{badge}</span
      >
    {/each}
  </div>
  <h3 class="text-lg font-semibold text-textHi mb-2">{title}</h3>
  <p class="text-sm text-textLo mb-4 leading-relaxed">{benefit}</p>
  <a
    href={href}
    class="inline-flex items-center text-brand font-semibold hover:text-brandHover transition-colors group"
  >
    Ver programa
    <span class="ml-1 group-hover:translate-x-1 transition-transform">→</span>
  </a>
</article>
