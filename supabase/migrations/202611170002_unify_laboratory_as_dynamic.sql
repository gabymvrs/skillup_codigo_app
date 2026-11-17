begin;

update public.questions
set category = 'Dinâmica'
where category = 'Laboratório';

commit;
