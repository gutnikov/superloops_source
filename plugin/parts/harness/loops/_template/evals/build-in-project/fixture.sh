#!/bin/bash
# The smallest project in which the failure can happen. The script runs in the empty workspace and cannot read the
# case's folder, so it writes every file itself.
set -e
mkdir -p src
printf 'export function total(items) {\n  // TODO: handle currencies\n  return items.reduce((a, b) => a + b, 0);\n}\n' > src/app.js
git init -q && git add -A && git -c user.name=fixture -c user.email=fixture@example.invalid commit -qm fixture
