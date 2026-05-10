CREATE POLICY "habit_checkins_update_own" ON public.habit_checkins FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);;
