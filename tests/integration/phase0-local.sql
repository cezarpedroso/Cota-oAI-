-- Run ONLY in an isolated disposable PostgreSQL database after all migrations.
begin;
create function pg_temp.assert_true(value boolean, label text) returns void language plpgsql as $$
begin if value is distinct from true then raise exception 'FAIL: %', label; end if; raise notice 'PASS: %', label; end $$;
insert into auth.users(id, raw_user_meta_data) values
 ('11111111-1111-4111-8111-111111111111','{}'),
 ('22222222-2222-4222-8222-222222222222','{}');
set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
select public.create_rfq_atomic('Test request','','USD','[{"description":"Widget","quantity":"3","unit":"ea"}]') as rfq \gset
select id as item from public.rfq_items where rfq_id = :'rfq' \gset
select public.create_quote_atomic(:'rfq','Supplier','Original',null,'99999999999999.9999',null,null,null,'',
 jsonb_build_array(jsonb_build_object('rfqItemId',:'item','quantity','3','unitPrice','0.1','lineTotal','999'))) as quote \gset
select pg_temp.assert_true((select freight_cost::text = '99999999999999.9999' and currency is null and tax_amount is null from vendor_quotes where id = :'quote'), 'exact monetary persistence and NULLs');
select pg_temp.assert_true((select line_total = 0.3 from quote_items where quote_id = :'quote'), 'authoritative line total');
update quote_items set line_total=999 where quote_id=:'quote';
select pg_temp.assert_true((select line_total=0.3 from quote_items where quote_id=:'quote'), 'direct total tampering recalculated');
select set_config('test.rfq',:'rfq',true),set_config('test.item',:'item',true),set_config('test.quote',:'quote',true);
do $$ begin
 begin
  delete from public.rfq_items where id=current_setting('test.item')::uuid;
  set constraints all immediate;
  raise exception 'referenced item deletion succeeded';
 exception when foreign_key_violation then raise notice 'PASS: referenced item protected'; end;
end $$;
select pg_temp.assert_true((select count(*)=1 from quote_items where quote_id=:'quote'), 'failed deletion preserves lines');
do $$ begin
 begin
  perform public.create_quote_atomic(current_setting('test.rfq')::uuid,'Invalid','','USD',null,null,null,null,'',
  jsonb_build_array(jsonb_build_object('rfqItemId',current_setting('test.item'),'quantity','1','unitPrice','1'),
  jsonb_build_object('rfqItemId','99999999-9999-4999-8999-999999999999','quantity','1','unitPrice','1')));
  raise exception 'invalid association succeeded';
 exception when foreign_key_violation then raise notice 'PASS: invalid association rejected'; end;
end $$;
select pg_temp.assert_true((select count(*)=1 from vendor_quotes where rfq_id=:'rfq'), 'atomic rollback leaves no partial quotation');
do $$ begin
 begin perform public.create_rfq_atomic('Invalid','','USD','[]'); raise exception using errcode='ZX001', message='empty items accepted';
 exception when raise_exception then raise notice 'PASS: empty items rejected'; end;
 begin perform public.validate_procurement_decimal('1.00001',false); raise exception using errcode='ZX001', message='excess precision accepted';
 exception when raise_exception then raise notice 'PASS: excess precision rejected'; end;
 begin perform public.validate_procurement_decimal('-1',false); raise exception using errcode='ZX001', message='negative amount accepted';
 exception when raise_exception then raise notice 'PASS: negative amount rejected'; end;
end $$;
select public.create_rfq_atomic('Other request','','USD','[{"description":"Other","quantity":"1","unit":"ea"}]') as other_rfq \gset
select id as other_item from rfq_items where rfq_id=:'other_rfq' \gset
select set_config('test.other_item',:'other_item',true);
do $$ begin
 begin insert into public.quote_items(rfq_id,quote_id,rfq_item_id,quantity) values(current_setting('test.rfq')::uuid,current_setting('test.quote')::uuid,current_setting('test.other_item')::uuid,1);
 set constraints all immediate;
 raise exception 'cross-RFQ association succeeded';
 exception when foreign_key_violation then raise notice 'PASS: cross-RFQ association rejected'; end;
end $$;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
select pg_temp.assert_true((select count(*)=0 from vendor_quotes where id=:'quote'), 'user B cannot read quotation');
do $$ begin
 begin perform public.create_quote_atomic(current_setting('test.rfq')::uuid,'Attacker','','USD',null,null,null,null,'','[]');
 raise exception using errcode='ZX001', message='unauthorized creation succeeded';
 exception when raise_exception then raise notice 'PASS: unauthorized creation rejected'; end;
end $$;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
delete from rfq_sessions where id=:'rfq';
set constraints all immediate;
select pg_temp.assert_true((select count(*)=0 from quote_items where quote_id=:'quote'), 'whole-RFQ deletion still cascades');
reset role;
select pg_temp.assert_true(not has_function_privilege('anon','public.create_quote_atomic(uuid,text,text,character,numeric,numeric,numeric,integer,text,jsonb)','execute'), 'anonymous RPC execution denied');
rollback;
