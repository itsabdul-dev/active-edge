# ActiveEdge backend

## Connected project

- Supabase project: `activeedge` (`mfzpfhwzyxrajzdjpsby`)
- URL: `https://mfzpfhwzyxrajzdjpsby.supabase.co`
- Frontend: existing TanStack Start / React app. No frontend deployment is performed by the setup scripts.

## Local development

Use Node 22.20 or newer. Copy `.env.example` to `.env.local` and fill in the project's publishable and server-only secret keys. The current workstation is already configured. `.env.local` is ignored by Git; never commit it or paste its contents into documentation.

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 3000
npm run typecheck
npm test
npm run build
```

Open `http://localhost:3000`. Use that hostname for auth callbacks. Development and preview scripts load `.env.local`; Vercel must receive the same variables through its environment settings. Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are public. `SUPABASE_SECRET_KEY` stays on the server.

## Implemented

- Email/password sign-in, signup, confirmation callback, reset request and password update.
- Customer profile editing, saved address creation/removal, and order-history details.
- Public product catalogue loaded from Supabase; 11 products, 25 colours/photos and 123 colour/size variants imported.
- Product photos in the public `product-images` Storage bucket, referenced by object path in `product_image`. Upload access is server/admin only. Images have content-hashed names for cache-safe updates.
- Guest carts identified by a random HttpOnly cookie whose hash is stored in the database. Signed-in carts use the verified auth user ID. Guest carts merge once into the account cart on login.
- Browser cart changes use server functions. Browser-supplied prices, totals and customer IDs are not accepted.
- Server-only pending-order transaction locks stock rows, snapshots product and delivery details, calculates totals in cents, and makes 15-minute reservations. Repeating an order request for the same cart returns the original order. Expired reservations no longer consume availability.
- ERD tables for payments, payment-event deduplication, shipments, returns/exchanges/repairs, refunds, and newsletter requests. These operational tables are not publicly writable.
- Newsletter forms save pending requests; no mailing provider or double-opt-in email is connected yet.

`customer.customer_id` references `auth.users.id`; Auth owns the email and credentials. Guest orders have no customer ID. Existing guest orders are **not** assigned to accounts merely because their email matches. Order snapshots preserve historic contact/product information. Account deletion is intentionally restricted while linked customer/order records exist; build an explicit retention-aware deletion flow before exposing it.

## Inventory and payment status

All imported SKUs start with **zero stock**. No quantities were invented. Set actual counts in Supabase's `product_variant.stock_on_hand` before selling. Catalogue import intentionally omits stock updates so rerunning it preserves existing counts.

Checkout remains an explicit demo. It collects no card information, takes no money, places no order, and preserves the bag. `CHECKOUT_ENABLED=false` is a server-side gate on the pending-order API. Do not enable it by itself: the frontend has not been wired to live order/payment creation.

Before enabling purchases, integrate the chosen payment provider, verify webhook signatures and payment amounts, deduplicate events, atomically consume/release reservations, handle late success and refunds, send confirmations, and connect fulfilment. Add scheduled expiry/cancellation processing so pending-order status follows expired reservations. Returns/refunds currently have schema and read access, not a complete operational workflow.

## Auth configuration

`supabase/config.toml` declares only the auth settings managed here: approved production/local callback URLs, confirmed email signup, and minimum password length. Preview changes with `npx supabase config diff` before `npx supabase config push`.

The confirmation callback supports both PKCE `code` exchange and `token_hash` verification. PKCE links need the browser that initiated signup/reset. Redirects after verification are restricted to the account or password-reset pages.

Before public launch, configure a production SMTP service and sender domain, then test actual delivery of confirmation and reset emails. The default Supabase email service is for limited testing. The automated recovery test uses a generated test link without sending mail. Supabase's advisor also flagged disabled leaked-password protection; review availability for the project plan before enabling it.

## Schema and verification

The migration in `supabase/migrations` is the source of truth. `database.types.ts` is generated from the hosted database; `database.ts` adjusts only nullable guest RPC arguments the generator cannot infer. Every application table has RLS. Customers can read only their own profiles, addresses, orders and order items. Cart/order transaction helpers use invoker privileges and are executable only by `service_role`.

```sh
# Uses temporary synthetic users and deletes them after the test.
npm run db:verify
# Updates catalogue details/photos, preserving stock. ActiveEdge project only.
npm run catalogue:import
npx supabase db advisors --linked --type all --level warn
npx supabase gen types --linked --lang typescript > src/lib/supabase/database.types.ts
```

`npm test` runs migrations in isolated PGlite with minimal Supabase auth/storage stubs and tests constraints, RLS, ownership, cart merging, snapshots/totals, order retries and stock reservations. `db:verify` checks the real Supabase API, public photo delivery, account login/profile/address isolation, password recovery, and service-only cart access. Neither test places a real paid order or sends email.

Browser fixture tooling is only for development verification and must be cleaned up with its `cleanup` command. Do not use it for real customer accounts.

## Deployment checklist

1. Set the three Supabase environment variables in Vercel; keep checkout disabled.
2. Deploy the frontend changes and verify production cookie/callback flows.
3. Configure SMTP and verify real inbox delivery.
4. Enter verified inventory quantities.
5. Complete payment/webhook/fulfilment integration before accepting purchases.
6. Add persistent request rate limits/bot protection for public newsletter and guest-cart endpoints before public launch.
