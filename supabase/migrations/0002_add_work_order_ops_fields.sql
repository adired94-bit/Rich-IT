-- Add ops workflow fields to work_orders
-- Tracks completion and payment status independently from document lifecycle

alter table work_orders
  add column is_completed boolean not null default false,
  add column completed_at timestamptz,
  add column is_paid boolean not null default false,
  add column paid_at timestamptz;

create index work_orders_is_paid_idx on work_orders (is_paid);

comment on column work_orders.is_completed is 'Ops: work has been completed (בוצע)';
comment on column work_orders.completed_at is 'Timestamp when work was marked completed';
comment on column work_orders.is_paid is 'Ops: payment has been received (שולם)';
comment on column work_orders.paid_at is 'Timestamp when payment was marked received';
