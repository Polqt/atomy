alter table public.habits
add column if not exists frequency text not null default 'daily';

alter table public.habits
drop constraint if exists habits_frequency_check;

alter table public.habits
add constraint habits_frequency_check
check (frequency in ('daily', 'weekly', 'monthly', 'weekdays', 'weekends'));
