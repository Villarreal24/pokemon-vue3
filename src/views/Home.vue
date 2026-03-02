<script setup>
import { ref, reactive, onMounted } from "vue";
import CardPoke from "@/components/CardPoke.vue";
import BattleArena from "@/components/BattleArena.vue";

const urlApiBase = "https://pokeapi.co/api/v2/";

const pokemons = ref([]);
const inputName = ref("");

// Pagination and Filter State
const pokemonTypes = ref([]);
const selectedType = ref("");
const currentOffset = ref(0);
const limit = 24;
const allFilteredPokemons = ref([]);
const isLoading = ref(false);
const hasMore = ref(true);

// Main displayed pokemon
const pokemon = reactive({
  name: "",
  id: 0,
  height: 0,
  weight: 0,
  img: "",
  stats: [],
  types: [],
  abilities: [],
});

// Battle state
const isBattleMode = ref(false);
const opponentPokemon = ref(null);

onMounted(async () => {
  await fetchTypes();
  await loadPokemons(true);
});

const fetchTypes = async () => {
  try {
    const resp = await fetch(`${urlApiBase}type`);
    const result = await resp.json();
    pokemonTypes.value = result.results.filter(t => t.name !== "unknown" && t.name !== "shadow");
  } catch (err) {
    console.error("Error fetching types", err);
  }
};

const loadPokemons = async (isInitial = false) => {
  if (isLoading.value) return;
  isLoading.value = true;

  if (isInitial) {
    currentOffset.value = 0;
    pokemons.value = [];
    hasMore.value = true;
  }

  try {
    if (selectedType.value === "") {
      // Normal pagination handling
      const resp = await fetch(`${urlApiBase}pokemon?offset=${currentOffset.value}&limit=${limit}`);
      const result = await resp.json();
      
      if (result.results.length < limit) hasMore.value = false;
      
      pokemons.value = [...pokemons.value, ...result.results];
      currentOffset.value += limit;
      
    } else {
      // Filtered pagination handling (local slicing because PokeAPI returns all of a type at once)
      if (isInitial) {
        const resp = await fetch(`${urlApiBase}type/${selectedType.value}`);
        const result = await resp.json();
        // Extract the pokemon object
        allFilteredPokemons.value = result.pokemon.map(p => p.pokemon);
      }
      
      const slice = allFilteredPokemons.value.slice(currentOffset.value, currentOffset.value + limit);
      pokemons.value = [...pokemons.value, ...slice];
      
      currentOffset.value += limit;
      if (currentOffset.value >= allFilteredPokemons.value.length) {
        hasMore.value = false;
      }
    }
  } catch (err) {
    console.error("Error loading pokemons", err);
  } finally {
    isLoading.value = false;
  }
};

const onTypeChange = () => {
  loadPokemons(true);
};

const fetchPokemonData = async (name) => {
  try {
    const resp = await fetch(`${urlApiBase}pokemon/${name}`);
    if (!resp.ok) throw new Error("Pokemon not found");
    return await resp.json();
  } catch (err) {
    alert(err.message);
    return null;
  }
};

// Search single pokemon for the main card
const searchPoke = async () => {
  if (!inputName.value) return;
  
  const nameToSearch = inputName.value.toLowerCase().trim();
  const info = await fetchPokemonData(nameToSearch);
  
  if (info) {
    Object.assign(pokemon, info);
    pokemon.img = info.sprites.front_default;
  }
};

// Handle clicking a pokemon from the popular list
const handlePokemonSelect = async (pokeName) => {
  if (isBattleMode.value) {
    // We are in battle mode! Let's fetch the opponent
    const info = await fetchPokemonData(pokeName);
    if (info) {
      opponentPokemon.value = info;
    }
  } else {
    // Normal mode: auto search and update card
    inputName.value = pokeName;
    await searchPoke();
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

const toggleBattleMode = () => {
  isBattleMode.value = !isBattleMode.value;
};

const endBattle = () => {
  isBattleMode.value = false;
  opponentPokemon.value = null;
};

// Helper: Extract ID from URL for small sprites
const getPokemonIdFromUrl = (url) => {
  const parts = url.split('/');
  return parts[parts.length - 2];
};

</script>

<template>
  <div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 bg-slate-100 min-h-screen relative">
    
    <!-- SEARCH BAR -->
    <div class="flex justify-center mb-10">
      <form @submit.prevent="searchPoke" class="w-full max-w-md bg-white rounded-3xl sm:rounded-full shadow-lg p-2 flex flex-col sm:flex-row items-center gap-3 sm:gap-0 transition-all focus-within:ring-4 focus-within:ring-indigo-300">
        <div class="flex items-center w-full sm:w-auto flex-1 bg-slate-50 sm:bg-transparent rounded-full px-2 sm:px-0">
          <div class="px-3 sm:px-4 text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            id="name"
            type="text"
            placeholder="Search for a Pokémon by name..."
            v-model="inputName"
            class="flex-1 p-2 sm:p-2 bg-transparent outline-none text-slate-700 font-semibold placeholder-slate-400 w-full"
          />
        </div>
        <button
          type="submit"
          class="w-full sm:w-auto sm:ml-2 px-6 py-2.5 sm:py-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 font-bold text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all text-center"
        >
          Search
        </button>
      </form>
    </div>

    <!-- MAIN CARD -->
    <Transition name="fade-slide">
      <div v-if="pokemon.name !== ''" class="my-8 flex justify-center perspective-1000">
        <CardPoke 
          :pokeName="pokemon.name" 
          :urlApiBase="urlApiBase" 
          :pokemonSearched="pokemon" 
          :isBattleMode="isBattleMode"
          @toggle-battle="toggleBattleMode"
        />
      </div>
    </Transition>

    <!-- INSTRUCTIONS / STATUS -->
    <Transition name="fade">
        <div v-if="isBattleMode" class="text-center mb-6 md:mb-8 animate-pulse text-red-500 font-black text-lg sm:text-xl md:text-2xl uppercase tracking-widest px-4">
            Select an opponent from the list below!
        </div>
    </Transition>

    <!-- POKEMON LIST WITH FILTER & PAGINATION -->
    <div class="mt-16">
      
      <!-- HEADER AND FILTER -->
      <div class="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60">
        <div class="flex items-center gap-3 w-full sm:w-auto">
          <h3 class="font-black text-2xl text-slate-800 uppercase tracking-wide">
            {{ selectedType ? `${selectedType} Type Pokémon` : "Popular Pokémon" }}
          </h3>
        </div>
        
        <div class="flex items-center gap-2 w-full sm:w-auto">
           <label for="typeFilter" class="text-sm font-bold text-slate-500 uppercase tracking-wider">Category:</label>
           <select 
              id="typeFilter" 
              v-model="selectedType" 
              @change="onTypeChange"
              class="bg-slate-50 border-2 border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:w-48 p-2 font-semibold capitalize shadow-inner transition-all hover:border-slate-300"
           >
              <option value="">All Elements</option>
              <option v-for="type in pokemonTypes" :key="type.name" :value="type.name" class="capitalize font-medium">
                {{ type.name }}
              </option>
           </select>
        </div>
      </div>
      
      <!-- POKEMON GRID -->
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <TransitionGroup name="list">
          <button 
            v-for="poke in pokemons" 
            :key="poke.name"
            @click="handlePokemonSelect(poke.name)"
            :class="[
              'group relative flex flex-col items-center justify-center p-4 rounded-2xl bg-white shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden border-2',
              isBattleMode ? 'border-red-200 hover:border-red-400' : 'border-transparent hover:border-indigo-200'
            ]"
          >
            <!-- Background Decoration -->
            <div class="absolute -bottom-4 -right-4 w-20 h-20 bg-slate-100 rounded-full group-hover:bg-indigo-50 transition-colors duration-300"></div>
            
            <img 
              :src="`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${getPokemonIdFromUrl(poke.url)}.png`" 
              class="w-20 h-20 object-contain relative z-10 drop-shadow-md group-hover:scale-125 transition-transform duration-300" 
              :alt="poke.name"
              loading="lazy"
            />
            <p class="capitalize font-bold text-slate-700 mt-2 relative z-10 group-hover:text-indigo-600 transition-colors truncate w-full text-center">{{ poke.name }}</p>
          </button>
        </TransitionGroup>
      </div>
      
      <!-- LOAD MORE BUTTON -->
      <div v-if="hasMore" class="mt-12 flex justify-center pb-8">
        <button 
          @click="loadPokemons(false)"
          :disabled="isLoading"
          class="group relative inline-flex items-center justify-center px-8 py-3 font-black uppercase tracking-wider text-sm text-white transition-all duration-200 bg-indigo-600 rounded-full hover:bg-indigo-500 shadow-[0_5px_15px_rgba(79,70,229,0.4)] hover:shadow-[0_8px_25px_rgba(79,70,229,0.5)] hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          <span v-if="isLoading" class="flex items-center gap-2">
             <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
             Loading...
          </span>
          <span v-else>Load more</span>
        </button>
      </div>

    </div>

    <!-- BATTLE ARENA MODAL -->
    <Transition name="modal">
      <BattleArena 
        v-if="opponentPokemon" 
        :pokemon1="pokemon" 
        :pokemon2="opponentPokemon" 
        @close-battle="endBattle"
      />
    </Transition>

  </div>
</template>

<style scoped>
/* Vue transitions */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.list-enter-active,
.list-leave-active {
  transition: all 0.4s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(30px);
}
.list-leave-active {
  position: absolute;
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(1.1);
  backdrop-filter: blur(0px);
}

.perspective-1000 {
  perspective: 1000px;
}
</style>
