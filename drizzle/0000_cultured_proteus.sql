CREATE TABLE `recipe_submissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`dish_name` text NOT NULL,
	`content` text NOT NULL,
	`locale` text DEFAULT 'zh' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text NOT NULL
);
