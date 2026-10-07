CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title_es" text NOT NULL,
	"title_en" text NOT NULL,
	"description_es" text NOT NULL,
	"description_en" text NOT NULL,
	"repo" text DEFAULT '' NOT NULL,
	"live" text DEFAULT '' NOT NULL,
	"technologies" text[] DEFAULT '{}' NOT NULL,
	"images" text[] DEFAULT '{}' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
