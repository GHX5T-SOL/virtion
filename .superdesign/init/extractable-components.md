# Extractable Components

## VirtionTopBar
- Source: `src/components/primitives.tsx`
- Category: layout
- Description: Glass top navigation with Virtion identity, breadcrumb, and system status.
- Extractable props: activeStep (string), showProfile (boolean, default false)
- Hardcoded: Virtion mark, nav labels, status copy, all CSS.

## VirtionWordmark
- Source: `src/components/primitives.tsx`
- Category: basic
- Description: Abstract V/orbit brand mark with Virtion wordmark.
- Extractable props: size (number, default 36), dark (boolean, default false)
- Hardcoded: SVG mark, "Virtion" text.

## HomeHero
- Source: `src/components/HomeScreen.tsx`
- Category: layout
- Description: Startup-grade hero/product dashboard entry for Virtion.
- Extractable props: startHref or startAction, roadmapVisible.
- Hardcoded: platform narrative, safety copy, product pillars.

## GlassActionCard
- Source: legacy classes in `src/styles/global.css`
- Category: basic
- Description: Repeated dark glass card/action tile pattern.
- Extractable props: title, body, badge, tone.
- Hardcoded: border, blur, glow and spacing tokens.
