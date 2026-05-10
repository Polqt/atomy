CREATE POLICY "push_tokens_select_own" ON public.push_tokens FOR SELECT USING (auth.uid() = user_id);;
