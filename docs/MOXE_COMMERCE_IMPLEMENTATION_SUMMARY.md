# MOxE Commerce Implementation – Summary & Buyer Experience

Dual-mode commerce: **Business accounts sell, all accounts buy.**

---

## 1. Commerce Architecture

- **All account types** (Personal, Creator, Business, Job): Buyer view (Commerce hub), Explore posts with product tags → Checkout flow → Order history.
- **Business only**: Seller view (Commerce page), product management, order fulfillment, shop settings; also has full buyer access.

---

## 2. Route Configuration

- **Checkout** (`/checkout`): `<ProtectedRoute>` only – no `requiredType="BUSINESS"`. All authenticated users can checkout.
- **Commerce** (`/commerce`, `/commerce/orders`, etc.): `<ProtectedRoute>`. Page content is conditional on account type.

---

## 3. Commerce Page – Conditional Rendering

- **Business** (`cap.canCommerce === true`): Full seller dashboard (products, orders, shop settings).
- **Non-Business** (Personal, Creator, Job): Buyer view:
  - Title: MOxE Shop
  - Two cards: **Cart & Checkout** (icon + “Review your cart and complete purchases”), **My Orders** (icon + “Track your purchases and reorder”)
  - Info note: “Products can be discovered in Explore and on posts with product tags. Only Business accounts can sell on MOxE.” with link to Explore.

---

## 4. Checkout Flow – Available to All

| Step              | Access   |
|-------------------|----------|
| Cart review       | All users |
| Address selection | All users |
| Payment method    | All users |
| Order confirmation| All users |
| Order history     | All users |

---

## 5. Product Discovery

1. Explore page  
2. Feed posts with product tags  
3. Direct product links  
4. Commerce page (buyer hub for non-Business)

---

## 6. Key Files

| File                    | Role |
|-------------------------|------|
| `FRONTEND/src/App.tsx` | Checkout route without `requiredType="BUSINESS"` |
| `FRONTEND/pages/commerce/Commerce.tsx` | Conditional buyer vs seller view |
| Checkout / Orders pages | Already work for all users |

---

## 7. Testing Checklist by Account Type

| Test                          | Personal | Creator | Job | Business |
|-------------------------------|----------|---------|-----|----------|
| Commerce page shows buyer view| ✅       | ✅      | ✅  | ❌ (seller) |
| Can access `/checkout`        | ✅       | ✅      | ✅  | ✅       |
| Can view orders               | ✅       | ✅      | ✅  | ✅       |
| Can add to cart / complete purchase | ✅ | ✅     | ✅  | ✅       |
| Sees “Only Business can sell” note | ✅ | ✅   | ✅  | ❌       |

---

## 8. API Access

- Cart, orders, checkout: all authenticated users.
- Seller product/order management: Business only (backend enforces).

### 8.1 API access by account type

| Endpoint | Personal | Creator | Job | Business |
|----------|----------|---------|-----|----------|
| `GET /api/commerce/products` | Yes | Yes | Yes | Yes |
| `GET /api/commerce/products/:id` | Yes | Yes | Yes | Yes |
| `POST /api/commerce/cart` (add/update) | Yes | Yes | Yes | Yes |
| `POST /api/commerce/cart/checkout` | Yes | Yes | Yes | Yes |
| `GET /api/commerce/orders` (as buyer) | Yes | Yes | Yes | Yes |
| Seller product/order management | No | No | No | Yes |

---

## 9. Testing verification

To confirm the implementation:

1. **Personal account** – Log in as personal; go to Commerce → buyer view (Cart & Checkout, My Orders); open Cart & Checkout → `/checkout`; open My Orders → order history; info note shows "Only Business accounts can sell".
2. **Creator account** – Same as Personal (buyer view, all links work).
3. **Job account** – Same buyer experience.
4. **Business account** – Commerce page shows seller dashboard (not buyer view); can still access `/checkout` to buy.

---

## 10. Troubleshooting

| Issue                    | Likely cause              | Action |
|--------------------------|---------------------------|--------|
| Cart not updating        | Redux/cache               | Invalidate cart / clear store |
| Checkout fails            | Payment config            | Backend logs; API keys |
| Business sees buyer view | Capabilities not loaded   | Check `useAccountCapabilities`; `/api/accounts/me` |
| Orders not showing       | Wrong user filter         | Verify orders fetched for current user |

---

## 11. Next steps (optional enhancements)

| Enhancement | Description |
|-------------|-------------|
| Product reviews | Allow all buyers to rate and review products |
| Wishlist | Save items for later purchase |
| Reorder from orders | One-click reorder from order history |
| Product recommendations | Personalized based on purchase history |
| Gift cards | Purchase and redeem digital gift cards |

---

## 12. Summary

- Buyer experience for **all** account types.  
- Seller experience **only** for Business.  
- Unified checkout and order history for everyone.  
- UI and routes reflect account capabilities.
