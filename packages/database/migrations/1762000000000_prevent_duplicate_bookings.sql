-- Allow pending bookings while Zoom/Calendar are provisioned
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('pending', 'confirmed', 'rescheduled', 'cancelled'));

-- One paid booking per Stripe PaymentIntent (webhook + client race)
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_stripe_payment_intent_unique
  ON bookings (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

-- One active free session per email + service (retry / double-submit protection)
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_free_session_unique
  ON bookings (lower(client_email), service_id)
  WHERE amount = 0 AND status != 'cancelled';
