CREATE POLICY "habits_delete_own" ON public.habits FOR DELETE USING (auth.uid() = user_id);;
