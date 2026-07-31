# Point coastapply.com at Railway

**Public URL:** https://coastapply.com  
**Host:** Railway  
**DNS:** Squarespace Domains

## Deploy first

Follow `docs/INSTANT_ACCESS.md` so the app is live on a `*.up.railway.app` URL.

## Custom domain

1. Railway → your service → **Domains** → add `coastapply.com` and `www.coastapply.com`
2. Railway will show the exact DNS records to create
3. Squarespace → **Domains** → **coastapply.com** → **DNS**
4. Delete Squarespace website A records (`198.185.159.*` / `198.49.23.*`)
5. Turn **off** Squarespace domain forwarding / www redirect (Railway owns redirects)
6. Add the records Railway shows, then save

## Confirm

- https://coastapply.com → CoastApply form  
- https://coastapply.com/api/health → OK  
- https://coastapply.com/admin → admin login
