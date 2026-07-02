<script setup lang="ts">
defineProps<{
  pre: number;
  post: number;
  lgi: number;
}>();
</script>

<template>
  <div class="flex items-center gap-4 h-12">
    <!-- Bars Container -->
    <div class="flex items-end gap-1 h-full w-32 bg-slate-100 rounded-sm p-1 overflow-hidden">
      <!-- Pre-test Bar (Gray) -->
      <div 
        class="w-2 bg-slate-400 rounded-t-sm transition-all duration-500" 
        :style="{ height: `${pre}%` }" 
        :title="`Pre: ${pre}`"
      ></div>
      <!-- Post-test Bar (Blue) -->
      <div 
        class="w-2 bg-blue-500 rounded-t-sm transition-all duration-500" 
        :style="{ height: `${post}%` }" 
        :title="`Post: ${post}`"
      ></div>
      <!-- LGI Bar (Green) - Normalized 0.0-1.0 to 0-100% height -->
      <div 
        class="w-2 bg-emerald-500 rounded-t-sm transition-all duration-500" 
        :style="{ height: `${lgi * 100}%` }" 
        :title="`LGI: ${lgi}`"
      ></div>
    </div>

    <!-- Value Labels -->
    <div class="flex flex-col text-[10px] font-medium text-slate-600 leading-tight">
      <div class="flex gap-2">
        <span class="flex items-center gap-1"><span class="w-1.5 h-1.5 bg-slate-400 rounded-full"></span> {{ pre }}</span>
        <span class="flex items-center gap-1"><span class="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> {{ post }}</span>
      </div>
      <div class="flex items-center gap-1 text-emerald-600 font-bold">
        <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> LGI: {{ lgi.toFixed(2) }}
      </div>
    </div>
  </div>
</template>
