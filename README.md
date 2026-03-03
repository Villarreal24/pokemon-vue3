# Pokémon Vue 3 - Battle Arena

A modern and interactive Pokémon application built with **Vue 3**, **Vite**, and **Tailwind CSS**. This project features a robust turn-based battle system, advanced damage mechanics, and a premium responsive design.

## 🚀 Key Features

### ⚔️ Advanced Battle Arena
- **Turn-Based Combat**: Pokémon take turns based on their `Speed` stat.
- **Intelligent Damage Algorithm**:
  - Base stats (Attack vs Defense) calculation.
  - **Type Effectiveness**: Multipliers based on elemental advantages/disadvantages.
  - **Critical Hits**: 15% chance for massive damage.
  - **Random Variance**: +/- 20% modifier for unpredictable outcomes.
- **Dynamic HP Bars**: Real-time health tracking with color-coded alerts (Green > Yellow > Red).
- **Combat Log**: Detailed history of attacks, damage, and move names with directional arrows.

### 🎨 Premium UI/UX
- **Glassmorphism Aesthetic**: Modern translucent cards with backdrop blur effects.
- **Dynamic Gradients**: UI colors that adapt based on the Pokémon's primary type.
- **Smooth Animations**: Powered by Vue transitions and custom Tailwind keyframes for zooming, sliding, and shaking effects.

### 📱 Responsive Design
- **Mobile Optimized**: Custom 2-column grid layout for battles on small screens.
- **Elastic Search Bar**: Adapts its layout to ensure usability on any device.
- **Touch Friendly**: Large action buttons and scrollable logs designed for mobile interaction.

### 🔍 Discovery & Filtering
- **Real-time Search**: Find any Pokémon by its name.
- **Elemental Filters**: Browse Pokémon by categories (Grass, Fire, Water, etc.).
- **Infinite Loading**: "Load More" pagination system to explore the vast Pokémon world.

## 🛠️ Technology Stack
- **Framework**: [Vue 3](https://vuejs.org/) (Script Setup)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **API**: [PokeAPI](https://pokeapi.co/)

## ⚙️ Project Setup

```sh
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build
```

## 📝 Recent Improvements
- **English Localization**: The entire codebase, including comments and UI labels, has been translated to English for a professional standard.
- **Purge Fixes**: Optimized Tailwind class usage to ensure dynamic color rendering (Emerald/Amber/Red) works perfectly across all build types.
- **Mobile Arena Layout**: Shifted from vertical stacking to a side-by-side Pokémon view on mobile for better visibility and log access.
