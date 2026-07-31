# Admin access — view & download submissions yourself

## URL

Open:

`https://<your-site>/admin`

Example on the current tunnel:

`https://sufficiently-missed-cleared-valuation.trycloudflare.com/admin`

## Password

Set in `.env` / host environment:

```bash
ADMIN_PASSWORD=your-long-random-password
```

Current local/tunnel password (change anytime):

```text
KqKcSMDffHOc9AHrKqvZgZGi
```

## What you can do

- See every application (newest first)
- Open **View** for a clean layout of applicant details (identity, employment, address, household, references)
- **View** uploaded images in a lightbox; open PDFs inline
- Download individual files
- Download each application as its own **ZIP** (readable summary + JSON + all files in folders)
- **Download all ZIPs** from the main list (one master ZIP containing every application ZIP)

## Notes

- This reads from local `data/` + `uploads/` (or S3 metadata when configured)
- Keep `ADMIN_PASSWORD` private
- Change the password after first login if this chat is shared
