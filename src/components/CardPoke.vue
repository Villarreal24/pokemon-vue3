<script setup>
import { reactive, computed, watchEffect, ref } from "vue";

const props = defineProps({
  pokeName: String,
  urlApiBase: String,
  pokemonSearched: Object,
});

const pokemon = reactive({});
const description = ref("");
const color = ref("");
const stats = reactive({
  attack: 0,
  defense: 0,
  speed: 0,
});

watchEffect(() => {
  if (props.pokemonSearched) {
    pokemon.value = props.pokemonSearched;
  }
});

// ===== GET DESCRIPTION ======
watchEffect(async () => {
  if (pokemon.id !== 0) {
    try {
      const resp = await fetch(`${props.urlApiBase}characteristic/${pokemon.value.id}`);
      const result = await resp.json();

      result.descriptions.forEach((element) => {
        if (element.language.name === "en") {
          description.value = element.description;
        }
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }
});

// ===== GET TYPE OF ELEMENT ======
const getColor = computed(() => {
  let defaultColor = "bg-slate-300"; // Color default

  for (const element of pokemon.value.types) {

    switch (element.type.name) {
      case "grass":
        return "bg-teal-500";

      case "fire":
        return "bg-red-300";

      case "water":
        return "bg-cyan-500";

      case "poison":
        return "bg-steal-200";

      case "bug":
        return "bg-gray-500";

      default:
        break;
    }
  }

  return defaultColor;
});

// ===== SET STATS OF POKEMON =====
watchEffect(() => {
  pokemon.value.stats.forEach((element) => {
    switch (element.stat.name) {
      case "attack":
        stats.attack = element.base_stat;
        break;

      case "defense":
        stats.defense = element.base_stat;
        break;

      case "speed":
        stats.speed = element.base_stat;
        break;

      default:
        break;
    }
  });
});
</script>

<template>
  <div class="p-3 rounded-xl bg-gray-900 shadow-lg">
    <div :class="getColor">
      <div class="flex justify-between">
        <div class="content-name w-full">
          <p class="ml-3 uppercase font-extrabold text-lg">{{ pokemon.value.name }}</p>
        </div>
        <div class="px-2 bg-gray-900 text-white flex">
          <p class="text-tiny mt-3">HP</p>
          <p class="text-lg font-bold">{{ pokemon.value.stats[0]?.base_stat }}</p>
        </div>
      </div>

      <div class="flex justify-center">
        <img width="220px" height="260px" :src="pokemon.value.img" alt="pokemon" />
      </div>

      <div
        v-for="ability in pokemon.value.abilities"
        :key="ability"
        class="px-2 capitalize"
      >
        <p key="ability">{{ ability.ability.name }}</p>
      </div>

      <div class="p-2">
        <div class="flex flex-wrap space-x-3 text-xs">
          <p>Height {{ pokemon.value.height }}"</p>
          <p>Weight {{ pokemon.value.weight }} lbs.</p>
        </div>

        <p class="my-2 text-xs">{{ description }}</p>

        <div
          class="my-1 px-2 flex flex-wrap space-x-3 text-xs text-white bg-gray-800 rounded-full"
        >
          <p class="stats">
            Attack <span class="font-bold">{{ stats.attack }}</span>
          </p>
          <p class="stats">
            Defense <span class="font-bold">{{ stats.defense }}</span>
          </p>
          <p class="">
            Speed <span class="font-bold">{{ stats.speed }}</span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.content-name {
  border-bottom-width: 1px;
  border-color: black;
}
.stats {
  border-right-width: 2px;
  padding-right: 10px;
  border-color: aliceblue;
  border-radius: 10px;
}
</style>
