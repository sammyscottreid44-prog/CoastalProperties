# Admin access — view & download submissions

## URL

**https://coastapply.com/admin**

(Also works on your Railway URL, e.g. `https://….up.railway.app/admin`, before DNS finishes.)

## Password

Set in the host environment (`ADMIN_PASSWORD` on Railway):

```bash
ADMIN_PASSWORD=your-long-random-password
```

## What you can do

- See every application (newest first)
- Open **View** for a clean layout of applicant details
- **View** uploaded images in a lightbox; open PDFs inline
- Download individual files
- Download each application as its own **ZIP**
- **Download all ZIPs** from the main list

## Notes

- Reads from local `data/` + `uploads/` (or S3 when configured)
- Keep `ADMIN_PASSWORD` private
