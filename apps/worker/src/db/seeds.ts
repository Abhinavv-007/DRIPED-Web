interface DefaultCategory {
  name: string;
  colour_hex: string;
  icon_name: string;
}

const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { name: 'Entertainment', colour_hex: '#BF5AF2', icon_name: 'tv' },
  { name: 'Music',         colour_hex: '#FF375F', icon_name: 'music' },
  { name: 'Productivity',  colour_hex: '#0A84FF', icon_name: 'briefcase' },
  { name: 'Education',     colour_hex: '#30D158', icon_name: 'book-open' },
  { name: 'Health',        colour_hex: '#FF6B6B', icon_name: 'heart' },
  { name: 'Finance',       colour_hex: '#FFD60A', icon_name: 'trending-up' },
  { name: 'Shopping',      colour_hex: '#FF9F0A', icon_name: 'shopping-bag' },
  { name: 'Development',   colour_hex: '#64D2FF', icon_name: 'code-2' },
  { name: 'Utilities',     colour_hex: '#8E8E93', icon_name: 'zap' },
  { name: 'Gaming',        colour_hex: '#32D74B', icon_name: 'gamepad-2' },
  { name: 'News',          colour_hex: '#AC8E68', icon_name: 'newspaper' },
  { name: 'Other',         colour_hex: '#636366', icon_name: 'grid' },
];

export async function seedDefaultCategories(
  userId: string,
  db: D1Database,
): Promise<void> {
  const stmt = db.prepare(
    `INSERT INTO categories (id, user_id, name, colour_hex, icon_name, budget_limit, is_default)
     VALUES (?, ?, ?, ?, ?, NULL, 1)`,
  );

  const batch = DEFAULT_CATEGORIES.map((cat) =>
    stmt.bind(crypto.randomUUID(), userId, cat.name, cat.colour_hex, cat.icon_name),
  );

  await db.batch(batch);
}
