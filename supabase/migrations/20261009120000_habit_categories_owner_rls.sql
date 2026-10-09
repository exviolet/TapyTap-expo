-- habit_categories: доступ только к связям своих привычек.
-- Раньше SELECT/INSERT/DELETE были открыты любому authenticated (USING/WITH CHECK true):
-- любой зарегистрированный пользователь мог читать и удалять чужие связи.
-- В таблице нет user_id, поэтому владелец определяется через habits.user_id.

DROP POLICY IF EXISTS "Enable read access for authenticated users on habit_categories" ON "public"."habit_categories";
DROP POLICY IF EXISTS "Enable insert for authenticated users on habit_categorie" ON "public"."habit_categories";
DROP POLICY IF EXISTS "Enable delete for authenticated users on habit_categories" ON "public"."habit_categories";

CREATE POLICY "Users can view links of their own habits" ON "public"."habit_categories"
    FOR SELECT TO "authenticated"
    USING (EXISTS (
        SELECT 1 FROM "public"."habits" h
        WHERE h.id = habit_categories.habit_id AND h.user_id = (SELECT auth.uid())
    ));

-- Связывать можно только свою привычку со своей категорией
CREATE POLICY "Users can link their own habits to their own categories" ON "public"."habit_categories"
    FOR INSERT TO "authenticated"
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "public"."habits" h
            WHERE h.id = habit_categories.habit_id AND h.user_id = (SELECT auth.uid())
        )
        AND EXISTS (
            SELECT 1 FROM "public"."categories" c
            WHERE c.id = habit_categories.category_id AND c.user_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "Users can delete links of their own habits" ON "public"."habit_categories"
    FOR DELETE TO "authenticated"
    USING (EXISTS (
        SELECT 1 FROM "public"."habits" h
        WHERE h.id = habit_categories.habit_id AND h.user_id = (SELECT auth.uid())
    ));
