<script setup>
import { reactive, computed, watchEffect, ref } from "vue";

const props = defineProps({
  pokeName: String,
  urlApiBase: String,
  pokemonSearched: Object,
  isBattleMode: Boolean,
});

const emit = defineEmits(["toggle-battle"]);

const pokemon = reactive({});
const description = ref("");
const stats = reactive({
  hp: 0,
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
  if (pokemon.id !== 0 && pokemon.value?.id) {
    try {
      const resp = await fetch(`${props.urlApiBase}characteristic/${pokemon.value.id}`);
      if (!resp.ok) {
         description.value = "A mysterious Pokémon.";
         return;
      }
      const result = await resp.json();

      let foundDesc = "";
      result.descriptions.forEach((element) => {
        if (element.language.name === "en") {
          foundDesc = element.description;
        }
      });
      description.value = foundDesc || "A mysterious Pokémon.";
    } catch (error) {
      console.error("Error fetching data:", error);
      description.value = "A mysterious Pokémon.";
    }
  }
});

// ===== GET TYPE OF ELEMENT ======
const getGradients = computed(() => {
  let defaultGradient = "from-slate-400 to-slate-600"; // Default color

  if (!pokemon.value?.types) return defaultGradient;

  for (const element of pokemon.value.types) {
    switch (element.type.name) {
      case "grass":
        return "from-teal-400 to-emerald-600";
      case "fire":
        return "from-red-400 to-orange-600";
      case "water":
        return "from-cyan-400 to-blue-600";
      case "poison":
        return "from-purple-400 to-indigo-600";
      case "bug":
        return "from-lime-400 to-green-700";
      case "electric":
        return "from-yellow-300 to-yellow-600";
      case "ground":
        return "from-amber-600 to-yellow-800";
      case "fairy":
        return "from-pink-300 to-rose-500";
      case "normal":
        return "from-gray-300 to-gray-500";
      default:
        break;
    }
  }

  return defaultGradient;
});

// ===== SET STATS OF POKEMON =====
watchEffect(() => {
  if (pokemon.value?.stats) {
    pokemon.value.stats.forEach((element) => {
      switch (element.stat.name) {
        case "hp":
          stats.hp = element.base_stat;
          break;
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
  }
});

const getImg = computed(() => {
    if (pokemon.value?.sprites?.other?.['official-artwork']?.front_default) {
        return pokemon.value.sprites.other['official-artwork'].front_default;
    }
    return pokemon.value?.img;
});

</script>

<template>
  <div class="flex flex-col items-center">
    <!-- POKEMON CARD -->
    <div class="relative w-80 max-w-[95vw] rounded-2xl p-1 bg-gradient-to-br from-white/20 to-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-md overflow-hidden transition-all duration-300 hover:shadow-[0_8px_40px_rgba(0,0,0,0.2)] hover:-translate-y-1">
      <div :class="['w-full h-full rounded-xl bg-gradient-to-br p-4 flex flex-col', getGradients]">
        
        <!-- HEADER -->
        <div class="flex justify-between items-center mb-2">
          <div class="flex items-center gap-2">
            <h2 class="uppercase font-black text-2xl text-white drop-shadow-md tracking-wider">{{ pokemon.value?.name }}</h2>
          </div>
          <div class="flex items-center bg-black/20 rounded-full px-3 py-1 shadow-inner backdrop-blur-sm">
            <span class="text-xs font-bold text-yellow-300 mr-1">HP</span>
            <span class="text-lg font-black text-white">{{ stats.hp }}</span>
          </div>
        </div>

        <!-- IMAGE -->
        <div class="relative flex justify-center py-6 h-56 items-center">
           <div class="absolute inset-0 bg-white/20 rounded-full blur-2xl top-4 scale-75"></div>
           <img class="relative w-48 h-48 object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] z-10 hover:scale-110 transition-transform duration-300" :src="getImg" alt="pokemon" loading="lazy" />
        </div>

        <!-- DETAILS CONTAINER -->
        <div class="bg-white/90 backdrop-blur-md rounded-xl p-4 mt-auto shadow-lg relative z-20">
          
          <!-- TYPES / ABILITIES -->
          <div class="flex flex-wrap gap-2 mb-3 justify-center">
            <span v-for="ability in pokemon.value?.abilities" :key="ability.ability.name" 
                  class="px-3 py-1 bg-slate-100 text-slate-700 text-[10px] font-bold uppercase rounded-full tracking-wider shadow-sm border border-slate-200">
              {{ ability.ability.name }}
            </span>
          </div>

          <!-- PHYSICAL TRAITS -->
          <div class="flex justify-center space-x-6 text-[11px] font-semibold text-slate-500 mb-3 bg-slate-50 py-2 rounded-lg">
            <div class="flex flex-col items-center">
                <span class="text-slate-400 text-[9px] uppercase tracking-wider">Weight</span>
                <span>{{ (pokemon.value?.weight / 10).toFixed(1) }} kg</span>
            </div>
            <div class="w-px h-6 bg-slate-200"></div>
            <div class="flex flex-col items-center">
                <span class="text-slate-400 text-[9px] uppercase tracking-wider">Height</span>
                <span>{{ (pokemon.value?.height / 10).toFixed(1) }} m</span>
            </div>
          </div>

          <!-- DESCRIPTION -->
          <p class="text-xs text-center text-slate-600 mb-4 h-8 overflow-hidden line-clamp-2 italic">
            "{{ description }}"
          </p>

          <!-- STATS PROGRESS BARS -->
          <div class="space-y-2">
            <div class="flex items-center text-xs">
              <span class="w-16 font-bold text-slate-600 text-[10px] uppercase">Attack</span>
              <div class="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden mx-2">
                <div class="h-full bg-red-400 rounded-full" :style="{ width: `${Math.min(stats.attack, 100)}%` }"></div>
              </div>
              <span class="w-6 text-right font-black text-slate-700">{{ stats.attack }}</span>
            </div>
            <div class="flex items-center text-xs">
              <span class="w-16 font-bold text-slate-600 text-[10px] uppercase">Defense</span>
              <div class="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden mx-2">
                <div class="h-full bg-cyan-500 rounded-full" :style="{ width: `${Math.min(stats.defense, 100)}%` }"></div>
              </div>
              <span class="w-6 text-right font-black text-slate-700">{{ stats.defense }}</span>
            </div>
            <div class="flex items-center text-xs">
              <span class="w-16 font-bold text-slate-600 text-[10px] uppercase">Speed</span>
              <div class="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden mx-2">
                <div class="h-full bg-amber-400 rounded-full" :style="{ width: `${Math.min(stats.speed, 100)}%` }"></div>
              </div>
              <span class="w-6 text-right font-black text-slate-700">{{ stats.speed }}</span>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- BATTLE BUTTON -->
    <button 
      @click="emit('toggle-battle')"
      :class="[
        'mt-6 px-6 py-3 rounded-full font-black text-sm uppercase tracking-wider transition-all duration-300 shadow-lg flex items-center gap-2 group',
        isBattleMode 
          ? 'bg-red-500 text-white shadow-red-500/50 scale-105 ring-4 ring-red-300 animate-pulse-fast' 
          : 'bg-white text-slate-800 hover:-translate-y-1 hover:shadow-xl hover:bg-slate-50 border-2 border-slate-200'
      ]"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5" :class="isBattleMode ? 'animate-bounce' : 'group-hover:rotate-12 transition-transform'">
         <path fill-rule="evenodd" d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177A7.547 7.547 0 016.648 6.61a.75.75 0 00-1.152.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248zM15.75 14.25a3.75 3.75 0 11-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 011.925-3.545 3.75 3.75 0 013.255 3.717z" clip-rule="evenodd" />
      </svg>
      {{ isBattleMode ? 'Select an opponent!' : 'Battle another Pokémon' }}
    </button>
  </div>
</template>

<style scoped>
</style>
