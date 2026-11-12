#!/bin/bash
# A small TypeScript project with Claude Code settings and no hooks yet.
set -e
mkdir -p src .claude
cat > package.json <<'JSON'
{"name": "billing", "version": "1.0.0", "scripts": {"test": "node --test"}}
JSON
cat > src/billing.js <<'JS'
export function total(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}
JS
cat > src/billing.test.js <<'JS'
import { test } from "node:test";
import assert from "node:assert";
import { total } from "./billing.js";
test("total adds prices", () => assert.equal(total([{ price: 2 }, { price: 3 }]), 5));
JS
echo '{}' > .claude/settings.json
git init -q && git add -A && git -c user.name=fixture -c user.email=fixture@example.invalid commit -qm fixture
