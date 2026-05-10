CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);;
