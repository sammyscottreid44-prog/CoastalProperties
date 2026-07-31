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

- See every submission (newest first)
- Open a submission to view the full JSON details
- Download individual uploaded files
- Download a **ZIP** of the whole submission (JSON + all files + PDF)

## Notes

- This reads from local `data/` + `uploads/` (or S3 metadata when configured)
- Keep `ADMIN_PASSWORD` private
- Change the password after first login if this chat is shared
