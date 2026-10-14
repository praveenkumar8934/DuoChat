export interface ThemeOption {
  id: string;
  name: string;
  description: string;
  bgPreview: string;
  dotColor: string;
  isLive: boolean;
}

export const CHAT_THEMES: ThemeOption[] = [
  // 🌟 Live & Animated Themes
  {
    id: 'aurora-live',
    name: 'Aurora Borealis',
    description: 'Dynamic flowing northern lights & radiant neon aura',
    bgPreview: 'bg-gradient-to-br from-[#0f172a] via-[#312e81] to-[#064e3b]',
    dotColor: 'bg-cyan-400',
    isLive: true,
  },
  {
    id: 'sakura-live',
    name: 'Sakura Bloom',
    description: 'Animated gentle pastel blush with drifting light petals',
    bgPreview: 'bg-gradient-to-br from-[#fff1f2] via-[#ffe4e6] to-[#fce7f3] dark:from-[#2a0b18] dark:to-[#4c0f2b]',
    dotColor: 'bg-rose-400',
    isLive: true,
  },
  {
    id: 'cosmic-live',
    name: 'Cosmic Galaxy',
    description: 'Deep starlight galaxy with floating nebula dust',
    bgPreview: 'bg-gradient-to-br from-[#06070d] via-[#1b1c3a] to-[#090a14]',
    dotColor: 'bg-purple-400',
    isLive: true,
  },
  {
    id: 'cyber-live',
    name: 'Cyber Neon',
    description: 'Modern pulsing synthwave magenta & cyan grid',
    bgPreview: 'bg-gradient-to-br from-[#080816] via-[#1a0b2e] to-[#041d2d]',
    dotColor: 'bg-pink-500',
    isLive: true,
  },
  {
    id: 'ocean-live',
    name: 'Ocean Waves',
    description: 'Deep aquamarine & sapphire moving oceanic breeze',
    bgPreview: 'bg-gradient-to-br from-[#091a28] via-[#155e75] to-[#042f2e]',
    dotColor: 'bg-teal-400',
    isLive: true,
  },
  {
    id: 'golden-live',
    name: 'Golden Sunset',
    description: 'Warm flowing amber sunlight & romantic peach twilight',
    bgPreview: 'bg-gradient-to-br from-[#fffbeb] via-[#ffedd5] to-[#fecdd3] dark:from-[#2b1103] dark:to-[#581c87]',
    dotColor: 'bg-amber-400',
    isLive: true,
  },
  {
    id: 'emerald-live',
    name: 'Emerald Breeze',
    description: 'Enchanted botanical mint & fresh sage flowing aura',
    bgPreview: 'bg-gradient-to-br from-[#ecfdf5] via-[#a7f3d0] to-[#ccfbf1] dark:from-[#022c22] dark:to-[#065f46]',
    dotColor: 'bg-emerald-400',
    isLive: true,
  },
  {
    id: 'lavender-live',
    name: 'Lavender Mist',
    description: 'Dreamy soft violet & lilac calming breathing aura',
    bgPreview: 'bg-gradient-to-br from-[#faf5ff] via-[#ede9fe] to-[#f5f3ff] dark:from-[#2e1065] dark:to-[#240a34]',
    dotColor: 'bg-violet-400',
    isLive: true,
  },

  // 🎨 Classic Aesthetic Themes
  {
    id: 'romantic',
    name: 'Romantic Rose',
    description: 'Subtle blush tone with delicate dotted pattern',
    bgPreview: 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800',
    dotColor: 'bg-rose-500',
    isLive: false,
  },
  {
    id: 'midnight',
    name: 'Midnight Star',
    description: 'Deep cosmic gradient with navy starlight',
    bgPreview: 'bg-gradient-to-b from-[#1e1b4b] to-[#020617] border-indigo-500/50',
    dotColor: 'bg-indigo-400',
    isLive: false,
  },
  {
    id: 'doodle',
    name: 'Classic Doodle',
    description: 'WhatsApp-style textured warm paper aesthetic',
    bgPreview: 'bg-[#efeae2] dark:bg-[#0b141a] border-amber-300 dark:border-slate-700',
    dotColor: 'bg-amber-600',
    isLive: false,
  },
  {
    id: 'minimal',
    name: 'Pure Minimal',
    description: 'Clean, distraction-free neutral slate canvas',
    bgPreview: 'bg-muted/40 border-border',
    dotColor: 'bg-slate-400',
    isLive: false,
  },
  {
    id: 'dark',
    name: 'OLED Pure Dark',
    description: 'Deep contrast inky black with fine mesh',
    bgPreview: 'bg-black border-zinc-800',
    dotColor: 'bg-zinc-500',
    isLive: false,
  },
  {
    id: 'sunset',
    name: 'Sunset Glow',
    description: 'Gentle warm peach & amber static gradient',
    bgPreview: 'bg-gradient-to-tr from-amber-500/10 via-rose-500/10 to-purple-500/10 border-orange-300 dark:border-orange-800',
    dotColor: 'bg-orange-500',
    isLive: false,
  },
];

