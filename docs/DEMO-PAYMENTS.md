# Lecturer payment demonstration

This is a simulator, not a payment processor. No bank, wallet, card network, SMS service, fulfilment or email provider is contacted. Use synthetic details only.

## Walkthrough

1. Add an in-stock product and continue through delivery details.
2. Choose Card and enter a test number (no sample-card controls or scenario selectors appear in checkout):
   - Visa: `4111 1111 1111 1111`
   - Mastercard: `5555 5555 5555 4444`
   - Any future MM/YY expiry and three-digit CVV; any demo cardholder name.
3. The card preview updates as you type and flips on security-code focus. Change the card's last digit to demonstrate checksum rejection.
4. Press Pay. Valid card details proceed to verification. Enter `123456` within three minutes to approve, or Cancel to retain the bag. Incorrect codes show a validation error. No SMS is sent.
5. Apple Pay and Google Pay open labelled simulated wallet confirmations. Confirm to approve or Cancel to return to checkout. They do not access a real device wallet or use biometrics.
6. Processing and success screens animate; reduced-motion preferences disable the animation. An approved payment shows a printable receipt with a DEMO order number/reference. Signed-in customers can see it in account history.

There are no customer-facing outcome selectors. Valid-format cards approve after verification, while wallets approve after confirmation. The backend retains decline outcomes for automated tests, not customer controls. All pages retain a clear demo-mode notice.

## Data and behaviour

- Full card number, CVV, expiry and cardholder name are never included in payment requests or browser storage. Only brand and last four digits are submitted with the chosen demo scenario.
- Strict server input validation, verified session/guest ownership, service-only invoker RPCs and a persistent 20/minute hashed-IP payment limit protect the endpoint.
- The transaction validates current cart totals, creates the order and stock reservations, immediately consumes reservations on approval, deducts stock and records a successful demo payment atomically. Demo orders are paid simulations, never real settled funds.
- Failed/cancelled outcomes are logged in `private.demo_payment_attempt`, without creating orders or reserving stock. This intentionally simplifies a real gateway's pending/expiry lifecycle.
- Attempt IDs prevent replay/duplicate stock deduction. Refresh recovers a completed attempt if its browser receipt was not saved. Recovery checks cart ownership. An unresolved request retains its attempt ID for safe retry.
- A unique active-guest token index allows a fresh empty bag after payment while converted carts retain ownership for receipt recovery.
- Test transactions can be inspected in Supabase: `sales_order` and `payment` where `is_demo=true`; failed/cancelled attempts in the private table through SQL Editor. No separate administrator dashboard or refund workflow is included.
- Verification is a UI simulation, not a security boundary. The backend accepts explicit simulated outcomes; never repurpose this endpoint for real money.

## Deployment and switching off

Database migrations are applied to the connected ActiveEdge project. Deploy frontend/server code to Vercel with the existing Supabase variables and `CHECKOUT_ENABLED=false`. No new payment-provider credentials are needed.

Before any real gateway launch, disable the simulator with:

```sql
update private.payment_demo_settings set enabled=false where id=true;
```

Real payments require a separate provider integration, tokenised/hosted card collection and verified webhook processing. Do not fulfil demo orders. Demo success changes the shared demonstration inventory; reset counts deliberately between presentations if needed.

## Verification

`npm test` covers card recognition/checksums/expiry/CVV, database access restrictions, changed-price rejection, decline retention, successful payment/stock consumption, replay idempotency, receipt ownership and the kill switch. Existing tests cover reservation stock exhaustion and customer order isolation.
