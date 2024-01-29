<script setup>
import { RouterLink, RouterView } from "vue-router";
import Home from "./views/Home.vue";
</script>

<template>
  <header>
    <div class="bg-slate-700 p-5">
      <nav class="text-white flex">
        <div class="w-full">
          <p class="text-center font-semibold text-xl">Search of pokemon cards</p>
        </div>
      </nav>
    </div>
  </header>

  <div class="container-2xl m-5 p-5 bg-slate-200 rounded-lg">
    <RouterView />
  </div>
</template>

<style scoped></style>
