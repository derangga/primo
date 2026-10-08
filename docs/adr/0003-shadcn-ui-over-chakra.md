---
status: accepted
---

# shadcn/ui on Tailwind, not Chakra UI

Components come from shadcn/ui and are copied into `apps/web/src/components/ui`, styled with Tailwind v4. We chose it over Chakra UI v3 because Chakra styles through Emotion at runtime, which adds JavaScript and render work, and because shadcn's theme is plain CSS custom properties, which is the form the design system's tokens are delivered in.

## Consequences

- Only the components the three views use are added. There is no component package to upgrade; changes to a component are edits to our own files.
- Design tokens map onto shadcn's variable names, with extra variables for the map buckets.
