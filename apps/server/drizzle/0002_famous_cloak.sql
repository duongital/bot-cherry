CREATE TABLE "health_conversation" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health_message" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"form" jsonb,
	"log_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "symptom_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"conversation_id" text,
	"message_id" text,
	"log_date" date NOT NULL,
	"raw_input" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "symptom_log_entry" (
	"id" text PRIMARY KEY NOT NULL,
	"log_id" text NOT NULL,
	"symptom" text NOT NULL,
	"present" boolean NOT NULL,
	"severity" smallint,
	"note" text
);
--> statement-breakpoint
ALTER TABLE "health_conversation" ADD CONSTRAINT "health_conversation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_message" ADD CONSTRAINT "health_message_conversation_id_health_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."health_conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_message" ADD CONSTRAINT "health_message_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_message" ADD CONSTRAINT "health_message_log_id_symptom_log_id_fk" FOREIGN KEY ("log_id") REFERENCES "public"."symptom_log"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "symptom_log" ADD CONSTRAINT "symptom_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "symptom_log" ADD CONSTRAINT "symptom_log_conversation_id_health_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."health_conversation"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "symptom_log_entry" ADD CONSTRAINT "symptom_log_entry_log_id_symptom_log_id_fk" FOREIGN KEY ("log_id") REFERENCES "public"."symptom_log"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "health_conversation_user_updated_idx" ON "health_conversation" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE INDEX "health_message_conversation_created_idx" ON "health_message" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "symptom_log_user_date_idx" ON "symptom_log" USING btree ("user_id","log_date");--> statement-breakpoint
CREATE UNIQUE INDEX "symptom_log_entry_log_symptom_unique" ON "symptom_log_entry" USING btree ("log_id","symptom");