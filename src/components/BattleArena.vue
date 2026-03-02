<script setup>
import { ref, watch, computed, nextTick } from "vue";

const props = defineProps({
  pokemon1: Object,
  pokemon2: Object,
});

const emit = defineEmits(["close-battle"]);

const battleState = ref("intro"); // intro, fighting, result
const winner = ref(null);
const timer = ref(3);

// --- BATTLE STATE ---
const battleLog = ref([]);
const logContainer = ref(null);

const p1 = ref({ ...props.pokemon1 });
const p2 = ref({ ...props.pokemon2 });

// Multiply base HP by 5 for longer battles
const getStat = (poke, statName) => poke?.stats?.find(s => s.stat.name === statName)?.base_stat || 50;
const p1MaxHp = ref(getStat(p1.value, "hp") * 5);
const p2MaxHp = ref(getStat(p2.value, "hp") * 5);
const p1Hp = ref(p1MaxHp.value);
const p2Hp = ref(p2MaxHp.value);

let battleInterval = null;
const turnValue = ref(0);

// Simple Type Chart snippet to allow underdog wins (Multiplier logic)
const typeChart = {
  normal: { weakTo: ["fighting"], resists: [], immuneTo: ["ghost"] },
  fire: { weakTo: ["water", "ground", "rock"], resists: ["fire", "grass", "ice", "bug", "steel", "fairy"], immuneTo: [] },
  water: { weakTo: ["electric", "grass"], resists: ["fire", "water", "ice", "steel"], immuneTo: [] },
  electric: { weakTo: ["ground"], resists: ["electric", "flying", "steel"], immuneTo: [] },
  grass: { weakTo: ["fire", "ice", "poison", "flying", "bug"], resists: ["water", "electric", "grass", "ground"], immuneTo: [] },
  ice: { weakTo: ["fire", "fighting", "rock", "steel"], resists: ["ice"], immuneTo: [] },
  fighting: { weakTo: ["flying", "psychic", "fairy"], resists: ["bug", "rock", "dark"], immuneTo: [] },
  poison: { weakTo: ["ground", "psychic"], resists: ["grass", "fighting", "poison", "bug", "fairy"], immuneTo: [] },
  ground: { weakTo: ["water", "grass", "ice"], resists: ["poison", "rock"], immuneTo: ["electric"] },
  flying: { weakTo: ["electric", "ice", "rock"], resists: ["grass", "fighting", "bug"], immuneTo: ["ground"] },
  psychic: { weakTo: ["bug", "ghost", "dark"], resists: ["fighting", "psychic"], immuneTo: [] },
  bug: { weakTo: ["fire", "flying", "rock"], resists: ["grass", "fighting", "ground"], immuneTo: [] },
  rock: { weakTo: ["water", "grass", "fighting", "ground", "steel"], resists: ["normal", "fire", "poison", "flying"], immuneTo: [] },
  ghost: { weakTo: ["ghost", "dark"], resists: ["poison", "bug"], immuneTo: ["normal", "fighting"] },
  dragon: { weakTo: ["ice", "dragon", "fairy"], resists: ["fire", "water", "electric", "grass"], immuneTo: [] },
  dark: { weakTo: ["fighting", "bug", "fairy"], resists: ["ghost", "dark"], immuneTo: ["psychic"] },
  steel: { weakTo: ["fire", "fighting", "ground"], resists: ["normal", "grass", "ice", "flying", "psychic", "bug", "rock", "dragon", "steel", "fairy"], immuneTo: ["poison"] },
  fairy: { weakTo: ["poison", "steel"], resists: ["fighting", "bug", "dark"], immuneTo: ["dragon"] },
};

const getTypeEffectiveness = (attackerTypes, defenderTypes) => {
  let multiplier = 1;
  // Use the attacker's primary type for the attack calculation
  const attackType = attackerTypes[0]?.type?.name || "normal";
  
  defenderTypes.forEach(def => {
    const defType = def.type.name;
    const chart = typeChart[defType];
    if (chart) {
      if (chart.weakTo.includes(attackType)) multiplier *= 2;
      if (chart.resists.includes(attackType)) multiplier *= 0.5;
      if (chart.immuneTo.includes(attackType)) multiplier *= 0;
    }
  });
  return multiplier;
};

const appendLog = (msg, isCritical = false, isEffective = false, isResisted = false, isP1 = false) => {
  battleLog.value.push({
    id: Date.now() + Math.random(),
    text: msg,
    isCritical,
    isEffective,
    isResisted,
    isP1
  });
  
  // Auto-scroll log
  nextTick(() => {
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight;
    }
  });
};

const executeTurn = (attacker, defender, attackerHp, defenderHp, isAttackerP1) => {
  if (attackerHp.value <= 0 || defenderHp.value <= 0) return;

  // 1. Pick a random move
  const moves = attacker.moves || [];
  const moveName = moves.length > 0 
    ? moves[Math.floor(Math.random() * Math.min(moves.length, 20))].move.name.replace('-', ' ') 
    : "basic attack";

  // 2. Base Damage Calculation: (Attack / Defense) * 25 (Increased damage multiplier for faster battles)
  const atkStat = getStat(attacker, "attack");
  const defStat = getStat(defender, "defense");
  let baseDamage = (atkStat / defStat) * 25; 

  // 3. Type Effectiveness
  const typeMult = getTypeEffectiveness(attacker.types || [], defender.types || []);
  baseDamage *= typeMult;

  // 4. Random Variance (± 20%) & Critical Hit (15% chance)
  const randVariance = (Math.random() * 0.4) + 0.8; // 0.8 to 1.2
  baseDamage *= randVariance;

  let isCrit = false;
  if (Math.random() < 0.15) { // 15% Crit
    baseDamage *= 1.5;
    isCrit = true;
  }

  // Ensure minimum 1 damage if not immune
  let finalDamage = Math.max(typeMult === 0 ? 0 : 1, Math.round(baseDamage));
  
  // Apply Damage
  defenderHp.value = Math.max(0, defenderHp.value - finalDamage);

  // Formatting Log message
  let effectivenessStr = "";
  if (typeMult >= 2) effectivenessStr = " Super effective!";
  else if (typeMult > 0 && typeMult < 1) effectivenessStr = " Not very effective...";
  else if (typeMult === 0) effectivenessStr = " No effect!";
  
  let critStr = isCrit ? " Critical hit!" : "";

  // Arrows pointing from the attacker towards the defender
  const arrow = isAttackerP1 ? "▶️" : "◀️";

  appendLog(
    `${arrow} ${attacker.name.toUpperCase()} ➔ ${defender.name.toUpperCase()} used ${moveName.toUpperCase()}. (-${finalDamage} HP)${critStr}${effectivenessStr}`,
    isCrit,
    typeMult >= 2,
    typeMult > 0 && typeMult < 1,
    isAttackerP1
  );

  // Check Win condition
  if (defenderHp.value <= 0) {
    clearInterval(battleInterval);
    winner.value = attacker;
    battleState.value = "result";
    appendLog(`${defender.name.toUpperCase()} fainted!`, false, false, false, isAttackerP1);
    appendLog(`${attacker.name.toUpperCase()} HAS WON! 🏆`, false, false, false, true); // Visual highlight
  }
};

const startBattleLogic = () => {
  battleState.value = "fighting";
  appendLog(`The battle between ${p1.value.name.toUpperCase()} and ${p2.value.name.toUpperCase()} begins!`, false, false, false, true);
  
  const speed1 = getStat(p1.value, "speed");
  const speed2 = getStat(p2.value, "speed");

  turnValue.value = speed1 >= speed2 ? 0 : 1; // 0 = p1 attacks, 1 = p2 attacks

  battleInterval = setInterval(() => {
    if (turnValue.value === 0) {
      executeTurn(p1.value, p2.value, p1Hp, p2Hp, true);
      turnValue.value = 1;
    } else {
      executeTurn(p2.value, p1.value, p2Hp, p1Hp, false);
      turnValue.value = 0;
    }
  }, 2000); // Slow: 2 seconds
};

// Starts when components mount
watch(() => props.pokemon2, (newVal) => {
  if (newVal && newVal.name) {
    battleState.value = "intro";
    const countdown = setInterval(() => {
      timer.value--;
      if (timer.value === 0) {
        clearInterval(countdown);
        startBattleLogic();
      }
    }, 1000);
  }
}, { immediate: true });

const closeBattle = () => {
  if (battleInterval) clearInterval(battleInterval);
  emit("close-battle");
};

// Helper function so image displays correctly
const getImg = (poke) => {
   if (poke?.sprites?.other?.['official-artwork']?.front_default) {
        return poke.sprites.other['official-artwork'].front_default;
    }
    // Handle right facing sprite for pokemon 1 if available, else default
    return poke?.img || poke?.sprites?.front_default;
};

// Computed percentage for HP Bars
const p1HpPercent = computed(() => (Math.max(0, p1Hp.value) / p1MaxHp.value) * 100);
const p2HpPercent = computed(() => (Math.max(0, p2Hp.value) / p2MaxHp.value) * 100);

</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in p-2 md:p-4 overflow-y-auto custom-scrollbar pt-8 pb-8">
    <!-- Close Button -->
    <button @click="closeBattle" class="absolute top-2 right-2 md:top-6 md:right-6 z-50 text-white/50 hover:text-white hover:bg-white/10 rounded-full p-2 transition-all">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 md:h-10 md:w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>

    <div class="relative w-full max-w-6xl min-h-[signup] md:min-h-[600px] flex flex-col justify-between items-center text-white p-2 sm:p-4 md:p-8">
      
      <!-- INTRO COUNTDOWN OVERLAY -->
      <div v-if="battleState === 'intro'" class="absolute inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm rounded-3xl">
         <h2 class="text-7xl font-extrabold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500 animate-zoom-in drop-shadow-[0_0_20px_rgba(255,0,0,0.8)]">
          {{ timer }}
         </h2>
      </div>

      <!-- ------------- BATTLE ARENA LAYOUT ------------- -->
      <div class="grid grid-cols-2 md:flex md:flex-row justify-between items-stretch gap-2 md:gap-8 w-full relative z-10 h-full mt-4 md:mt-4 flex-1">
        
        <!-- POKEMON 1 -->
        <div class="col-span-1 flex flex-col items-center flex-1 justify-center transition-all duration-300"
             :class="{'opacity-50 grayscale': battleState === 'result' && winner !== p1}">
          
          <!-- HP BAR -->
          <div class="w-full max-w-xs mb-2 md:mb-4 bg-gray-900/80 backdrop-blur rounded-xl p-2 md:p-3 border-2 border-slate-700 shadow-lg relative z-20">
             <div class="flex justify-between items-end mb-1">
                <h3 class="font-black uppercase text-xs md:text-xl truncate pr-1 md:pr-2">{{ p1.name }}</h3>
                <span class="text-[9px] md:text-xs font-bold text-slate-400">Lv.{{ getStat(p1, "speed") }}</span>
             </div>
             <div class="w-full h-3 md:h-4 bg-slate-800 rounded-full border border-slate-600 overflow-hidden relative">
               <div class="h-full transition-all duration-300 ease-out" 
                    :class="{
                      'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]': p1HpPercent > 50,
                      'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]': p1HpPercent <= 50 && p1HpPercent > 20,
                      'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]': p1HpPercent <= 20
                    }" 
                    :style="{ width: `${p1HpPercent}%` }"></div>
             </div>
             <div class="text-right mt-1 text-[9px] md:text-xs font-bold font-mono text-slate-300">
                {{ Math.ceil(Math.max(0, p1Hp)) }} / {{ p1MaxHp }} HP
             </div>
          </div>

          <!-- SPRITE -->
          <div class="relative w-32 h-32 md:w-64 md:h-64 flex justify-center items-center mt-auto md:mt-0">
             <div class="absolute bottom-2 md:bottom-4 w-3/4 h-3 md:h-6 bg-black/60 blur-md rounded-[100%]"></div>
             <img :src="getImg(p1)" class="relative w-full h-full object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)] transition-transform" 
                  :class="{'animate-shake scale-110 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]': turnValue === 0 && battleState === 'fighting'}" alt="p1" />
          </div>
        </div>


        <!-- COMBAT LOG (CENTER) -->
        <div class="col-span-2 order-last md:order-none flex-1 flex flex-col justify-between bg-gray-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-3 md:p-4 shadow-2xl h-[45vh] sm:h-[50vh] md:h-96 w-full max-h-[60vh] z-20 overflow-hidden relative mt-4 md:mt-0">
           <div class="text-center font-black text-slate-500 uppercase tracking-widest text-[9px] md:text-xs mb-2 md:mb-3 border-b border-slate-700 pb-1 md:pb-2 z-10 bg-gray-900/40 shrink-0">Combat Log</div>
           
           <div ref="logContainer" class="flex-1 overflow-y-auto space-y-2 md:space-y-3 pr-1 md:pr-2 custom-scrollbar flex flex-col justify-start pb-2 md:pb-4">
              <div v-for="log in battleLog" :key="log.id" 
                   class="text-[11px] md:text-sm font-semibold p-2 md:p-3 rounded-lg leading-snug animate-slide-up shadow-sm border-l-2 md:border-l-4 shrink-0 transition-all border-r-2 md:border-r-4"
                   :class="{
                     'bg-blue-900/30 text-blue-200 border-l-blue-500 border-r-transparent': !log.isCritical && !log.isEffective && !log.isResisted && log.isP1,
                     'bg-indigo-900/30 text-indigo-200 border-r-indigo-500 border-l-transparent text-right': !log.isCritical && !log.isEffective && !log.isResisted && !log.isP1,
                     
                     'bg-red-900/40 text-red-100 border-l-red-500 border-r-transparent text-xs md:text-base shadow-[0_0_10px_rgba(239,68,68,0.3)]': log.isCritical && log.isP1,
                     'bg-red-900/40 text-red-100 border-r-red-500 border-l-transparent text-xs md:text-base shadow-[0_0_10px_rgba(239,68,68,0.3)] text-right': log.isCritical && !log.isP1,
                     
                     'bg-green-900/30 text-green-200 border-l-green-500 border-r-transparent': log.isEffective && !log.isCritical && log.isP1,
                     'bg-green-900/30 text-green-200 border-r-green-500 border-l-transparent text-right': log.isEffective && !log.isCritical && !log.isP1,
                     
                     'bg-slate-800 text-slate-400 border-l-slate-600 border-r-transparent': log.isResisted && log.isP1,
                     'bg-slate-800 text-slate-400 border-r-slate-600 border-l-transparent text-right': log.isResisted && !log.isP1
                   }">
                {{ log.text }}
              </div>

              <!-- RESULT ACTIONS REPLACES FULL OVERLAY -->
              <div v-if="battleState === 'result'" class="mt-2 md:mt-4 flex flex-col items-center animate-slide-up bg-slate-800/80 rounded-xl p-3 md:p-4 border border-indigo-500/50">
                 <h2 class="text-xs sm:text-sm md:text-xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 mb-3 md:mb-4 text-center">
                    {{ winner?.name === "Draw! It's a tie!" ? winner?.name : `${winner?.name} HAS WON!` }}
                 </h2>
                 <button @click="closeBattle" class="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-bold py-2 px-6 md:px-8 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 uppercase tracking-wide text-[10px] md:text-sm w-full">
                    Finish Battle
                 </button>
              </div>

           </div>
           
           <div class="absolute bottom-0 left-0 right-0 h-6 md:h-8 bg-gradient-to-t from-gray-900/80 to-transparent pointer-events-none"></div>
        </div>


        <!-- POKEMON 2 -->
        <div class="col-span-1 flex flex-col items-center flex-1 justify-center transition-all duration-300"
             :class="{'opacity-50 grayscale': battleState === 'result' && winner !== p2}">
          
          <!-- HP BAR -->
          <div class="w-full max-w-xs mb-2 md:mb-4 bg-gray-900/80 backdrop-blur rounded-xl p-2 md:p-3 border-2 border-slate-700 shadow-lg relative z-20">
             <div class="flex justify-between items-end mb-1">
                <h3 class="font-black uppercase text-xs md:text-xl truncate pr-1 md:pr-2">{{ p2.name }}</h3>
                <span class="text-[9px] md:text-xs font-bold text-slate-400">Lv.{{ getStat(p2, "speed") }}</span>
             </div>
             <div class="w-full h-3 md:h-4 bg-slate-800 rounded-full border border-slate-600 overflow-hidden relative">
               <div class="h-full transition-all duration-300 ease-out" 
                    :class="{
                      'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]': p2HpPercent > 50,
                      'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]': p2HpPercent <= 50 && p2HpPercent > 20,
                      'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]': p2HpPercent <= 20
                    }" 
                    :style="{ width: `${p2HpPercent}%` }"></div>
             </div>
             <div class="text-right mt-1 text-[9px] md:text-xs font-bold font-mono text-slate-300">
                {{ Math.ceil(Math.max(0, p2Hp)) }} / {{ p2MaxHp }} HP
             </div>
          </div>

          <!-- SPRITE (Mirrored so they face each other) -->
          <div class="relative w-32 h-32 md:w-64 md:h-64 flex justify-center items-center mt-auto md:mt-0">
             <div class="absolute bottom-2 md:bottom-4 w-3/4 h-3 md:h-6 bg-black/60 blur-md rounded-[100%]"></div>
             <img :src="getImg(p2)" class="relative w-full h-full object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)] transition-transform -scale-x-100" 
                  :class="{'animate-shake scale-110 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]': turnValue === 1 && battleState === 'fighting'}" alt="p2" />
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.5); 
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(71, 85, 105, 0.8); 
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 1); 
}
</style>
