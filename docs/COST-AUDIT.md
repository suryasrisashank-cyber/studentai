# StudentAI — ₹0 Cost Audit & Infrastructure Verification

**Date:** September 2026  
**Auditor:** StudentAI Autonomous Architecture Review  
**Status:** 100% Verified ₹0 Cost

---

## 1. Executive Summary

StudentAI is intentionally designed and built under a **strict ₹0 upfront and ongoing operational cost policy**. Every utility, calculator, media formatter, and study tool runs **100% client-side** inside the user's browser.

No paid APIs, subscriptions, cloud databases, authentication gateways, email delivery systems, or external analytics were introduced.

---

## 2. Itemized Cost Audit Breakdown

| Infrastructure Component | Status in MVP | Operating Cost (₹) | Implementation Method |
| :--- | :--- | :--- | :--- |
| **Paid AI APIs (OpenAI / Anthropic / Gemini / Claude)** | **NOT USED** | **₹0.00** | Uses deterministic client-side JavaScript algorithms, tokenizers, and curated knowledge banks. No AI API keys or credit cards required. |
| **Backend Servers / VPS / Compute** | **NOT USED** | **₹0.00** | Static client-side Single Page Application (Next.js Static HTML/JS export). Runs entirely in browser memory. |
| **Cloud Database (Supabase / Firebase / Postgres / Neon)** | **NOT USED** | **₹0.00** | Browser `window.localStorage` with versioned schema (`studentai:v1:*`). Includes full user-controlled JSON backup export and import. |
| **User Authentication (Clerk / Auth0 / Supabase Auth)** | **NOT USED** | **₹0.00** | Zero account friction. Tools are instantly usable without signing up, entering email, phone number, or social OAuth. |
| **Domain Name Registration** | **NOT USED** | **₹0.00** | Operates on free provider subdomains (e.g. `*.github.io`, `*.pages.dev`, `*.vercel.app`) without custom domain expense. |
| **Website Hosting / CDN** | **FREE STATIC** | **₹0.00** | Deployable on 100% free static hosting tiers (GitHub Pages, Cloudflare Pages, Vercel Hobby, or Netlify Free). |
| **Analytics & Session Recording (GA / Hotjar / PostHog)** | **NOT USED** | **₹0.00** | Zero tracking scripts installed. Maximizes privacy and eliminates analytics vendor fees. |
| **Image / Document / PDF Processing APIs** | **NOT USED** | **₹0.00** | HTML5 Canvas, FileReader, and Web Cryptography APIs execute image compression, resizing, and QR generation in-memory. |
| **Payment Gateway / Billing (Stripe / Razorpay)** | **NOT USED** | **₹0.00** | Entire MVP is completely free. No payment integration or gateway fees. |
| **Email Service Provider (Resend / SendGrid / SES)** | **NOT USED** | **₹0.00** | No emails collected or transmitted. |
| **Monitoring & Error Tracking (Sentry / Datadog)** | **NOT USED** | **₹0.00** | Zero monitoring SaaS dependencies. |
| **Total Monthly Operating Cost** | — | **₹0.00 / month** | **Guaranteed Free Operation** |

---

## 3. Deployment & Hosting Verification

The application outputs a static bundle (`next build` with `output: 'export'`), producing standalone static assets in the `out/` folder:

1. **GitHub Pages:**
   - Cost: ₹0
   - Terms: Free for public personal and open-source project repositories.
2. **Cloudflare Pages:**
   - Cost: ₹0
   - Terms: Free tier provides unlimited bandwidth, global Anycast CDN, and 500 builds/month.
3. **Vercel Hobby:**
   - Cost: ₹0 for non-commercial and student personal projects.

*Note: The application requires zero environment variables or backend secrets to build and serve.*
