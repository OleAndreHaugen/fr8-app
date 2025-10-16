-- Seed data for fuel_codes table
-- Production fuel codes data

-- Insert fuel codes
insert into public.fuel_codes (code, port) values
  ('NLRTM', 'Rotterdam'),
  ('BEANR', 'Antwerp'),
  ('DEHAM', 'Hamburg'),
  ('FRDKK', 'Dunkirk'),
  ('GRPIR', 'Piraeus'),
  ('TRIST', 'Istanbul'),
  ('SEGOT', 'Gothenburg'),
  ('RULED', 'St Petersburg'),
  ('GIGIB', 'Gibraltar'),
  ('ESLPA', 'Las Palmas'),
  ('ITGOA', 'Genoa'),
  ('MTMLA', 'Malta'),
  ('RUNVS', 'Novorossiisk'),
  ('USORF', 'Norfolk'),
  ('USHOU', 'Houston'),
  ('USMSY', 'New Orleans'),
  ('PACTB', 'Cristobal'),
  ('PABLB', 'Balboa'),
  ('BRSSZ', 'Santos'),
  ('ARBUE', 'Buenos Aires'),
  ('SGSIN', 'Singapore'),
  ('HKHKG', 'Hong Kong'),
  ('CNSHG', 'Shanghai'),
  ('AEFJR', 'Fujairah'),
  ('ZADUR', 'Durban'),
  ('LKCMB', 'Colombo'),
  ('USLGB', 'Long Beach'),
  ('CAVAN', 'Vancouver'),
  ('PECLL', 'Callao'),
  ('CNNTG', 'Nantong'),
  ('CNNJG', 'Nanjing'),
  ('CNJIA', 'Jiangyin'),
  ('CNZOS', 'Zhoushan'),
  ('CNQDG', 'Qingdao'),
  ('CNDJK', 'Dongjiakou')
on conflict (code) do nothing;

