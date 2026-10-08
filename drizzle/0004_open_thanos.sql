CREATE TABLE "admin_credentials" (
	"id" text PRIMARY KEY DEFAULT 'admin' NOT NULL,
	"password_hash" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
