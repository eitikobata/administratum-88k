#!/bin/sh
set -e

# Next.js inlines NEXT_PUBLIC_* variables into the client bundle at BUILD
# time, but EasyPanel only injects environment variables at container
# RUNTIME, with no separate build-arg mechanism for custom Dockerfiles.
# Workaround: the build bakes in unique placeholder tokens instead of real
# values, and this script swaps them for the real runtime values across
# every compiled file, once, right before the server starts.
if [ -n "$NEXT_PUBLIC_API_URL" ]; then
  find /app/.next -type f \( -name '*.js' -o -name '*.html' \) \
    -exec sed -i "s#__NEXT_PUBLIC_API_URL__#$NEXT_PUBLIC_API_URL#g" {} +
fi

if [ -n "$NEXT_PUBLIC_WS_URL" ]; then
  find /app/.next -type f \( -name '*.js' -o -name '*.html' \) \
    -exec sed -i "s#__NEXT_PUBLIC_WS_URL__#$NEXT_PUBLIC_WS_URL#g" {} +
fi

exec "$@"
