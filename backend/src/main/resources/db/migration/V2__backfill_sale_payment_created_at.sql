-- Backfill sale_payments.created_at for existing rows using sale created_at
UPDATE sale_payments
SET created_at = (
    SELECT s.created_at
    FROM sales s
    WHERE s.id = sale_payments.sale_id
)
WHERE created_at IS NULL;
