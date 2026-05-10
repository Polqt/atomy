CREATE POLICY "push_tokens_update_own" ON public.push_tokens FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);;
