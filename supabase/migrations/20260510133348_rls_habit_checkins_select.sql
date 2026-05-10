CREATE POLICY "habit_checkins_select_own" ON public.habit_checkins FOR SELECT USING (auth.uid() = user_id);;
