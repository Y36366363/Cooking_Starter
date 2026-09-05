import { getDbBinding } from '@/db';

const LIMITS = { name: 60, dishName: 100, content: 2500 };

export async function POST(request: Request) {
  let body: { name?: unknown; dishName?: unknown; content?: unknown; locale?: unknown };
  try { body = await request.json(); } catch { return Response.json({ error: 'invalid_json' }, { status: 400 }); }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const dishName = typeof body.dishName === 'string' ? body.dishName.trim() : '';
  const content = typeof body.content === 'string' ? body.content.trim() : '';
  const locale = body.locale === 'en' ? 'en' : 'zh';
  if (!name || !dishName || !content || name.length > LIMITS.name || dishName.length > LIMITS.dishName || content.length > LIMITS.content) {
    return Response.json({ error: 'invalid_submission' }, { status: 400 });
  }

  const db = getDbBinding();
  const result = await db.prepare(`
    INSERT INTO recipe_submissions (name, dish_name, content, locale, status, created_at)
    VALUES (?, ?, ?, ?, 'pending', ?)
  `).bind(name, dishName, content, locale, new Date().toISOString()).run();

  return Response.json({ id: result.meta.last_row_id, status: 'pending' }, { status: 201 });
}
