-- Forward-only correction; no historical monetary values are rewritten.
-- Deferred NO ACTION protects referenced items while allowing whole-RFQ cascades.
alter table public.quote_items drop constraint quote_items_rfq_item_id_rfq_id_fkey;
alter table public.quote_items add constraint quote_items_rfq_item_id_rfq_id_fkey
 foreign key (rfq_item_id, rfq_id) references public.rfq_items(id, rfq_id)
 on delete no action deferrable initially deferred;

create function public.validate_procurement_decimal(value text, required_positive boolean)
returns void language plpgsql security invoker set search_path = pg_catalog as $$
begin
 if value is null then
   if required_positive then raise exception 'quantity required'; end if;
   return;
 end if;
 if value !~ '^[0-9]{1,14}(\.[0-9]{1,4})?$' then raise exception 'invalid decimal precision'; end if;
 if required_positive and value::numeric <= 0 then raise exception 'quantity must be positive'; end if;
end $$;

create function public.validate_procurement_items(items jsonb, quotation boolean)
returns void language plpgsql security invoker set search_path = pg_catalog as $$
declare item jsonb;
begin
 if items is null or jsonb_typeof(items) <> 'array' then raise exception 'items must be an array'; end if;
 if jsonb_array_length(items) not between 1 and 200 then raise exception 'invalid item count'; end if;
 for item in select value from jsonb_array_elements(items) loop
   if jsonb_typeof(item) <> 'object' then raise exception 'invalid item'; end if;
   perform public.validate_procurement_decimal(item->>'quantity', true);
   if length(coalesce(item->>'description','')) > 4000 or length(coalesce(item->>'unit','')) > 80 then raise exception 'item too long'; end if;
   if quotation then
     if item->>'rfqItemId' is null then raise exception 'RFQ item required'; end if;
     perform (item->>'rfqItemId')::uuid;
     perform public.validate_procurement_decimal(nullif(item->>'unitPrice',''), false);
   elsif length(trim(coalesce(item->>'description',''))) = 0 or length(trim(coalesce(item->>'unit',''))) = 0 then
     raise exception 'description and unit required';
   end if;
 end loop;
 if quotation and (select count(*) <> count(distinct (value->>'rfqItemId')::uuid) from jsonb_array_elements(items)) then raise exception 'duplicate RFQ item'; end if;
end $$;
revoke all on function public.validate_procurement_decimal(text,boolean), public.validate_procurement_items(jsonb,boolean) from public, anon;
grant execute on function public.validate_procurement_decimal(text,boolean), public.validate_procurement_items(jsonb,boolean) to authenticated;

-- Never trust a separately submitted line total. PostgreSQL numeric ROUND
-- matches Decimal.ROUND_HALF_UP for these nonnegative amounts.
create function public.calculate_quote_line_total() returns trigger
language plpgsql security invoker set search_path = pg_catalog as $$
begin
 if new.quantity::text in ('NaN','Infinity','-Infinity') or new.unit_price::text in ('NaN','Infinity','-Infinity') then raise exception 'invalid numeric value'; end if;
 new.line_total := round(new.quantity * new.unit_price, 4);
 return new;
end $$;
revoke all on function public.calculate_quote_line_total() from public, anon, authenticated;
create trigger quote_items_calculate_total before insert or update on public.quote_items
for each row execute function public.calculate_quote_line_total();

-- NOT VALID preserves existing records while enforcing finite values on new writes.
alter table public.vendor_quotes add constraint vendor_quotes_finite_money check (
 (freight_cost is null or freight_cost::text not in ('NaN','Infinity','-Infinity')) and
 (tax_amount is null or tax_amount::text not in ('NaN','Infinity','-Infinity')) and
 (discount_amount is null or discount_amount::text not in ('NaN','Infinity','-Infinity'))
) not valid;
alter table public.rfq_items add constraint rfq_items_finite_quantity
check (quantity::text not in ('NaN','Infinity','-Infinity')) not valid;

create or replace function public.create_rfq_atomic(p_title text,p_description text,p_currency char(3),p_items jsonb) returns uuid language plpgsql security invoker set search_path=public,pg_temp as $$ declare v_id uuid:=gen_random_uuid(); v_item jsonb; begin if auth.uid() is null then raise exception 'authentication required'; end if; perform public.validate_procurement_items(p_items, false);
if p_title is null or length(trim(p_title)) not between 2 and 160 or length(coalesce(p_description,'')) > 4000 or p_currency is null or p_currency not in ('BRL','USD') then raise exception 'invalid RFQ'; end if;
insert into public.rfq_sessions(id,user_id,title,description,currency) values(v_id,auth.uid(),p_title,nullif(p_description,''),p_currency); for v_item in select value from jsonb_array_elements(p_items) loop insert into public.rfq_items(rfq_id,description,quantity,unit,specifications) values(v_id,v_item->>'description',(v_item->>'quantity')::numeric,v_item->>'unit',v_item->'specifications'); end loop; return v_id; end $$;
revoke all on function public.create_rfq_atomic(text,text,char(3),jsonb) from public,anon;
grant execute on function public.create_rfq_atomic(text,text,char(3),jsonb) to authenticated;
create or replace function public.create_quote_atomic(p_rfq_id uuid,p_vendor_name text,p_raw_text text,p_currency char(3),p_freight numeric,p_tax numeric,p_discount numeric,p_delivery integer,p_payment_terms text,p_items jsonb) returns uuid language plpgsql security invoker set search_path=public,pg_temp as $$ declare v_quote uuid:=gen_random_uuid();v_item jsonb;begin if auth.uid() is null or not exists(select 1 from public.rfq_sessions where id=p_rfq_id and user_id=auth.uid()) then raise exception 'not authorized';end if;perform public.validate_procurement_items(p_items, true);
if p_vendor_name is null or length(trim(p_vendor_name)) not between 1 and 160 or length(coalesce(p_raw_text,'')) > 30000 or length(coalesce(p_payment_terms,'')) > 4000 or (p_currency is not null and p_currency not in ('BRL','USD')) or (p_delivery is not null and p_delivery not between 0 and 36500) then raise exception 'invalid quotation'; end if;
perform public.validate_procurement_decimal(p_freight::text, false);
perform public.validate_procurement_decimal(p_tax::text, false);
perform public.validate_procurement_decimal(p_discount::text, false);
insert into public.vendor_quotes(id,rfq_id,vendor_name,raw_text,currency,freight_cost,tax_amount,discount_amount,delivery_days,payment_terms) values(v_quote,p_rfq_id,p_vendor_name,nullif(p_raw_text,''),p_currency,p_freight,p_tax,p_discount,p_delivery,nullif(p_payment_terms,''));for v_item in select value from jsonb_array_elements(p_items) loop if not exists(select 1 from public.rfq_items where id=(v_item->>'rfqItemId')::uuid and rfq_id=p_rfq_id) then raise exception 'RFQ item does not belong to request' using errcode='23503'; end if; insert into public.quote_items(rfq_id,quote_id,rfq_item_id,description,quantity,unit_price,unit,line_total) values(p_rfq_id,v_quote,(v_item->>'rfqItemId')::uuid,nullif(v_item->>'description',''),(v_item->>'quantity')::numeric,nullif(v_item->>'unitPrice','')::numeric,nullif(v_item->>'unit',''),round((v_item->>'quantity')::numeric * nullif(v_item->>'unitPrice','')::numeric,4));end loop;return v_quote;end $$;
revoke all on function public.create_quote_atomic(uuid,text,text,char(3),numeric,numeric,numeric,integer,text,jsonb) from public,anon;
grant execute on function public.create_quote_atomic(uuid,text,text,char(3),numeric,numeric,numeric,integer,text,jsonb) to authenticated;
