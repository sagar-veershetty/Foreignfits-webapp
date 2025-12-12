-- Update payment method constraints to support UPI
-- Drop the old constraints
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_payment_method_check;
ALTER TABLE sale_payments DROP CONSTRAINT IF EXISTS sale_payments_payment_method_check;

-- Add new constraints that include UPI
ALTER TABLE sales ADD CONSTRAINT sales_payment_method_check 
    CHECK (payment_method IN ('CASH', 'CARD', 'UPI', 'OTHER'));

ALTER TABLE sale_payments ADD CONSTRAINT sale_payments_payment_method_check 
    CHECK (payment_method IN ('CASH', 'CARD', 'UPI', 'OTHER'));
