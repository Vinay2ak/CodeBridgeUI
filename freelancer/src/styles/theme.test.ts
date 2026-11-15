import { describe, it, expect } from "vitest";

// sRGB luminance and contrast calculations per WCAG 2.1
export function hexToRgb(hex: string): [number, number, number] {
  const cleanHex = hex.replace("#", "").trim();
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return [r, g, b];
}

export function rgbToHex(rgb: [number, number, number]): string {
  return (
    "#" +
    rgb
      .map((c) => {
        const hex = Math.round(Math.max(0, Math.min(255, c))).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
}

// Emulates CSS color-mix(in srgb, color1 p1%, color2)
export function colorMix(
  c1: [number, number, number],
  p1: number,
  c2: [number, number, number]
): [number, number, number] {
  const w1 = p1 / 100;
  const w2 = 1 - w1;
  return [
    c1[0] * w1 + c2[0] * w2,
    c1[1] * w1 + c2[1] * w2,
    c1[2] * w1 + c2[2] * w2,
  ];
}

function srgbChannelToLinear(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(rgb: [number, number, number]): number {
  const r = srgbChannelToLinear(rgb[0]);
  const g = srgbChannelToLinear(rgb[1]);
  const b = srgbChannelToLinear(rgb[2]);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(
  c1: [number, number, number],
  c2: [number, number, number]
): number {
  const l1 = relativeLuminance(c1);
  const l2 = relativeLuminance(c2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("WCAG Theme Contrast Assertions", () => {
  const white: [number, number, number] = [255, 255, 255];
  const black: [number, number, number] = [0, 0, 0];

  describe("Dark Theme", () => {
    const bg = hexToRgb("#0B132B");
    const surface = hexToRgb("#1C2541");
    const raised = hexToRgb("#26324F");
    const text = hexToRgb("#EEF2F7");
    const muted = hexToRgb("#9FB3C8");
    const primary = hexToRgb("#5BC0DE");
    const onPrimary = hexToRgb("#0B132B");
    const money = hexToRgb("#D97706");
    const onMoney = hexToRgb("#0B132B");
    const success = hexToRgb("#34D399");
    const warning = hexToRgb("#FBBF24");
    const danger = hexToRgb("#F87171");

    // Derived tokens for dark theme
    // Let's test derived percentages
    // money-text: color-mix(in srgb, var(--money) 65%, white) gives good contrast on raised
    const moneyText = colorMix(money, 65, white);
    // line-strong: color-mix(in srgb, var(--text-muted) 80%, var(--surface))
    const lineStrong = colorMix(muted, 80, surface);

    it("text on canvas, surface, raised >= 4.5", () => {
      expect(contrastRatio(text, bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(text, surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(text, raised)).toBeGreaterThanOrEqual(4.5);
    });

    it("muted on canvas, surface, raised >= 4.5", () => {
      expect(contrastRatio(muted, bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(muted, surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(muted, raised)).toBeGreaterThanOrEqual(4.5);
    });

    it("primary on canvas, surface >= 4.5 and >= 3 on canvas", () => {
      expect(contrastRatio(primary, bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(primary, surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(primary, bg)).toBeGreaterThanOrEqual(3.0);
    });

    it("on-primary on primary >= 4.5", () => {
      expect(contrastRatio(onPrimary, primary)).toBeGreaterThanOrEqual(4.5);
    });

    it("on-money on money >= 4.5", () => {
      expect(contrastRatio(onMoney, money)).toBeGreaterThanOrEqual(4.5);
    });

    it("money-text on canvas, surface, raised >= 4.5", () => {
      expect(contrastRatio(moneyText, bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(moneyText, surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(moneyText, raised)).toBeGreaterThanOrEqual(4.5);
    });

    it("success, warning, danger on surface >= 4.5", () => {
      expect(contrastRatio(success, surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(warning, surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(danger, surface)).toBeGreaterThanOrEqual(4.5);
    });

    it("line-strong on surface >= 3", () => {
      expect(contrastRatio(lineStrong, surface)).toBeGreaterThanOrEqual(3.0);
    });
  });

  describe("Light Theme", () => {
    const bg = hexToRgb("#FBF6EE");
    const surface = hexToRgb("#FFFFFF");
    const raised = hexToRgb("#F3EBDD");
    const text = hexToRgb("#0B132B");
    const muted = hexToRgb("#3A506B");
    const primary = hexToRgb("#1C2541");
    const onPrimary = hexToRgb("#FFFFFF");
    const money = hexToRgb("#D97706");
    const onMoney = hexToRgb("#0B132B");
    const success = hexToRgb("#047857");
    const warning = hexToRgb("#B45309");
    const danger = hexToRgb("#B91C1C");

    // Derived tokens for light theme: 70% money and 30% black to ensure >= 4.5 contrast on raised
    const moneyText = colorMix(money, 70, black);
    const lineStrong = colorMix(muted, 80, surface);

    it("text on canvas, surface, raised >= 4.5", () => {
      expect(contrastRatio(text, bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(text, surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(text, raised)).toBeGreaterThanOrEqual(4.5);
    });

    it("muted on canvas, surface, raised >= 4.5", () => {
      expect(contrastRatio(muted, bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(muted, surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(muted, raised)).toBeGreaterThanOrEqual(4.5);
    });

    it("primary on canvas, surface >= 4.5 and >= 3 on canvas", () => {
      expect(contrastRatio(primary, bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(primary, surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(primary, bg)).toBeGreaterThanOrEqual(3.0);
    });

    it("on-primary on primary >= 4.5", () => {
      expect(contrastRatio(onPrimary, primary)).toBeGreaterThanOrEqual(4.5);
    });

    it("on-money on money >= 4.5", () => {
      expect(contrastRatio(onMoney, money)).toBeGreaterThanOrEqual(4.5);
    });

    it("money-text on canvas, surface, raised >= 4.5", () => {
      expect(contrastRatio(moneyText, bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(moneyText, surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(moneyText, raised)).toBeGreaterThanOrEqual(4.5);
    });

    it("success, warning, danger on surface >= 4.5", () => {
      expect(contrastRatio(success, surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(warning, surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(danger, surface)).toBeGreaterThanOrEqual(4.5);
    });

    it("line-strong on surface >= 3", () => {
      expect(contrastRatio(lineStrong, surface)).toBeGreaterThanOrEqual(3.0);
    });
  });
});
