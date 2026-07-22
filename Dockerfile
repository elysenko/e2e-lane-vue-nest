# syntax=docker/dockerfile:1
FROM nginx:1.27-alpine

# Placeholder page — this repository is an empty template (only README.md).
# Once source code lands, the deploy agent will overwrite this Dockerfile.
RUN printf '%s\n' \
  '<!doctype html>' \
  '<html lang="en">' \
  '<head><meta charset="utf-8"><title>e2e-lane-vue-nest</title>' \
  '<meta name="viewport" content="width=device-width,initial-scale=1">' \
  '<style>body{font-family:system-ui,sans-serif;max-width:640px;margin:6rem auto;padding:0 1rem;color:#222}code{background:#f2f2f2;padding:.15rem .35rem;border-radius:.25rem}</style>' \
  '</head><body>' \
  '<h1>e2e-lane-vue-nest</h1>' \
  '<p>Placeholder deployment. The repository currently contains no application source — only <code>README.md</code>.</p>' \
  '<p>The Colossus pipeline will replace this page automatically once code is added to <code>main</code>.</p>' \
  '</body></html>' \
  > /usr/share/nginx/html/index.html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
