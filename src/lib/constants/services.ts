export interface ServiceInfo {
  slug: string;
  name: string;
  logo: string;
  color: string;
  category: string;
  defaultAmount?: number;
  defaultCurrency?: string;
  defaultCycle?: string;
}

const brandIcon = (fileName: string) => `/brand-icons/${fileName}`;

export const POPULAR_SERVICES: ServiceInfo[] = [
  // ── Streaming ──
  { slug: "netflix", name: "Netflix", logo: "https://cdn.simpleicons.org/netflix/E50914", color: "#E50914", category: "entertainment", defaultAmount: 199, defaultCurrency: "INR", defaultCycle: "monthly" },
  { slug: "amazon_prime", name: "Amazon Prime", logo: "https://cdn.simpleicons.org/amazonprime/00A8E1", color: "#00A8E1", category: "entertainment", defaultAmount: 1499, defaultCurrency: "INR", defaultCycle: "yearly" },
  { slug: "disney_hotstar", name: "Disney+ Hotstar", logo: "https://cdn.simpleicons.org/hotstar/1F80E0", color: "#1F80E0", category: "entertainment", defaultAmount: 299, defaultCurrency: "INR", defaultCycle: "monthly" },
  { slug: "youtube_premium", name: "YouTube Premium", logo: "https://cdn.simpleicons.org/youtube/FF0000", color: "#FF0000", category: "entertainment", defaultAmount: 149, defaultCurrency: "INR", defaultCycle: "monthly" },
  { slug: "apple_tv", name: "Apple TV+", logo: "https://cdn.simpleicons.org/appletv/000000", color: "#000000", category: "entertainment", defaultAmount: 99, defaultCurrency: "INR", defaultCycle: "monthly" },
  { slug: "hulu", name: "Hulu", logo: "https://cdn.simpleicons.org/hulu/1CE783", color: "#1CE783", category: "entertainment", defaultAmount: 7.99, defaultCurrency: "USD", defaultCycle: "monthly" },
  { slug: "max", name: "Max", logo: "https://cdn.simpleicons.org/hbo/000000", color: "#B535F6", category: "entertainment", defaultAmount: 15.99, defaultCurrency: "USD", defaultCycle: "monthly" },
  { slug: "crunchyroll", name: "Crunchyroll", logo: "https://cdn.simpleicons.org/crunchyroll/F47521", color: "#F47521", category: "entertainment", defaultAmount: 7.99, defaultCurrency: "USD", defaultCycle: "monthly" },
  { slug: "jiohotstar", name: "JioHotstar", logo: "https://cdn.simpleicons.org/hotstar/1F80E0", color: "#0A3D91", category: "entertainment", defaultAmount: 999, defaultCurrency: "INR", defaultCycle: "yearly" },

  // ── Music ──
  { slug: "spotify", name: "Spotify", logo: "https://cdn.simpleicons.org/spotify/1DB954", color: "#1DB954", category: "music", defaultAmount: 119, defaultCurrency: "INR", defaultCycle: "monthly" },
  { slug: "apple_music", name: "Apple Music", logo: "https://cdn.simpleicons.org/applemusic/FA2D48", color: "#FA2D48", category: "music", defaultAmount: 99, defaultCurrency: "INR", defaultCycle: "monthly" },
  { slug: "youtube_music", name: "YouTube Music", logo: "https://cdn.simpleicons.org/youtubemusic/FF0000", color: "#FF0000", category: "music", defaultAmount: 109, defaultCurrency: "INR", defaultCycle: "monthly" },

  // ── AI & Dev Tools ──
  { slug: "chatgpt_plus", name: "ChatGPT Plus", logo: "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/openai.svg", color: "#10A37F", category: "development", defaultAmount: 20, defaultCurrency: "USD", defaultCycle: "monthly" },
  { slug: "claude_pro", name: "Claude Pro", logo: "https://cdn.simpleicons.org/anthropic/D4A574", color: "#D4A574", category: "development", defaultAmount: 20, defaultCurrency: "USD", defaultCycle: "monthly" },
  { slug: "gemini_advanced", name: "Gemini Advanced", logo: "https://cdn.simpleicons.org/googlegemini/4285F4", color: "#4285F4", category: "development", defaultAmount: 19.99, defaultCurrency: "USD", defaultCycle: "monthly" },
  { slug: "github_pro", name: "GitHub Pro", logo: "https://cdn.simpleicons.org/github/F5F5F5", color: "#24292F", category: "development", defaultAmount: 4, defaultCurrency: "USD", defaultCycle: "monthly" },
  { slug: "perplexity_pro", name: "Perplexity Pro", logo: "https://cdn.simpleicons.org/perplexity/1FB8CD", color: "#1FB8CD", category: "development", defaultAmount: 20, defaultCurrency: "USD", defaultCycle: "monthly" },

  // ── Productivity ──
  { slug: "notion", name: "Notion", logo: "https://cdn.simpleicons.org/notion/000000", color: "#000000", category: "productivity", defaultAmount: 10, defaultCurrency: "USD", defaultCycle: "monthly" },
  { slug: "figma", name: "Figma", logo: "https://cdn.simpleicons.org/figma/F24E1E", color: "#F24E1E", category: "productivity", defaultAmount: 15, defaultCurrency: "USD", defaultCycle: "monthly" },
  { slug: "canva", name: "Canva Pro", logo: "https://cdn.simpleicons.org/canva/00C4CC", color: "#00C4CC", category: "productivity", defaultAmount: 499, defaultCurrency: "INR", defaultCycle: "monthly" },
  { slug: "slack", name: "Slack", logo: "https://cdn.simpleicons.org/slack/4A154B", color: "#4A154B", category: "productivity", defaultAmount: 7.25, defaultCurrency: "USD", defaultCycle: "monthly" },
  { slug: "microsoft_365", name: "Microsoft 365", logo: "https://cdn.simpleicons.org/microsoft/D83B01", color: "#D83B01", category: "productivity", defaultAmount: 6.99, defaultCurrency: "USD", defaultCycle: "monthly" },
  { slug: "google_one", name: "Google One", logo: "https://cdn.simpleicons.org/google/4285F4", color: "#4285F4", category: "productivity", defaultAmount: 130, defaultCurrency: "INR", defaultCycle: "monthly" },
  { slug: "adobe_cc", name: "Adobe CC", logo: "https://cdn.simpleicons.org/adobe/FF0000", color: "#FF0000", category: "productivity", defaultAmount: 54.99, defaultCurrency: "USD", defaultCycle: "monthly" },
  { slug: "dropbox", name: "Dropbox", logo: "https://cdn.simpleicons.org/dropbox/0061FF", color: "#0061FF", category: "productivity", defaultAmount: 11.99, defaultCurrency: "USD", defaultCycle: "monthly" },
  { slug: "zoom", name: "Zoom", logo: "https://cdn.simpleicons.org/zoom/2D8CFF", color: "#2D8CFF", category: "productivity", defaultAmount: 13.33, defaultCurrency: "USD", defaultCycle: "monthly" },
  { slug: "grammarly", name: "Grammarly", logo: "https://cdn.simpleicons.org/grammarly/15C39A", color: "#15C39A", category: "productivity", defaultAmount: 12, defaultCurrency: "USD", defaultCycle: "monthly" },
  { slug: "linear", name: "Linear", logo: "https://cdn.simpleicons.org/linear/5E6AD2", color: "#5E6AD2", category: "productivity", defaultAmount: 8, defaultCurrency: "USD", defaultCycle: "monthly" },
  { slug: "todoist", name: "Todoist", logo: "https://cdn.simpleicons.org/todoist/E44332", color: "#E44332", category: "productivity", defaultAmount: 4, defaultCurrency: "USD", defaultCycle: "monthly" },

  // ── Cloud / Hosting ──
  { slug: "vercel", name: "Vercel", logo: "https://cdn.simpleicons.org/vercel/000000", color: "#000000", category: "development", defaultAmount: 20, defaultCurrency: "USD", defaultCycle: "monthly" },
  { slug: "digitalocean", name: "DigitalOcean", logo: "https://cdn.simpleicons.org/digitalocean/0080FF", color: "#0080FF", category: "development", defaultAmount: 5, defaultCurrency: "USD", defaultCycle: "monthly" },
  { slug: "cloudflare", name: "Cloudflare", logo: "https://cdn.simpleicons.org/cloudflare/F38020", color: "#F38020", category: "development", defaultAmount: 20, defaultCurrency: "USD", defaultCycle: "monthly" },
  { slug: "supabase", name: "Supabase", logo: "https://cdn.simpleicons.org/supabase/3FCF8E", color: "#3FCF8E", category: "development", defaultAmount: 25, defaultCurrency: "USD", defaultCycle: "monthly" },
  { slug: "railway", name: "Railway", logo: "https://cdn.simpleicons.org/railway/0B0D0E", color: "#0B0D0E", category: "development", defaultAmount: 5, defaultCurrency: "USD", defaultCycle: "monthly" },
  { slug: "netlify", name: "Netlify", logo: "https://cdn.simpleicons.org/netlify/00C7B7", color: "#00C7B7", category: "development", defaultAmount: 19, defaultCurrency: "USD", defaultCycle: "monthly" },

  // ── Gaming ──
  { slug: "xbox_game_pass", name: "Xbox Game Pass", logo: "https://cdn.simpleicons.org/xbox/107C10", color: "#107C10", category: "gaming", defaultAmount: 14.99, defaultCurrency: "USD", defaultCycle: "monthly" },
  { slug: "playstation_plus", name: "PlayStation Plus", logo: "https://cdn.simpleicons.org/playstation/003087", color: "#003087", category: "gaming", defaultAmount: 9.99, defaultCurrency: "USD", defaultCycle: "monthly" },
  { slug: "discord_nitro", name: "Discord Nitro", logo: "https://cdn.simpleicons.org/discord/5865F2", color: "#5865F2", category: "gaming", defaultAmount: 9.99, defaultCurrency: "USD", defaultCycle: "monthly" },

  // ── Education ──
  { slug: "duolingo_super", name: "Duolingo Super", logo: "https://cdn.simpleicons.org/duolingo/58CC02", color: "#58CC02", category: "education", defaultAmount: 6.99, defaultCurrency: "USD", defaultCycle: "monthly" },
  { slug: "coursera_plus", name: "Coursera Plus", logo: "https://cdn.simpleicons.org/coursera/0056D2", color: "#0056D2", category: "education", defaultAmount: 59, defaultCurrency: "USD", defaultCycle: "monthly" },

  // ── Health & Fitness ──
  { slug: "headspace", name: "Headspace", logo: "https://cdn.simpleicons.org/headspace/F47D31", color: "#F47D31", category: "health_fitness", defaultAmount: 12.99, defaultCurrency: "USD", defaultCycle: "monthly" },
  { slug: "cultfit", name: "Cult.fit", logo: "https://cdn.simpleicons.org/codeforces/FF1744", color: "#FF1744", category: "health_fitness", defaultAmount: 999, defaultCurrency: "INR", defaultCycle: "monthly" },

  // ── Indian Services ──
  { slug: "swiggy_one", name: "Swiggy One", logo: "https://cdn.simpleicons.org/swiggy/FC8019", color: "#FC8019", category: "shopping", defaultAmount: 99, defaultCurrency: "INR", defaultCycle: "monthly" },
  { slug: "zomato_gold", name: "Zomato Gold", logo: "https://cdn.simpleicons.org/zomato/E23744", color: "#E23744", category: "shopping", defaultAmount: 600, defaultCurrency: "INR", defaultCycle: "yearly" },

  // ── Security ──
  { slug: "onepassword", name: "1Password", logo: "https://cdn.simpleicons.org/1password/0094F5", color: "#0094F5", category: "productivity", defaultAmount: 2.99, defaultCurrency: "USD", defaultCycle: "monthly" },
  { slug: "proton", name: "Proton", logo: "https://cdn.simpleicons.org/proton/6D4AFF", color: "#6D4AFF", category: "productivity", defaultAmount: 4.99, defaultCurrency: "USD", defaultCycle: "monthly" },

  // ── Social ──
  { slug: "patreon", name: "Patreon", logo: "https://cdn.simpleicons.org/patreon/FF424D", color: "#FF424D", category: "entertainment" },
  { slug: "medium", name: "Medium", logo: "https://cdn.simpleicons.org/medium/000000", color: "#000000", category: "news", defaultAmount: 5, defaultCurrency: "USD", defaultCycle: "monthly" },
  { slug: "substack", name: "Substack", logo: "https://cdn.simpleicons.org/substack/FF6719", color: "#FF6719", category: "news" },

  // ── Additional publishing / creator tools ──
  { slug: "wordpress", name: "WordPress", logo: "https://cdn.simpleicons.org/wordpress/21759B", color: "#21759B", category: "productivity", defaultAmount: 9, defaultCurrency: "USD", defaultCycle: "monthly" },
];

const SERVICE_LOGO_ASSETS: Record<string, string> = {
  netflix: brandIcon("netflix.webp"),
  amazon_prime: brandIcon("amazonprime.webp"),
  disney_hotstar: brandIcon("disneyhotstar.webp"),
  youtube_premium: brandIcon("youtubepremium.webp"),
  apple_tv: brandIcon("appletv.svg"),
  hulu: brandIcon("hulu.webp"),
  max: brandIcon("max.webp"),
  crunchyroll: brandIcon("crunchyroll.webp"),
  jiohotstar: brandIcon("jiohotstar.webp"),
  spotify: brandIcon("spotify.webp"),
  apple_music: brandIcon("applemusic.svg"),
  youtube_music: brandIcon("youtubemusic.svg"),
  chatgpt_plus: brandIcon("chatgptplus.webp"),
  claude_pro: brandIcon("claudepro.webp"),
  gemini_advanced: brandIcon("geminiadvanced.webp"),
  github_pro: brandIcon("githubpro.webp"),
  perplexity_pro: brandIcon("perplexitypro.webp"),
  notion: brandIcon("notion.webp"),
  figma: brandIcon("figma.webp"),
  canva: brandIcon("canva.webp"),
  slack: brandIcon("slack.webp"),
  microsoft_365: brandIcon("microsoft365.webp"),
  google_one: brandIcon("google-one.webp"),
  adobe_cc: brandIcon("adobecc.webp"),
  dropbox: brandIcon("dropbox.webp"),
  zoom: brandIcon("zoom.webp"),
  grammarly: brandIcon("grammarly.webp"),
  linear: brandIcon("linear.webp"),
  todoist: brandIcon("todoist.webp"),
  vercel: brandIcon("vercel.webp"),
  digitalocean: brandIcon("digitalocean.webp"),
  cloudflare: brandIcon("cloudflare.webp"),
  supabase: brandIcon("supabase.webp"),
  railway: brandIcon("railway.webp"),
  netlify: brandIcon("netlify.webp"),
  xbox_game_pass: brandIcon("xboxgamepass.webp"),
  playstation_plus: brandIcon("playstationplus.webp"),
  discord_nitro: brandIcon("discordnitro.webp"),
  duolingo_super: brandIcon("duolingosuper.webp"),
  coursera_plus: brandIcon("courseraplus.webp"),
  headspace: brandIcon("headspace.webp"),
  cultfit: brandIcon("cultfit.webp"),
  swiggy_one: brandIcon("swiggyone.webp"),
  zomato_gold: brandIcon("zomatogold.webp"),
  onepassword: brandIcon("onepassword.webp"),
  proton: brandIcon("proton.webp"),
  patreon: brandIcon("patreon.webp"),
  medium: brandIcon("medium.webp"),
  substack: brandIcon("substack.webp"),
};

for (const service of POPULAR_SERVICES) {
  service.logo = SERVICE_LOGO_ASSETS[service.slug] ?? service.logo;
}

const SERVICE_ALIASES: Record<string, string> = {
  // OpenAI / ChatGPT family
  chatgpt: "chatgpt_plus",
  chatgptplus: "chatgpt_plus",
  chatgpt_plus_subscription: "chatgpt_plus",
  openai: "chatgpt_plus",
  openai_chatgpt: "chatgpt_plus",

  // Anthropic / Claude
  claude: "claude_pro",
  anthropic: "claude_pro",

  // Google family
  google: "google_one",
  googleone: "google_one",
  google_1: "google_one",
  google_storage: "google_one",
  google_drive_storage: "google_one",
  google_workspace_storage: "google_one",
  gemini: "gemini_advanced",
  google_gemini: "gemini_advanced",

  // Amazon
  amazon: "amazon_prime",
  amazonprime: "amazon_prime",
  primevideo: "amazon_prime",

  // Microsoft
  microsoft: "microsoft_365",
  microsoft365: "microsoft_365",
  office365: "microsoft_365",
  office_365: "microsoft_365",

  // GitHub
  github: "github_pro",

  // Apple
  apple: "apple_music",
  applemusic: "apple_music",
  appletv: "apple_tv",
  apple_tv_plus: "apple_tv",

  // YouTube
  youtube: "youtube_premium",
  youtubepremium: "youtube_premium",

  // Coursera
  coursera: "coursera_plus",

  // Discord
  discord: "discord_nitro",

  // Gaming
  xbox: "xbox_game_pass",
  xboxgamepass: "xbox_game_pass",
  playstation: "playstation_plus",
  playstationplus: "playstation_plus",
  psn: "playstation_plus",

  // Adobe
  adobe: "adobe_cc",
  adobecc: "adobe_cc",
  creativecloud: "adobe_cc",
  adobe_creative_cloud: "adobe_cc",

  // Other common collapses
  duolingo: "duolingo_super",
  notionai: "notion",
  notion_ai: "notion",
  canvapro: "canva",
  canva_pro: "canva",
  hotstar: "disney_hotstar",
  disney: "disney_hotstar",
  onepassword1: "onepassword",
  protonmail: "proton",
  proton_mail: "proton",
  swiggy: "swiggy_one",
  zomato: "zomato_gold",
  wp: "wordpress",
  wordpresscom: "wordpress",
};

export function normalizeServiceSlug(slug: string): string {
  const normalised = slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return SERVICE_ALIASES[normalised] ?? SERVICE_ALIASES[normalised.replace(/_/g, "")] ?? normalised;
}

export const SERVICE_MAP = new Map(POPULAR_SERVICES.map(s => [s.slug, s]));

for (const [alias, target] of Object.entries(SERVICE_ALIASES)) {
  const service = SERVICE_MAP.get(target);
  if (service) {
    SERVICE_MAP.set(alias, service);
  }
}

export function getServiceInfo(slug: string): ServiceInfo | undefined {
  return SERVICE_MAP.get(normalizeServiceSlug(slug));
}

export function getServiceLogo(slug: string): string | null {
  return getServiceInfo(slug)?.logo ?? null;
}

export function getServiceColor(slug: string): string | null {
  return getServiceInfo(slug)?.color ?? null;
}

export const SERVICE_CATEGORIES = [
  { slug: "entertainment", label: "Streaming", iconName: "tv" },
  { slug: "music", label: "Music", iconName: "music" },
  { slug: "development", label: "Dev & AI", iconName: "code-2" },
  { slug: "productivity", label: "Productivity", iconName: "briefcase" },
  { slug: "gaming", label: "Gaming", iconName: "gamepad-2" },
  { slug: "education", label: "Education", iconName: "book-open" },
  { slug: "health_fitness", label: "Health", iconName: "heart" },
  { slug: "shopping", label: "Shopping", iconName: "shopping-bag" },
  { slug: "news", label: "News", iconName: "newspaper" },
] as const;
