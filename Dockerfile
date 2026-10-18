# Creator Toolkit: static site + same-origin /api proxy.
# Stage 1 points the three JS modules that call the hosted YouTube-data proxy
# at a relative /api path; stage 2 serves the site with nginx, which forwards
# /api to the proxy server-side (the proxy's browser CORS allow-list only
# covers the official site origin).
FROM alpine:3.20 AS js-patch
WORKDIR /site
COPY assets/js/ assets/js/
RUN sed -i 's|https://yt-transcript-proxy.pages.dev/api|/api|g' \
    assets/js/tools.js assets/js/link-tools.js assets/js/video-tools.js

FROM nginx:1.27-alpine
COPY . /usr/share/nginx/html/
COPY --from=js-patch /site/assets/js/ /usr/share/nginx/html/assets/js/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
