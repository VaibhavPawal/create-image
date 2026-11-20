import type {
  AspectRatio,
  ExploreCategory,
  ExploreItem,
  StylePreset,
} from '../types';

export const STYLE_PRESETS: Array<{ value: StylePreset; hint: string }> = [
  { value: 'Realistic Photography', hint: 'Natural optics & medium-format detail' },
  { value: '3D Render', hint: 'Sculpted geometry & physically based light' },
  { value: 'Anime', hint: 'Feature-film cel shading & vibrant atmosphere' },
  { value: 'Cyberpunk', hint: 'Rain-slicked neon & futuristic depth' },
  { value: 'Digital Art', hint: 'Contemporary brushwork & color harmony' },
  { value: 'Cartoon', hint: 'Bold silhouettes & expressive stylized color' },
  { value: 'Fantasy', hint: 'Epic matte painting & luminous realms' },
  { value: 'Cinematic', hint: 'Anamorphic lighting & filmic color grade' },
  { value: 'Watercolor', hint: 'Translucent washes on cold-pressed paper' },
];

export const ASPECT_RATIO_OPTIONS: Array<{
  value: AspectRatio;
  label: string;
  shortLabel: string;
  cssClass: string;
}> = [
  { value: '1:1', label: '1:1 Square', shortLabel: '1:1', cssClass: 'aspect-square' },
  { value: '16:9', label: '16:9 Landscape', shortLabel: '16:9', cssClass: 'aspect-video' },
  { value: '9:16', label: '9:16 Portrait', shortLabel: '9:16', cssClass: 'aspect-[9/16]' },
  { value: '4:3', label: '4:3', shortLabel: '4:3', cssClass: 'aspect-[4/3]' },
  { value: '3:4', label: '3:4', shortLabel: '3:4', cssClass: 'aspect-[3/4]' },
];

export function getAspectRatioCssClass(ratio: AspectRatio): string {
  return ASPECT_RATIO_OPTIONS.find((item) => item.value === ratio)?.cssClass ?? 'aspect-square';
}

export const EXPLORE_CATEGORIES: ExploreCategory[] = [
  'Nature',
  'Architecture',
  'Cars',
  'Fantasy',
  'Portraits',
  'Space',
  'Animals',
  'Technology',
];

export const HERO_SHOWCASE_ITEMS: Array<{
  id: string;
  title: string;
  style: StylePreset;
  aspectRatio: AspectRatio;
  prompt: string;
  imageUrl: string;
}> = [
  {
    id: 'hero-prism',
    title: 'Obsidian Prism Monolith',
    style: '3D Render',
    aspectRatio: '4:3',
    prompt:
      'Iridescent dark obsidian and frosted crystal geometric monolith levitating above a mirror floor with electric violet and cyan volumetric rim lighting',
    imageUrl: '/src/assets/images/hero_prism_sculpture_1795144746603.jpg',
  },
  {
    id: 'hero-orbital',
    title: 'Helios Orbital Ring',
    style: 'Cinematic',
    aspectRatio: '16:9',
    prompt:
      'Massive orbital ring station silhouetted against a sapphire, violet, and cyan planetary nebula above a ringed gas giant',
    imageUrl: '/src/assets/images/explore_space_1795144747276.jpg',
  },
  {
    id: 'hero-museum',
    title: 'Basalt Pavilion at Dusk',
    style: 'Realistic Photography',
    aspectRatio: '4:3',
    prompt:
      'Cantilevered dark basalt and frameless glass contemporary museum hovering over a serene black reflecting pool at blue hour',
    imageUrl: '/src/assets/images/explore_architecture_1795144746497.jpg',
  },
];

export const EXPLORE_SAMPLES: ExploreItem[] = [
  {
    id: 'sample-nature-01',
    title: 'Glacial Aurora Valley',
    category: 'Nature',
    style: 'Realistic Photography',
    aspectRatio: '4:3',
    prompt:
      'Dramatic alpine valley at twilight with misty pine ridges, dark volcanic basalt cliffs, and a glacial river reflecting teal aurora light',
    imageUrl: '/src/assets/images/explore_nature_1795144747668.jpg',
    source: 'sample',
  },
  {
    id: 'sample-architecture-01',
    title: 'Cantilevered Glass Museum',
    category: 'Architecture',
    style: 'Realistic Photography',
    aspectRatio: '4:3',
    prompt:
      'Cantilevered brutalist dark basalt and frameless glass contemporary art museum hovering over a calm black reflecting pool at twilight',
    imageUrl: '/src/assets/images/explore_architecture_1795144746497.jpg',
    source: 'sample',
  },
  {
    id: 'sample-cars-01',
    title: 'Nocturne Electric Hypercar',
    category: 'Cars',
    style: 'Cyberpunk',
    aspectRatio: '16:9',
    prompt:
      'Matte-black electric concept hypercar parked inside a minimalist concrete tunnel with rain-slicked floor and overhead cyan linear reflections',
    imageUrl: '/src/assets/images/explore_cars_1795144749179.jpg',
    source: 'sample',
  },
  {
    id: 'sample-fantasy-01',
    title: 'Citadel Above the Silver Sea',
    category: 'Fantasy',
    style: 'Fantasy',
    aspectRatio: '3:4',
    prompt:
      'Ancient ivory and obsidian spire citadel perched on floating crystalline cliffs above a sea of silver clouds with cascading mist waterfalls',
    imageUrl: '/src/assets/images/explore_fantasy_1795144748002.jpg',
    source: 'sample',
  },
  {
    id: 'sample-portraits-01',
    title: 'Prismatic Rim Portrait',
    category: 'Portraits',
    style: 'Cinematic',
    aspectRatio: '3:4',
    prompt:
      'High-fashion editorial studio portrait wearing a sculptural dark silver collar, crisp sapphire blue and lavender rim lighting with prismatic glass refraction',
    imageUrl: '/src/assets/images/explore_portraits_1795144745073.jpg',
    source: 'sample',
  },
  {
    id: 'sample-space-01',
    title: 'Nebula Orbital Ring',
    category: 'Space',
    style: 'Cinematic',
    aspectRatio: '16:9',
    prompt:
      'Massive sleek orbital ring station silhouetted against a luminous sapphire, violet, and cyan planetary nebula and ringed gas giant horizon',
    imageUrl: '/src/assets/images/explore_space_1795144747276.jpg',
    source: 'sample',
  },
  {
    id: 'sample-animals-01',
    title: 'Moonlit Ridge Snow Leopard',
    category: 'Animals',
    style: 'Realistic Photography',
    aspectRatio: '4:3',
    prompt:
      'Majestic snow leopard resting on a frost-dusted dark slate mountain ridge at blue hour dusk, soft drifting snow backlit by crisp moonlight',
    imageUrl: '/src/assets/images/explore_animals_1795144747964.jpg',
    source: 'sample',
  },
  {
    id: 'sample-technology-01',
    title: 'Sapphire Photonic Core',
    category: 'Technology',
    style: '3D Render',
    aspectRatio: '4:3',
    prompt:
      'Precision macro photograph of a transparent sapphire-glass photonic quantum processor suspended inside brushed anodized titanium with cyan optical waveguides',
    imageUrl: '/src/assets/images/explore_technology_1795144748653.jpg',
    source: 'sample',
  },
];

export const RANDOM_PROMPTS: Array<{ prompt: string; style: StylePreset }> = [
  {
    prompt:
      'A translucent glass lighthouse standing on jagged obsidian sea stacks during a bioluminescent midnight storm, electric cyan wave crests and soft mist',
    style: 'Cinematic',
  },
  {
    prompt:
      'An ultra-clean ceramic and brushed titanium lunar rover parked along the rim of a sunlit crater with Earth rising in the deep starfield behind it',
    style: '3D Render',
  },
  {
    prompt:
      'A quiet rain-washed Kyoto alleyway at dusk illuminated by soft indigo paper lanterns reflected in wet cobblestones and floating cherry petals',
    style: 'Anime',
  },
  {
    prompt:
      'Architectural interior of a futuristic botanical conservatory beneath a geodesic glass dome, misty silver ferns, suspended walkways, cool morning sunlight',
    style: 'Realistic Photography',
  },
  {
    prompt:
      'A soaring mechanical owl crafted from midnight enamel and glowing sapphire filaments gliding across a foggy neon skyline at night',
    style: 'Cyberpunk',
  },
  {
    prompt:
      'Delicate twilight harbor with wooden sailboats moored beside misty stone cliffs, luminous washes of Prussian blue, violet, and warm amber reflections',
    style: 'Watercolor',
  },
  {
    prompt:
      'An ancient celestial astrolabe floating in the center of a vaulted starlight library with gilded brass rings and drifting dust motes',
    style: 'Fantasy',
  },
  {
    prompt:
      'Minimalist sculptural matte-slate sports coupe resting in a dry salt flat under a cobalt twilight sky with crisp horizon reflections',
    style: 'Digital Art',
  },
];
