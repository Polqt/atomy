CREATE POLICY "habit_checkins_insert_own" ON public.habit_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);;
