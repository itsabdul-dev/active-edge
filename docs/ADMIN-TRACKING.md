# Store administration and order tracking

Sign in through `/account` with an authorised account, then choose **Manage store** or open `/admin`. The same login is used for shopping and store management. Membership lives in `private.store_admin`, checked against a server-verified Supabase user on every admin request. Customers cannot grant themselves access or call the service-only mutation functions directly.

`admin@activeedge.co.za` is the designated initial admin. Membership is tied to that existing user's ID, not to an editable profile email or user metadata. Additional admins must be provisioned by the database owner.

## Orders

The admin page paginates orders (25 per page), shows customer delivery details and items, and lets the admin advance paid demo orders through:

1. Packing
2. Dispatched (courier and tracking number required)
3. Out for delivery
4. Delivered

Updates are transactional, append a customer-visible event, and record an internal audit entry. Stale updates, skipped stages, unpaid orders and non-demo fulfilment are rejected. Changes do not send emails, book couriers or move real money. Cancellation and refund management are not implemented.

## Inventory

Search by product, colour, size or SKU and save each variant's total stock on hand. Negative quantities, quantities below active reservations and stale overwrites are rejected. Stock edits are recorded in the private audit log. This page shows at most 1,000 variants; the current catalogue fits within that limit.

## Customer tracking

A **Track your order** link appears on the payment receipt and in account order history. `/orders/<order-id>` shows a timestamped delivery timeline, tracking number and order contents. It refreshes every 15 seconds while open. There is no real GPS or courier integration; simulated deliveries are labelled clearly.

Access requires the signed-in order owner or the original guest checkout cookie and a non-expired original cart session. An order UUID or tracking number alone grants no access. New bags preserve the previous converted guest cart's ownership. Guest tracking for older orders whose hashes were already removed cannot be recovered automatically.

## Verification

Database tests cover admin membership protection, unauthorized mutations, stage ordering, stale updates, tracking isolation, stock updates, and guest ownership across a new cart. Build, type checks and targeted lint checks cover the application integration. Browser verification completed with the designated admin: the order list loaded, the existing Demo QA order progressed through all four delivery stages with a saved courier/tracking number and event history, and inventory search and edit controls worked. Inventory values were left unchanged.

Order numbers use `AE-YYYY-000001` with a database sequence. The counter is global (not reset annually), concurrency-safe, and can have gaps after failed transactions. The year uses South African time. The readable-number migration also updates existing UUID-style order numbers and stored payment results; order IDs, tracking URLs, and courier references remain unchanged. Receipts already open in a browser may retain their old cached display until replaced.
