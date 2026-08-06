#!/bin/sh
set -eu

node ./node_modules/prisma/build/index.js migrate deploy

cat > /etc/crontabs/root <<EOF
* * * * * curl -fsS -H "Authorization: Bearer ${CRON_SECRET}" "http://127.0.0.1:3000/api/cron" >/dev/null 2>&1
EOF

crond
exec su-exec nextjs:nodejs node server.js
