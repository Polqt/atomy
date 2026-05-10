CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (auth.uid() = id);;
