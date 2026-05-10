CREATE POLICY "habits_insert_own" ON public.habits FOR INSERT WITH CHECK (auth.uid() = user_id);;
