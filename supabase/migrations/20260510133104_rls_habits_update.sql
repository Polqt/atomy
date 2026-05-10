CREATE POLICY "habits_update_own" ON public.habits FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);;
