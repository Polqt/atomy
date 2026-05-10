CREATE POLICY "habits_select_own" ON public.habits FOR SELECT USING (auth.uid() = user_id);;
