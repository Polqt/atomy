CREATE POLICY "push_tokens_delete_own" ON public.push_tokens FOR DELETE USING (auth.uid() = user_id);;
