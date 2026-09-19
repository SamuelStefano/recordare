-- NÃO APLICADA: precisa da aprovação do Samuel (mexe em grant de tabela com insert anônimo).
--
-- `orders` aceita insert anônimo e o GRANT era da tabela inteira, então o corpo enviado podia
-- trazer qualquer coluna. `total` já é imune (o trigger recalcula), mas `status` e `created_at`
-- não eram: um insert com `created_at` no passado nasce fora da primeira página do Table Editor
-- ordenado por data, e `status = 'fechado'` parece pedido já resolvido. Como o painel do Supabase
-- é hoje o único lugar onde alguém vê pedido novo, é barato esconder o próprio pedido de quem
-- confere — e pedido que ninguém vê é venda perdida.
--
-- Least privilege: o site insere exatamente estas cinco colunas (ver `createOrder`). Coluna nova
-- no payload exige entrar aqui também, o que é o ponto — o grant passa a ser a lista explícita do
-- que o anônimo pode escrever.
revoke insert on recordare.orders from anon, authenticated;
grant insert (id, customer, phone, note, items) on recordare.orders to anon, authenticated;
