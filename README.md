# CRMProjectWebsite

Single-page marketing site for the Freehold CRM offer.

## Local preview

```bash
cd /Users/samwilkinson/Documents/vscode/CRMProjectWebsite
python3 server.py
```

Then open `http://127.0.0.1:8080`.

## Optional HTTPS

`server.py` will serve TLS if both `TLS_CERTFILE` and `TLS_KEYFILE` are set.

## Current live setup

- Host: `157.245.46.52`
- Live URL: `https://157.245.46.52/`
- Service: `crmprojectwebsite.service`
- App path: `/opt/crmprojectwebsite`

The current TLS certificate is self-signed because the site is running directly on an IP address. Browsers will show a certificate warning until this is moved behind a real domain and certificate.
