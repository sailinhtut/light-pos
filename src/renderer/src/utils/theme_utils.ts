import { appCurrency, appLightBackground, appPrimaryColor } from "./app_constants";

export function savePrimaryColor(hexColor) {
  localStorage.setItem("appPrimaryColor", hexColor);
  const hsl = hslToUnWrappedFormat(hexToHSL(hexColor));

  document.documentElement.style.setProperty("--primary", hsl);
}

export function loadPrimaryColor() {
  const savedPrimaryHexValue = localStorage.getItem("appPrimaryColor");
  if (savedPrimaryHexValue) {
    const hsl = hslToUnWrappedFormat(hexToHSL(savedPrimaryHexValue));
    document.documentElement.style.setProperty("--primary", hsl);
  } else {
    savePrimaryColor(appPrimaryColor);
  }
}

export function saveBackgroundColor(hexColor) {
  localStorage.setItem("appBackgroundColor", hexColor);
  const hsl = hslToUnWrappedFormat(hexToHSL(hexColor));

  document.documentElement.style.setProperty("--background", hsl);
}

export function loadBackgroundColor() {
  const savedBackgroundHexValue = localStorage.getItem("appBackgroundColor");
  if (savedBackgroundHexValue) {
    const hsl = hslToUnWrappedFormat(hexToHSL(savedBackgroundHexValue));
    document.documentElement.style.setProperty("--background", hsl);
  } else {
    saveBackgroundColor(appLightBackground);
  }
}

export function loadCurrency() {
  const savedCurrency = localStorage.getItem("appCurrency");
  if (!savedCurrency) {
    saveCurrency(appCurrency);
  }
}
export function saveCurrency(currency: string) {
  localStorage.setItem("appCurrency", currency);
}

export function loadTheme() {
  const darkMode = localStorage.getItem("theme");
  if (darkMode === null) {
    localStorage.setItem("theme", "light");
    document.documentElement.classList.remove("dark");
  } else {
    if (darkMode === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }
}

export function hslToUnWrappedFormat(hslString) {
  // Remove the "hsl(" at the start and ")" at the end
  const trimmedString = hslString.replace(/hsl\(|\)/g, "");

  // Replace commas with spaces
  const formattedString = trimmedString.replace(/,\s*/g, " ");

  return formattedString;
}

export function hexToHSL(hex: string) {
  // Remove the leading hash if present
  hex = hex.replace(/^#/, "");

  // Parse r, g, b values
  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;

  // Find greatest and smallest channel values
  let max = Math.max(r, g, b);
  let min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  s = s * 100;
  l = l * 100;

  return `hsl(${h * 360}, ${s}%, ${l}%)`;
}
export function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0,
    g = 0,
    b = 0;

  if (0 <= h && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (60 <= h && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (120 <= h && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (180 <= h && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (240 <= h && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (300 <= h && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return (
    "#" +
    r.toString(16).padStart(2, "0") +
    g.toString(16).padStart(2, "0") +
    b.toString(16).padStart(2, "0")
  );
}
