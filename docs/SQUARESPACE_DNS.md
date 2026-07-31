# Squarespace DNS for CoastApply

Domain registrar: **Squarespace** (`coastapply.com`)  
App host: **Vercel** (this repo)  
Operator email: sammyscottreid44@gmail.com

## Why not host the app on Squarespace?

Squarespace website hosting cannot run this portal’s Express API, multipart uploads, PDF generation, or Resend invite flow. Keeping the domain on Squarespace and pointing DNS to Vercel is the supported setup.

## Replace Squarespace website records

Your current HTTPS/ALPN hints used Squarespace IPs:

- `198.185.159.144`
- `198.185.159.145`
- `198.49.23.144`
- `198.49.23.145`

Those are for Squarespace’s own website product. For CoastApply, use Vercel instead:

| Type | Host | Data | Purpose |
| --- | --- | --- | --- |
| A | `@` | `76.76.21.21` | apex → Vercel |
| CNAME | `www` | `cname.vercel-dns.com` | www → Vercel |

### Squarespace UI path

1. Squarespace → **Domains** → **coastapply.com**
2. **DNS** / **DNS settings**
3. Delete conflicting Squarespace website A/CNAME records
4. Add the two records above
5. Save

## After DNS

1. In Vercel → Domains → add `coastapply.com` + `www.coastapply.com` until status is **Valid**
2. Open https://coastapply.com — you should see CoastApply
3. Hit https://coastapply.com/api/health
4. Run `SMOKE_API_BASE=https://coastapply.com npm run smoke`

## Email DNS (Resend)

When you create a Resend domain for `coastapply.com`, Resend will show TXT/CNAME (and sometimes MX) values. Add those in the same Squarespace DNS panel. Do not remove the Vercel A/CNAME website records when adding mail records.
