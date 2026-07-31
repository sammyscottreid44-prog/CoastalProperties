# Go live on coastapply.com (Railway)

Public link applicants should use: **https://coastapply.com**

## 1) Deploy on Railway

1. Open https://railway.app/new  
2. **Deploy from GitHub repo** → `sammyscottreid44-prog/CoastalProperties`  
3. Use branch `cursor/application-portal-bf3c` (not `main`)  
4. Railway builds with the repo `Dockerfile`  
5. Root Directory must be empty / repo root (not `frontend` or `backend`)  
6. In the service → **Variables**, set:

```text
NODE_ENV=production
APP_BASE_URL=https://coastapply.com
CORS_ORIGINS=https://coastapply.com,https://www.coastapply.com
STORAGE_DRIVER=local
LOCAL_UPLOAD_DIR=./uploads
LOCAL_DATA_DIR=./data
EMAIL_DRIVER=console
EMAIL_FROM=CoastApply <applications@coastapply.com>
NOTIFY_EMAIL=sammyscottreid44@gmail.com
ADMIN_PASSWORD=KqKcSMDffHOc9AHrKqvZgZGi
```

6. Open the Railway-generated `*.up.railway.app` URL and confirm the form loads + `/api/health` works.

## 2) Attach coastapply.com

1. Railway service → **Settings → Networking / Domains** → **Custom Domain**  
2. Add `coastapply.com` and `www.coastapply.com`  
3. Copy the DNS records Railway shows  
4. In Squarespace → Domains → coastapply.com → DNS:
   - Delete old Squarespace website A records (`198.*`)
   - Turn off domain forwarding / www redirects
   - Add exactly what Railway shows (usually CNAME for `www`, and A/ALIAS for `@`)
5. Wait until Railway marks the domain as ready

## 3) Confirm

- https://coastapply.com  
- https://coastapply.com/api/health  
- https://coastapply.com/admin (password above)
