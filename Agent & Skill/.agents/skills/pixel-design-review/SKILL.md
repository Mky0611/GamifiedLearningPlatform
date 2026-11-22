---
name: pixel-design-review
description: "Audit the original Lex Raid pixel interface consistently across screens."
---
# pixel-design-review
## Workflow
1. Inventory HUD, cards, buttons, menu, popups, icons, fonts and sprites; identify styles that violate pixel consistency.
2. Derive a limited palette, pixel-border tokens, 9-slice rules, bitmap font-size scale and spacing system without copying copyrighted game artwork.
3. Inspect CSS rules and computed layout; check for unexpected border-radius, blur, transform and stacking contexts.
4. Propose a reusable design-token CSS file and migration order with minimal risk.
5. Require desktop/mobile screenshots and interaction checks before marking complete.
