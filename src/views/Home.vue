<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import CardPoke from "@/components/CardPoke.vue";

const urlApiBase = "https://pokeapi.co/api/v2/";
const pokemons = ref([]);
const inputName = ref("");

const pokemon = reactive({
  name: "",
  id: 0,
  height: 0,
  weight: 0,
  img: "",
  stats: {},
  special: [],
  attack: 0,
  defense: 0,
  speed: 0,
});

onMounted(() => {
  getData();
});

const getData = () => {
  inputName.value = inputName.value.toLowerCase();
  fetch(`${urlApiBase}pokemon/`)
    .then((resp) => resp.json())
    .then((result) => {
      if (result.results) {
        pokemons.value = result.results;
      } else {
        throw console.error("API error");
      }
    })
    .catch((err) => {
      console.log(err);
      alert(err);
    });
};

// ===== SEARCH SINGLE POKEMON REQUEST API ======
const searchPoke = () => {
  fetch(`${urlApiBase}pokemon/${inputName.value.toLowerCase()}`)
    .then((resp) => resp.json())
    .then((result) => {
      if (result.id) {
        Object.assign(pokemon, result);
        pokemon.img = result.sprites.front_default;
        // statsPoke();
        // abilitiesPoke(result.abilities);
      } else {
        throw console.error("API error");
      }
    })
    .catch((err) => {
      console.log(err);
      alert("Pokemon no encontrado");
    });
};
</script>

<template>
  <div>
    <div class="flex justify-center mb-5">
      <form @submit.prevent="searchPoke">
        <div class="my-4">
          <label for="name" class="text-search font-bold text-xl"
            >Search a card pokemon</label
          >
        </div>
        <input
          id="name"
          type="text"
          placeholder="Nombre del pokemon"
          v-model="inputName"
          class="p-1 w-60 h-9 input focus: outline-none bg-slate-500 rounded-md text-white font-semibold"
        />
        <button
          type="submit"
          class="ml-2 px-4 h-9 rounded-md bg-orange-400 hover:bg-orange-600 hover:text-white"
        >
          Search
        </button>
      </form>
    </div>

    <div v-if="pokemon.name !== '' " class="my-2 p-2 flex justify-center">
      <CardPoke :pokeName="inputName.toLowerCase()" :urlApiBase="urlApiBase" :pokemonSearched="pokemon" />
    </div>

    <div>
      <p class="mb-3 font-bold text-xl">List of popular pokemons</p>
      <div class="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-6 gap-6">
        <div v-for="pokemon in pokemons" :key="pokemon.name">
          <div class="p-5 rounded-md bg-gray-100 shadow-md">
            <p class="capitalize">{{ pokemon.name }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
