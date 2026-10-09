


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."categories_order_index_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."categories_order_index_seq" OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "icon" "text",
    "color" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid" DEFAULT "auth"."uid"(),
    "order_index" bigint DEFAULT "nextval"('"public"."categories_order_index_seq"'::"regclass") NOT NULL
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."daily_progress" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "habit_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "progress" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."daily_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."habit_categories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "habit_id" "uuid",
    "category_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."habit_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."habit_completions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "habit_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "completion_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "completed_count" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "target_completions" integer DEFAULT 1 NOT NULL
);


ALTER TABLE "public"."habit_completions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."habit_notes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "habit_id" "uuid" NOT NULL,
    "note_date" "date" NOT NULL,
    "content" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "habit_notes_content_check" CHECK (("char_length"("content") > 0))
);


ALTER TABLE "public"."habit_notes" OWNER TO "postgres";


COMMENT ON TABLE "public"."habit_notes" IS 'Хранит текстовые заметки пользователей для конкретной привычки на конкретную дату.';



COMMENT ON COLUMN "public"."habit_notes"."user_id" IS 'Ссылка на пользователя, создавшего заметку.';



COMMENT ON COLUMN "public"."habit_notes"."habit_id" IS 'Ссылка на привычку, к которой относится заметка.';



COMMENT ON COLUMN "public"."habit_notes"."note_date" IS 'Дата, за которую оставлена заметка.';



COMMENT ON COLUMN "public"."habit_notes"."content" IS 'Текст заметки.';



CREATE TABLE IF NOT EXISTS "public"."habits" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "frequency" "jsonb",
    "progress" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "description" "text",
    "goal_series" "text",
    "icon" "text",
    "target_completions" integer DEFAULT 1,
    "order_index" integer DEFAULT 0 NOT NULL,
    "is_archived" boolean DEFAULT false,
    "type" "text" DEFAULT 'checkoff'::"text" NOT NULL,
    "unit" "text"
);


ALTER TABLE "public"."habits" OWNER TO "postgres";


ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_progress"
    ADD CONSTRAINT "daily_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."habit_categories"
    ADD CONSTRAINT "habit_categories_habit_id_category_id_key" UNIQUE ("habit_id", "category_id");



ALTER TABLE ONLY "public"."habit_categories"
    ADD CONSTRAINT "habit_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."habit_completions"
    ADD CONSTRAINT "habit_completions_habit_id_completion_date_user_id_key" UNIQUE ("habit_id", "completion_date", "user_id");



ALTER TABLE ONLY "public"."habit_completions"
    ADD CONSTRAINT "habit_completions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."habit_notes"
    ADD CONSTRAINT "habit_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."habit_notes"
    ADD CONSTRAINT "habit_notes_user_id_habit_id_note_date_key" UNIQUE ("user_id", "habit_id", "note_date");



ALTER TABLE ONLY "public"."habits"
    ADD CONSTRAINT "habits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_progress"
    ADD CONSTRAINT "unique_daily_progress" UNIQUE ("habit_id", "user_id", "date");



CREATE OR REPLACE TRIGGER "update_categories_updated_at" BEFORE UPDATE ON "public"."categories" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_habit_completions_updated_at" BEFORE UPDATE ON "public"."habit_completions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_habits_updated_at" BEFORE UPDATE ON "public"."habits" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."daily_progress"
    ADD CONSTRAINT "daily_progress_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."daily_progress"
    ADD CONSTRAINT "daily_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."habit_categories"
    ADD CONSTRAINT "habit_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."habit_categories"
    ADD CONSTRAINT "habit_categories_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."habit_completions"
    ADD CONSTRAINT "habit_completions_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."habit_completions"
    ADD CONSTRAINT "habit_completions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."habit_notes"
    ADD CONSTRAINT "habit_notes_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."habit_notes"
    ADD CONSTRAINT "habit_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."habits"
    ADD CONSTRAINT "habits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



CREATE POLICY "Enable delete for authenticated users on habit_categories" ON "public"."habit_categories" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Enable delete for authenticated users on their own categories" ON "public"."categories" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Enable insert for authenticated users for their own categories" ON "public"."categories" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Enable insert for authenticated users on habit_categorie" ON "public"."habit_categories" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable read access for authenticated users on habit_categories" ON "public"."habit_categories" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read access for authenticated users on their own categor" ON "public"."categories" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Enable update for authenticated users on their own categories" ON "public"."categories" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own daily progress" ON "public"."daily_progress" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own habit completions." ON "public"."habit_completions" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own habits" ON "public"."habits" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own notes" ON "public"."habit_notes" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own daily progress" ON "public"."daily_progress" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own habit completions." ON "public"."habit_completions" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own habits" ON "public"."habits" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") AND ("description" IS NOT NULL) AND ("goal_series" IS NOT NULL) AND ("icon" IS NOT NULL)));



CREATE POLICY "Users can insert their own notes" ON "public"."habit_notes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can select their own habit completions." ON "public"."habit_completions" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own daily progress" ON "public"."daily_progress" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own habit completions." ON "public"."habit_completions" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own habits" ON "public"."habits" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own notes" ON "public"."habit_notes" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own daily progress" ON "public"."daily_progress" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own habits" ON "public"."habits" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own notes" ON "public"."habit_notes" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."daily_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."habit_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."habit_completions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."habit_notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."habits" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON SEQUENCE "public"."categories_order_index_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."categories_order_index_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."categories_order_index_seq" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."daily_progress" TO "anon";
GRANT ALL ON TABLE "public"."daily_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_progress" TO "service_role";



GRANT ALL ON TABLE "public"."habit_categories" TO "anon";
GRANT ALL ON TABLE "public"."habit_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."habit_categories" TO "service_role";



GRANT ALL ON TABLE "public"."habit_completions" TO "anon";
GRANT ALL ON TABLE "public"."habit_completions" TO "authenticated";
GRANT ALL ON TABLE "public"."habit_completions" TO "service_role";



GRANT ALL ON TABLE "public"."habit_notes" TO "anon";
GRANT ALL ON TABLE "public"."habit_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."habit_notes" TO "service_role";



GRANT ALL ON TABLE "public"."habits" TO "anon";
GRANT ALL ON TABLE "public"."habits" TO "authenticated";
GRANT ALL ON TABLE "public"."habits" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";































