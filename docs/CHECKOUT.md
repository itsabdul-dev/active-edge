# Cart and delivery checkout

Adding an item opens the bag drawer immediately, with pending/success feedback, quantity controls, delivery totals, free-delivery progress and a direct checkout link. The full cart page remains available.

Checkout supports browser address autofill, the signed-in customer's saved addresses, per-tab draft restoration, inline validation, apartment/building details and optional delivery instructions. Instructions and apartment details are stored on the order snapshot through the delivery-instructions migration. They are not added to saved-address records.

## Live street suggestions

Create a free Geoapify project at https://myprojects.geoapify.com/ and configure `GEOAPIFY_API_KEY` in `.env.local` and in Vercel's server environment settings. Do not prefix the key with `VITE_` or commit it. Restart locally and redeploy Vercel after changing environment settings.

Without a key, manual entry and browser autofill continue working. With a key, search starts after four characters and a 400ms typing pause, filters results to South Africa, and fills street, suburb, city and postcode when available. Customers must check the result; missing fields remain editable. Keyboard navigation, attribution and manual fallback are included. Only the street query is sent to Geoapify, not names, email, phone or delivery notes.

The server limits requests per client and caps application requests at 2,400 per day, leaving headroom under the free plan's 3,000 daily credits. Provider quotas can change; check https://www.geoapify.com/pricing/. API failures or exhausted limits fall back to manual entry.

Live provider suggestions still need verification with a configured key. Automated checks cover draft handling, validation, provider response normalization and order snapshot persistence.
