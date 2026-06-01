-- Paliers de licence par défaut
insert into license_tiers (name, multiplier, files, rights, is_exclusive, sort_order) values
('Basic (MP3)', 1, 'MP3', 'Up to 50K streams · 1 music video · non-profit use', false, 1),
('Premium (WAV)', 1.7, 'WAV + MP3', 'Up to 200K streams · 1 video · radio play', false, 2),
('Trackout / Stems', 3.2, 'WAV + MP3 + stems', 'Up to 500K streams · unlimited videos · monetised', false, 3),
('Unlimited', 5, 'WAV + MP3 + stems', 'Unlimited streams, videos & distribution', false, 4),
('Exclusive', 25, 'Full ownership · all files', 'Exclusive rights · beat removed from store forever', true, 5)
on conflict do nothing;

-- Codes promo de démo
insert into promo_codes (code, percent_off) values ('NIGHT20', 20), ('LISIERE10', 10)
on conflict (code) do nothing;
