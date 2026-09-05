import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const recipeSubmissions = sqliteTable('recipe_submissions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  dishName: text('dish_name').notNull(),
  content: text('content').notNull(),
  locale: text('locale').notNull().default('zh'),
  status: text('status').notNull().default('pending'),
  createdAt: text('created_at').notNull(),
});
