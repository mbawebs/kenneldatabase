-- Los dueños casi nunca recuerdan la fecha exacta de nacimiento de
-- sus perros, pero si la edad aproximada ("1 year old", "6 months").
-- Se cambia date_of_birth (date) por age (text), texto libre en vez
-- de selector de fecha.
--
-- Los perros que ya tenian una fecha guardada se quedan con esa
-- fecha como texto (ej. "2023-01-15") hasta que el dueño la edite a
-- mano por algo como "1 year old" — no hay forma de calcular la edad
-- exacta "a partir de hoy" de forma que siga siendo correcta despues.
alter table public.dogs rename column date_of_birth to age;
alter table public.dogs alter column age type text using age::text;
