CREATE POLICY "ai_requests_insert_own" ON public.ai_requests FOR INSERT WITH CHECK (auth.uid() = user_id);;
