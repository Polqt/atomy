CREATE POLICY "ai_requests_select_own" ON public.ai_requests FOR SELECT USING (auth.uid() = user_id);;
