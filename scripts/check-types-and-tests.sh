#!/bin/bash
echo "🔍 Checking Types..."
pnpm tsc --noEmit
if [ $? -ne 0 ]; then
  echo "❌ Type errors found!"
  exit 1
fi

echo "🧪 Running vitest..."
pnpm vitest run
if [ $? -ne 0 ]; then
  echo "❌ Some tests failed!"
  exit 1
fi

echo "✅ All good. Types + tests passed!" 