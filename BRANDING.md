# WAMB'S Consulting — Branding Master Guide

## 1. Logo Analysis

The WAMB'S Consulting logo combines:
- **Monogram "W"** formed by ascending bar chart columns — symbolizes financial growth
- **Upward arrow** breaking through the top — represents fiscal optimization and ambition
- **Circular arc** (open top-right) — conveys protection, trust, and completeness
- **Multi-color gradient** — modern, dynamic, tech-forward identity
- **Typography:** "WAMB'S" in bold stylized sans-serif, "CONSULTING" in structured caps

### Brand Symbolism
| Element | Meaning |
|---------|---------|
| Ascending bars | Financial growth, structured progress |
| Upward arrow | Optimization, tax savings trajectory |
| Circle arc | Protection, holistic advisory |
| Gradient | Innovation, modernity, diversity |

---

## 2. Color Palette

### Primary Colors (from logo gradient)

| Token | Name | HEX | Usage |
|-------|------|-----|-------|
| `--wambs-cyan` | Cyan | `#22D3EE` | Accent highlights, progress bars, active states |
| `--wambs-blue` | Royal Blue | `#3B82F6` | Links, interactive elements, info states |
| `--wambs-purple` | Purple | `#8B5CF6` | Primary brand, headings, key CTAs |
| `--wambs-magenta` | Magenta | `#D946EF` | Accent, hover states, highlights |
| `--wambs-orange` | Amber Arrow | `#F59E0B` | Success states, CTA buttons, results |

### Secondary / Neutral Colors

| Token | Name | HEX | Usage |
|-------|------|-----|-------|
| `--wambs-dark` | Deep Navy | `#0A0F1E` | Background principal |
| `--wambs-panel` | Panel Dark | `#111827` | Cards, form panels |
| `--wambs-surface` | Surface | `#1E293B` | Elevated surfaces, modals |
| `--wambs-border` | Border | `#1E2D45` | Borders, dividers |
| `--wambs-text` | Light Text | `#CBD5E1` | Body text |
| `--wambs-muted` | Muted Text | `#64748B` | Secondary text, labels |
| `--wambs-white` | White | `#F8FAFC` | Headings on dark, emphasis |

### Brand Gradient (CSS)

```css
--wambs-gradient: linear-gradient(135deg, #22D3EE 0%, #3B82F6 25%, #8B5CF6 50%, #D946EF 75%, #F59E0B 100%);
--wambs-gradient-subtle: linear-gradient(135deg, #22D3EE 0%, #8B5CF6 50%, #D946EF 100%);
--wambs-gradient-cta: linear-gradient(135deg, #8B5CF6 0%, #D946EF 50%, #F59E0B 100%);
```

---

## 3. Typography

### Font Pairing (Google Fonts)

| Role | Font | Weight | Usage |
|------|------|--------|-------|
| Headings | **Outfit** | 600, 700 | H1-H3, logo text, CTA labels |
| Body | **Inter** | 400, 500 | Body text, form labels, descriptions |
| Mono/Data | **JetBrains Mono** | 400 | Currency amounts, tax figures |

### Type Scale

| Element | Size (desktop) | Size (mobile) | Weight | Color |
|---------|---------------|---------------|--------|-------|
| H1 (Page title) | 32px | 24px | 700 | white or gradient |
| H2 (Step title) | 24px | 20px | 600 | gradient text |
| H3 (Card title) | 18px | 16px | 600 | `--wambs-white` |
| Body | 16px | 15px | 400 | `--wambs-text` |
| Small/Label | 14px | 13px | 400 | `--wambs-muted` |
| Data/Amount | 28px | 22px | 700 | `--wambs-orange` |

---

## 4. Logo Usage Rules

### Minimum Size
- Digital: 120px width minimum
- Print: 30mm width minimum

### Safe Zone
- Minimum clear space = height of the "W" monogram on all sides
- No text, graphics, or borders may enter the safe zone

### Approved Placements
- Full color on dark backgrounds (`--wambs-dark`)
- Full color on white/light backgrounds
- Monochrome white version on dark surfaces (fallback)

### Forbidden Uses
- Do not rotate the logo
- Do not stretch or distort proportions
- Do not place on busy or patterned backgrounds
- Do not separate the icon from the wordmark in primary placement
- Do not recolor the gradient with non-brand colors
- Do not add shadows, outlines, or effects beyond the original design

---

## 5. Brand Voice & Tone

### Core Attributes
- **Expert** — Deep German tax law knowledge (Steuerrecht)
- **Accessible** — Complex topics made clear in 3 languages
- **Trustworthy** — Precision, transparency, no jargon walls
- **Culturally proximate** — Understanding of diaspora financial realities

### Language Guidelines

| Language | Tone | Register |
|----------|------|----------|
| Deutsch | Professional, clear (Sie-Form) | Formal advisory |
| Francais | Chaleureux, professionnel (Vous) | Conseil de confiance |
| English | Approachable, expert | Professional but warm |

### Do / Don't

| Do | Don't |
|----|-------|
| "Optimieren Sie Ihre Steuerlast" | "Steuern sparen mit diesem Trick" |
| "Decouvrez votre potentiel fiscal" | "Payez moins d'impots!" |
| Use precise fiscal terminology with translations | Use clickbait or urgency pressure |
| Acknowledge multilingual complexity | Assume one-size-fits-all |

---

## 6. Simulator UI Application

### Header / Navbar
- Dark background (`--wambs-dark`)
- Logo (icon + wordmark) left-aligned, max-height 40px
- Language selector: pill buttons with gradient border on active
- Bottom border: 1px gradient line (cyan → purple)

### Buttons

| Type | Style |
|------|-------|
| Primary CTA | `--wambs-gradient-cta` background, white text, rounded-lg |
| Secondary | Transparent, gradient border, gradient text |
| Disabled | `--wambs-surface` bg, `--wambs-muted` text |
| Back/Navigation | Ghost, `--wambs-muted` text, hover → `--wambs-text` |

### Form Elements (Steuerklasse, sliders, checkboxes)
- Cards: `--wambs-panel` bg, `--wambs-border` border
- Selected state: gradient left border (4px), subtle gradient bg glow
- Slider thumb: gradient fill (purple → magenta)
- Slider track: `--wambs-border` with gradient fill on progress
- Checkboxes: gradient accent on checked

### Progress Bar
- Track: `--wambs-border`
- Fill: `--wambs-gradient-subtle` (animated left-to-right)

### Result Screen (Step 5-6)
- Donut chart: gradient segments matching brand colors
- Amount display: `--wambs-orange`, JetBrains Mono, 28px bold
- Potential level badges: cyan (low), purple (medium), orange (high)
- CTA "Reserver": full gradient button, rounded, shadow glow

### Cards & Panels
- Background: `--wambs-panel`
- Border: `--wambs-border`, 1px solid
- Hover: border transitions to gradient
- Selected: left accent border (4px gradient)

---

## 7. CSS Variables Block

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Outfit:wght@600;700&family=JetBrains+Mono:wght@400;700&display=swap');

:root {
  /* === Primary Brand Colors (from logo gradient) === */
  --wambs-cyan: #22D3EE;
  --wambs-blue: #3B82F6;
  --wambs-purple: #8B5CF6;
  --wambs-magenta: #D946EF;
  --wambs-orange: #F59E0B;

  /* === Neutral / Dark Theme === */
  --wambs-dark: #0A0F1E;
  --wambs-panel: #111827;
  --wambs-surface: #1E293B;
  --wambs-border: #1E2D45;
  --wambs-text: #CBD5E1;
  --wambs-muted: #64748B;
  --wambs-white: #F8FAFC;

  /* === Gradients === */
  --wambs-gradient: linear-gradient(135deg, #22D3EE 0%, #3B82F6 25%, #8B5CF6 50%, #D946EF 75%, #F59E0B 100%);
  --wambs-gradient-subtle: linear-gradient(135deg, #22D3EE 0%, #8B5CF6 50%, #D946EF 100%);
  --wambs-gradient-cta: linear-gradient(135deg, #8B5CF6 0%, #D946EF 50%, #F59E0B 100%);
  --wambs-gradient-text: linear-gradient(135deg, #22D3EE 0%, #8B5CF6 50%, #D946EF 100%);

  /* === Typography === */
  --font-heading: 'Outfit', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;

  /* === Spacing === */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-full: 9999px;

  /* === Shadows === */
  --shadow-glow: 0 0 20px rgba(139, 92, 246, 0.15);
  --shadow-cta: 0 4px 20px rgba(217, 70, 239, 0.25);
}
```

---

## 8. Brand Positioning

### Tagline Options
- DE: "Steuerberatung. Modern. Multilingual."
- FR: "Conseil fiscal. Moderne. Multilingue."
- EN: "Tax Advisory. Modern. Multilingual."

### Positioning Statement
WAMB'S Consulting is the modern, multilingual tax advisory firm that combines
deep German fiscal expertise with cultural proximity to Afro-descendant and
diaspora communities. We make complex tax optimization accessible in your
language — Deutsch, Francais, English.

### Trust Signals (for simulator)
- "Steuerberatungskanzlei in Berlin seit [year]"
- "1.000+ Mandanten betreut"
- "Dreisprachig: DE | FR | EN"
- Professional address: Knesebeckstr. 63, 10719 Berlin
