/**
 * Seed merchant registry. Used by the multi-pass detector for fast domain +
 * alias matching. The Worker serves the canonical list from `/merchants`,
 * but this seed lets the engine run fully offline (Flutter on-device).
 *
 * Fields:
 *   - slug: snake_case stable ID
 *   - name: display name
 *   - domains: exact or suffix-match sender domains (e.g., "netflix.com")
 *   - aliases: free-text aliases we match in body/subject
 *   - cycle: most common billing cycle (hint, not gospel)
 *   - category: high-level category
 *   - iconSlug: brand icon reference
 *   - cancelUrl: public cancel deep-link where known
 */

export interface SeedMerchant {
  slug: string;
  name: string;
  domains: string[];
  aliases?: string[];
  cycle?: 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'lifetime';
  category?: string;
  iconSlug?: string;
  cancelUrl?: string;
}

export const SEED_MERCHANTS: SeedMerchant[] = [
  // ── Streaming ──
  { slug: 'netflix',         name: 'Netflix',          domains: ['netflix.com'], aliases: ['netflix'], cycle: 'monthly', category: 'streaming', iconSlug: 'netflix', cancelUrl: 'https://www.netflix.com/cancelplan' },
  { slug: 'spotify',         name: 'Spotify',          domains: ['spotify.com'], aliases: ['spotify premium', 'spotify duo', 'spotify family'], cycle: 'monthly', category: 'streaming', iconSlug: 'spotify', cancelUrl: 'https://www.spotify.com/account/subscription/' },
  { slug: 'apple_music',     name: 'Apple Music',      domains: ['apple.com', 'email.apple.com'], aliases: ['apple music'], cycle: 'monthly', category: 'streaming', iconSlug: 'apple_music' },
  { slug: 'apple_tv',        name: 'Apple TV+',        domains: ['apple.com', 'email.apple.com'], aliases: ['apple tv+', 'apple tv plus'], cycle: 'monthly', category: 'streaming', iconSlug: 'apple_tv' },
  { slug: 'apple_one',       name: 'Apple One',        domains: ['apple.com'], aliases: ['apple one'], cycle: 'monthly', category: 'streaming', iconSlug: 'apple_one' },
  { slug: 'youtube_premium', name: 'YouTube Premium',  domains: ['youtube.com', 'google.com'], aliases: ['youtube premium', 'youtube music premium'], cycle: 'monthly', category: 'streaming', iconSlug: 'youtube_premium' },
  { slug: 'youtube_music',   name: 'YouTube Music',    domains: ['youtube.com'], aliases: ['youtube music'], cycle: 'monthly', category: 'streaming' },
  { slug: 'amazon_prime',    name: 'Amazon Prime',     domains: ['amazon.com', 'amazon.in'], aliases: ['prime membership', 'amazon prime'], cycle: 'yearly', category: 'streaming', iconSlug: 'amazon_prime', cancelUrl: 'https://www.amazon.com/gp/subs/central/subscriptions.html' },
  { slug: 'disney_plus',     name: 'Disney+',          domains: ['disneyplus.com', 'disney.com'], aliases: ['disney+', 'disney plus'], cycle: 'monthly', category: 'streaming', iconSlug: 'disney_plus' },
  { slug: 'disney_hotstar',  name: 'Disney+ Hotstar',  domains: ['hotstar.com'], aliases: ['hotstar', 'disney+ hotstar'], cycle: 'yearly', category: 'streaming', iconSlug: 'disney_hotstar' },
  { slug: 'hulu',            name: 'Hulu',             domains: ['hulu.com'], cycle: 'monthly', category: 'streaming', iconSlug: 'hulu' },
  { slug: 'hbo_max',         name: 'HBO Max',          domains: ['max.com', 'hbomax.com'], aliases: ['hbo max'], cycle: 'monthly', category: 'streaming', iconSlug: 'hbo_max' },
  { slug: 'paramount_plus',  name: 'Paramount+',       domains: ['paramountplus.com'], aliases: ['paramount+', 'paramount plus'], cycle: 'monthly', category: 'streaming' },
  { slug: 'peacock',         name: 'Peacock',          domains: ['peacocktv.com'], cycle: 'monthly', category: 'streaming' },
  { slug: 'crunchyroll',     name: 'Crunchyroll',      domains: ['crunchyroll.com'], cycle: 'monthly', category: 'streaming' },
  { slug: 'funimation',      name: 'Funimation',       domains: ['funimation.com'], cycle: 'monthly', category: 'streaming' },
  { slug: 'sonyliv',         name: 'SonyLIV',          domains: ['sonyliv.com'], cycle: 'yearly', category: 'streaming' },
  { slug: 'zee5',            name: 'ZEE5',             domains: ['zee5.com'], cycle: 'yearly', category: 'streaming' },
  { slug: 'jiocinema',       name: 'JioCinema',        domains: ['jiocinema.com', 'jio.com'], cycle: 'yearly', category: 'streaming' },
  { slug: 'mx_player',       name: 'MX Player Gold',   domains: ['mxplayer.in'], cycle: 'yearly', category: 'streaming' },
  { slug: 'alt_balaji',      name: 'ALTBalaji',        domains: ['altbalaji.com'], cycle: 'yearly', category: 'streaming' },
  { slug: 'discovery_plus',  name: 'discovery+',       domains: ['discoveryplus.com'], cycle: 'monthly', category: 'streaming' },

  // ── Cloud / storage ──
  { slug: 'google_one',      name: 'Google One',       domains: ['google.com', 'googleplay-noreply@google.com', 'payments-noreply@google.com'], aliases: ['google one', 'google drive storage'], cycle: 'monthly', category: 'cloud', iconSlug: 'google_one' },
  { slug: 'icloud',          name: 'iCloud+',          domains: ['apple.com'], aliases: ['icloud', 'icloud+'], cycle: 'monthly', category: 'cloud', iconSlug: 'icloud' },
  { slug: 'dropbox',         name: 'Dropbox',          domains: ['dropbox.com'], cycle: 'monthly', category: 'cloud', iconSlug: 'dropbox' },
  { slug: 'onedrive',        name: 'OneDrive',         domains: ['microsoft.com', 'onedrive.com'], aliases: ['onedrive'], cycle: 'monthly', category: 'cloud' },
  { slug: 'proton',          name: 'Proton',           domains: ['proton.me', 'protonmail.com'], aliases: ['proton mail', 'proton drive'], cycle: 'monthly', category: 'cloud' },
  { slug: 'aws',             name: 'AWS',              domains: ['amazonaws.com', 'aws.amazon.com'], aliases: ['amazon web services'], cycle: 'monthly', category: 'cloud' },
  { slug: 'digitalocean',    name: 'DigitalOcean',     domains: ['digitalocean.com'], cycle: 'monthly', category: 'cloud' },
  { slug: 'vercel',          name: 'Vercel',           domains: ['vercel.com'], cycle: 'monthly', category: 'cloud' },
  { slug: 'netlify',         name: 'Netlify',          domains: ['netlify.com'], cycle: 'monthly', category: 'cloud' },
  { slug: 'cloudflare',      name: 'Cloudflare',       domains: ['cloudflare.com'], cycle: 'monthly', category: 'cloud' },
  { slug: 'supabase',        name: 'Supabase',         domains: ['supabase.com', 'supabase.io'], cycle: 'monthly', category: 'cloud' },
  { slug: 'railway',         name: 'Railway',          domains: ['railway.app', 'railway.com'], cycle: 'monthly', category: 'cloud' },
  { slug: 'render',          name: 'Render',           domains: ['render.com'], cycle: 'monthly', category: 'cloud' },
  { slug: 'fly_io',          name: 'Fly.io',           domains: ['fly.io'], cycle: 'monthly', category: 'cloud' },
  { slug: 'heroku',          name: 'Heroku',           domains: ['heroku.com', 'herokuapp.com'], cycle: 'monthly', category: 'cloud' },
  { slug: 'linode',          name: 'Linode',           domains: ['linode.com'], cycle: 'monthly', category: 'cloud' },
  { slug: 'firebase',        name: 'Firebase',         domains: ['firebase.google.com', 'google.com'], aliases: ['firebase blaze'], cycle: 'monthly', category: 'cloud' },
  { slug: 'azure',           name: 'Microsoft Azure',  domains: ['microsoft.com', 'azure.com'], aliases: ['azure'], cycle: 'monthly', category: 'cloud' },
  { slug: 'gcp',             name: 'Google Cloud',     domains: ['google.com', 'cloud.google.com'], aliases: ['google cloud', 'gcp'], cycle: 'monthly', category: 'cloud' },

  // ── Productivity / SaaS ──
  { slug: 'notion',          name: 'Notion',           domains: ['notion.so', 'notion.com'], cycle: 'monthly', category: 'productivity', iconSlug: 'notion' },
  { slug: 'figma',           name: 'Figma',            domains: ['figma.com'], cycle: 'monthly', category: 'productivity', iconSlug: 'figma' },
  { slug: 'slack',           name: 'Slack',            domains: ['slack.com'], cycle: 'monthly', category: 'productivity', iconSlug: 'slack' },
  { slug: 'linear',          name: 'Linear',           domains: ['linear.app'], cycle: 'monthly', category: 'productivity' },
  { slug: 'asana',           name: 'Asana',            domains: ['asana.com'], cycle: 'monthly', category: 'productivity' },
  { slug: 'trello',          name: 'Trello',           domains: ['trello.com', 'atlassian.com'], cycle: 'monthly', category: 'productivity' },
  { slug: 'jira',            name: 'Jira',             domains: ['atlassian.com'], aliases: ['jira'], cycle: 'monthly', category: 'productivity' },
  { slug: 'github_pro',      name: 'GitHub Pro',       domains: ['github.com'], aliases: ['github pro', 'github team', 'github enterprise'], cycle: 'monthly', category: 'productivity', iconSlug: 'github_pro' },
  { slug: 'gitlab',          name: 'GitLab',           domains: ['gitlab.com'], cycle: 'monthly', category: 'productivity' },
  { slug: 'microsoft_365',   name: 'Microsoft 365',    domains: ['microsoft.com'], aliases: ['microsoft 365', 'office 365'], cycle: 'monthly', category: 'productivity', iconSlug: 'microsoft_365' },
  { slug: 'google_workspace', name: 'Google Workspace', domains: ['google.com'], aliases: ['google workspace', 'g suite'], cycle: 'monthly', category: 'productivity' },
  { slug: 'zoom',            name: 'Zoom',             domains: ['zoom.us', 'zoom.com'], cycle: 'monthly', category: 'productivity', iconSlug: 'zoom' },
  { slug: 'superhuman',      name: 'Superhuman',       domains: ['superhuman.com'], cycle: 'monthly', category: 'productivity' },
  { slug: 'hey_email',       name: 'HEY',              domains: ['hey.com'], aliases: ['hey email'], cycle: 'yearly', category: 'productivity' },
  { slug: 'fastmail',        name: 'Fastmail',         domains: ['fastmail.com'], cycle: 'yearly', category: 'productivity' },
  { slug: 'onepassword',     name: '1Password',        domains: ['1password.com'], aliases: ['1password'], cycle: 'monthly', category: 'productivity' },
  { slug: 'bitwarden',       name: 'Bitwarden',        domains: ['bitwarden.com'], cycle: 'yearly', category: 'productivity' },
  { slug: 'lastpass',        name: 'LastPass',         domains: ['lastpass.com'], cycle: 'yearly', category: 'productivity' },
  { slug: 'todoist',         name: 'Todoist',          domains: ['todoist.com'], cycle: 'yearly', category: 'productivity' },
  { slug: 'ticktick',        name: 'TickTick',         domains: ['ticktick.com'], cycle: 'yearly', category: 'productivity' },
  { slug: 'obsidian_sync',   name: 'Obsidian Sync',    domains: ['obsidian.md'], aliases: ['obsidian'], cycle: 'monthly', category: 'productivity' },
  { slug: 'evernote',        name: 'Evernote',         domains: ['evernote.com'], cycle: 'yearly', category: 'productivity' },
  { slug: 'raycast',         name: 'Raycast Pro',      domains: ['raycast.com'], cycle: 'monthly', category: 'productivity' },
  { slug: 'arc_browser',     name: 'Arc',              domains: ['arc.net'], cycle: 'monthly', category: 'productivity' },

  // ── AI tools ──
  { slug: 'chatgpt_plus',    name: 'ChatGPT Plus',     domains: ['openai.com'], aliases: ['chatgpt plus', 'chatgpt team', 'openai'], cycle: 'monthly', category: 'ai' },
  { slug: 'claude_pro',      name: 'Claude Pro',       domains: ['anthropic.com'], aliases: ['claude pro', 'claude team', 'anthropic'], cycle: 'monthly', category: 'ai' },
  { slug: 'perplexity_pro',  name: 'Perplexity Pro',   domains: ['perplexity.ai'], aliases: ['perplexity pro'], cycle: 'monthly', category: 'ai' },
  { slug: 'midjourney',      name: 'Midjourney',       domains: ['midjourney.com'], cycle: 'monthly', category: 'ai' },
  { slug: 'github_copilot',  name: 'GitHub Copilot',   domains: ['github.com'], aliases: ['copilot', 'github copilot'], cycle: 'monthly', category: 'ai' },
  { slug: 'cursor',          name: 'Cursor',           domains: ['cursor.com', 'cursor.sh'], cycle: 'monthly', category: 'ai' },
  { slug: 'gemini_advanced', name: 'Gemini Advanced',  domains: ['google.com'], aliases: ['gemini advanced'], cycle: 'monthly', category: 'ai' },
  { slug: 'runway_ml',       name: 'Runway',           domains: ['runwayml.com'], cycle: 'monthly', category: 'ai' },
  { slug: 'elevenlabs',      name: 'ElevenLabs',       domains: ['elevenlabs.io'], cycle: 'monthly', category: 'ai' },

  // ── Design ──
  { slug: 'canva',           name: 'Canva Pro',        domains: ['canva.com'], aliases: ['canva pro'], cycle: 'yearly', category: 'design' },
  { slug: 'adobe_cc',        name: 'Adobe Creative Cloud', domains: ['adobe.com'], aliases: ['adobe', 'creative cloud'], cycle: 'monthly', category: 'design' },
  { slug: 'framer',          name: 'Framer',           domains: ['framer.com'], cycle: 'monthly', category: 'design' },
  { slug: 'sketch',          name: 'Sketch',           domains: ['sketch.com'], cycle: 'yearly', category: 'design' },
  { slug: 'affinity',        name: 'Affinity',         domains: ['affinity.serif.com'], cycle: 'yearly', category: 'design' },

  // ── Gaming ──
  { slug: 'xbox_game_pass',  name: 'Xbox Game Pass',   domains: ['xbox.com', 'microsoft.com'], aliases: ['xbox game pass', 'game pass ultimate'], cycle: 'monthly', category: 'gaming' },
  { slug: 'playstation_plus', name: 'PlayStation Plus', domains: ['playstation.com'], aliases: ['playstation plus', 'ps plus'], cycle: 'yearly', category: 'gaming' },
  { slug: 'nintendo_online', name: 'Nintendo Switch Online', domains: ['nintendo.com'], aliases: ['nintendo online'], cycle: 'yearly', category: 'gaming' },
  { slug: 'ea_play',         name: 'EA Play',          domains: ['ea.com'], aliases: ['ea play'], cycle: 'monthly', category: 'gaming' },
  { slug: 'apple_arcade',    name: 'Apple Arcade',     domains: ['apple.com'], aliases: ['apple arcade'], cycle: 'monthly', category: 'gaming' },
  { slug: 'humble_choice',   name: 'Humble Choice',    domains: ['humblebundle.com'], cycle: 'monthly', category: 'gaming' },

  // ── News / Media ──
  { slug: 'nyt',             name: 'The New York Times', domains: ['nytimes.com'], aliases: ['new york times', 'nytimes'], cycle: 'monthly', category: 'news' },
  { slug: 'wapo',            name: 'The Washington Post', domains: ['washingtonpost.com'], aliases: ['washington post'], cycle: 'monthly', category: 'news' },
  { slug: 'bloomberg',       name: 'Bloomberg',        domains: ['bloomberg.com'], cycle: 'monthly', category: 'news' },
  { slug: 'economist',       name: 'The Economist',    domains: ['economist.com'], cycle: 'yearly', category: 'news' },
  { slug: 'medium',          name: 'Medium',           domains: ['medium.com'], cycle: 'monthly', category: 'news' },
  { slug: 'substack',        name: 'Substack',         domains: ['substack.com'], cycle: 'monthly', category: 'news' },
  { slug: 'patreon',         name: 'Patreon',          domains: ['patreon.com'], cycle: 'monthly', category: 'news' },

  // ── Learning ──
  { slug: 'coursera_plus',   name: 'Coursera Plus',    domains: ['coursera.org'], aliases: ['coursera plus', 'coursera'], cycle: 'yearly', category: 'learning' },
  { slug: 'udemy',           name: 'Udemy',            domains: ['udemy.com'], cycle: 'yearly', category: 'learning' },
  { slug: 'skillshare',      name: 'Skillshare',       domains: ['skillshare.com'], cycle: 'yearly', category: 'learning' },
  { slug: 'masterclass',     name: 'MasterClass',      domains: ['masterclass.com'], cycle: 'yearly', category: 'learning' },
  { slug: 'duolingo_super',  name: 'Super Duolingo',   domains: ['duolingo.com'], aliases: ['super duolingo', 'duolingo plus'], cycle: 'yearly', category: 'learning' },
  { slug: 'rosetta_stone',   name: 'Rosetta Stone',    domains: ['rosettastone.com'], cycle: 'yearly', category: 'learning' },
  { slug: 'codecademy',      name: 'Codecademy',       domains: ['codecademy.com'], cycle: 'yearly', category: 'learning' },
  { slug: 'blinkist',        name: 'Blinkist',         domains: ['blinkist.com'], cycle: 'yearly', category: 'learning' },

  // ── Health / fitness ──
  { slug: 'headspace',       name: 'Headspace',        domains: ['headspace.com'], cycle: 'yearly', category: 'fitness' },
  { slug: 'calm',            name: 'Calm',             domains: ['calm.com'], cycle: 'yearly', category: 'fitness' },
  { slug: 'strava',          name: 'Strava',           domains: ['strava.com'], cycle: 'yearly', category: 'fitness' },
  { slug: 'peloton',         name: 'Peloton App',      domains: ['onepeloton.com', 'peloton.com'], cycle: 'monthly', category: 'fitness' },
  { slug: 'myfitnesspal',    name: 'MyFitnessPal',     domains: ['myfitnesspal.com'], cycle: 'monthly', category: 'fitness' },
  { slug: 'nike_training',   name: 'Nike Training',    domains: ['nike.com'], cycle: 'monthly', category: 'fitness' },
  { slug: 'cultfit',         name: 'Cult.fit',         domains: ['cult.fit'], cycle: 'monthly', category: 'fitness' },

  // ── Food / memberships ──
  { slug: 'swiggy_one',      name: 'Swiggy One',       domains: ['swiggy.in', 'swiggy.com'], aliases: ['swiggy one'], cycle: 'yearly', category: 'food' },
  { slug: 'zomato_gold',     name: 'Zomato Gold',      domains: ['zomato.com'], aliases: ['zomato gold', 'zomato pro'], cycle: 'yearly', category: 'food' },
  { slug: 'blinkit_subs',    name: 'Blinkit',          domains: ['blinkit.com'], cycle: 'monthly', category: 'food' },
  { slug: 'doordash_dash',   name: 'DashPass',         domains: ['doordash.com'], cycle: 'monthly', category: 'food' },
  { slug: 'ubereats_pass',   name: 'Uber One',         domains: ['uber.com'], aliases: ['uber one', 'eats pass'], cycle: 'monthly', category: 'food' },

  // ── Finance ──
  { slug: 'stripe',          name: 'Stripe',           domains: ['stripe.com'], cycle: 'monthly', category: 'finance' },
  { slug: 'revolut',         name: 'Revolut',          domains: ['revolut.com'], cycle: 'monthly', category: 'finance' },
  { slug: 'wise',            name: 'Wise',             domains: ['wise.com'], cycle: 'monthly', category: 'finance' },

  // ── Communication ──
  { slug: 'discord_nitro',   name: 'Discord Nitro',    domains: ['discord.com'], aliases: ['discord nitro'], cycle: 'monthly', category: 'communication' },
  { slug: 'telegram_premium', name: 'Telegram Premium', domains: ['telegram.org'], aliases: ['telegram premium'], cycle: 'monthly', category: 'communication' },
  { slug: 'signal_donate',   name: 'Signal',           domains: ['signal.org'], cycle: 'monthly', category: 'communication' },
  { slug: 'skype',           name: 'Skype',            domains: ['skype.com'], cycle: 'monthly', category: 'communication' },

  // ── VPN / security ──
  { slug: 'nordvpn',         name: 'NordVPN',          domains: ['nordvpn.com'], cycle: 'yearly', category: 'security' },
  { slug: 'expressvpn',      name: 'ExpressVPN',       domains: ['expressvpn.com'], cycle: 'yearly', category: 'security' },
  { slug: 'surfshark',       name: 'Surfshark',        domains: ['surfshark.com'], cycle: 'yearly', category: 'security' },
  { slug: 'mullvad',         name: 'Mullvad',          domains: ['mullvad.net'], cycle: 'monthly', category: 'security' },

  // ── Writing tools ──
  { slug: 'grammarly',       name: 'Grammarly',        domains: ['grammarly.com'], cycle: 'yearly', category: 'productivity' },
  { slug: 'quillbot',        name: 'QuillBot',         domains: ['quillbot.com'], cycle: 'monthly', category: 'ai' },

  // ── Others commonly detected ──
  { slug: 'lynda',           name: 'LinkedIn Learning', domains: ['linkedin.com'], aliases: ['linkedin learning', 'lynda'], cycle: 'monthly', category: 'learning' },
  { slug: 'linkedin_premium', name: 'LinkedIn Premium', domains: ['linkedin.com'], aliases: ['linkedin premium'], cycle: 'monthly', category: 'productivity' },
  { slug: 'audible',         name: 'Audible',          domains: ['audible.com', 'audible.in'], cycle: 'monthly', category: 'learning' },
  { slug: 'kindle_unlimited', name: 'Kindle Unlimited', domains: ['amazon.com', 'amazon.in'], aliases: ['kindle unlimited'], cycle: 'monthly', category: 'learning' },
  { slug: 'scribd',          name: 'Scribd',           domains: ['scribd.com'], cycle: 'monthly', category: 'learning' },
  { slug: 'tidal',           name: 'Tidal',            domains: ['tidal.com'], cycle: 'monthly', category: 'streaming' },
  { slug: 'deezer',          name: 'Deezer',           domains: ['deezer.com'], cycle: 'monthly', category: 'streaming' },
  { slug: 'soundcloud_go',   name: 'SoundCloud Go',    domains: ['soundcloud.com'], aliases: ['soundcloud go'], cycle: 'monthly', category: 'streaming' },
  { slug: 'shopify',         name: 'Shopify',          domains: ['shopify.com'], cycle: 'monthly', category: 'commerce' },
  { slug: 'squarespace',     name: 'Squarespace',      domains: ['squarespace.com'], cycle: 'yearly', category: 'productivity' },
  { slug: 'wordpress_com',   name: 'WordPress.com',    domains: ['wordpress.com'], cycle: 'yearly', category: 'productivity' },
  { slug: 'ghost',           name: 'Ghost',            domains: ['ghost.org'], cycle: 'monthly', category: 'productivity' },
];

/** One domain may map to multiple merchants (e.g., amazon.in \u2192 prime / kindle / audible). */
export const DOMAIN_LOOKUP: Record<string, string[]> = (() => {
  const map: Record<string, string[]> = {};
  for (const m of SEED_MERCHANTS) {
    for (const domain of m.domains) {
      const key = domain.toLowerCase();
      (map[key] ??= []).push(m.slug);
    }
  }
  return map;
})();

export const ALIAS_LOOKUP: Array<{ regex: RegExp; slug: string; name: string }> = SEED_MERCHANTS
  .flatMap((m) => {
    const terms = new Set<string>();
    terms.add(m.name.toLowerCase());
    terms.add(m.slug.replace(/_/g, ' '));
    for (const a of m.aliases ?? []) terms.add(a.toLowerCase());
    return Array.from(terms).map((term) => ({
      regex: new RegExp(`\\b${escapeRegex(term)}\\b`, 'i'),
      slug: m.slug,
      name: m.name,
    }));
  });

export function merchantBySlug(slug: string): SeedMerchant | null {
  return SEED_MERCHANTS.find((m) => m.slug === slug) ?? null;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
