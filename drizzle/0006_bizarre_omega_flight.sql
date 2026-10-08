CREATE TABLE "admin_email_change" (
	"id" text PRIMARY KEY DEFAULT 'admin' NOT NULL,
	"new_email" text NOT NULL,
	"code_hash" text NOT NULL,
	"fail_count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_credentials" ADD COLUMN "username" text DEFAULT '' NOT NULL;