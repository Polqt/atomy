CREATE POLICY "push_tokens_insert_own" ON public.push_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);;
