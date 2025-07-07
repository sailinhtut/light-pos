import { ToastAction } from "@renderer/assets/shadcn/components/ui/toast";
import { toast } from "@renderer/assets/shadcn/components/ui/use-toast";
import { WifiOff } from "lucide-react";

export function uniqueId(length = 10): string {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let uniqueId = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    uniqueId += characters[randomIndex];
  }
  return uniqueId;
}

export function showNotification(title: string, body: string) {
  new window.Notification(title, { body: body });
}

export function capitalizeString(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function paginator<T>(origin: T[], index: number, perPage: number) {
  const chunks = chunkArray(origin, perPage);
  if (index < 0) {
    return chunks[0];
  }
  if (index > chunks.length - 1) {
    return chunks[chunks.length - 1];
  }
  return chunks[index];
}

export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  if (chunkSize <= 0) {
    throw new Error("chunkSize must be greater than 0");
  }

  const result: T[][] = [];

  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }

  return result;
}

export function getTodayParsedID(date?: Date): string {
  // Sample: may_24_2022
  const today = date ?? new Date();
  const month = today.toLocaleString("en-US", { month: "short" }).toLowerCase();
  const day = String(today.getDate());
  const year = String(today.getFullYear());
  const parsed = `${month}_${day}_${year}`;
  return parsed;
}

export function toLocalISOString(date: Date): string {
  const pad = (num: number) => (num < 10 ? "0" : "") + num;
  const now = new Date();

  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    "T" +
    pad(now.getHours()) +
    ":" +
    pad(now.getMinutes()) +
    ":" +
    pad(now.getSeconds()) +
    "." +
    (now.getMilliseconds() / 1000).toFixed(3).slice(2, 5)
  );
}

export function getUnParsedDate(date: string | undefined): Date {
  if (!date) return new Date();
  const monthNumber: { [key: string]: number } = {
    jan: 1,
    feb: 2,
    mar: 3,
    apr: 4,
    may: 5,
    jun: 6,
    jul: 7,
    aug: 8,
    sep: 9,
    oct: 10,
    nov: 11,
    dec: 12
  };

  const parsed = date.split("_");
  const month = monthNumber[parsed[0]] ?? 0;
  const day = parseInt(parsed[1]);
  const year = parseInt(parsed[2]);

  return new Date(year, month - 1, day);
}

export function formatNumberWithCommas(number: number): string {
  return parseInt(String(number ?? 0)).toLocaleString("en-US");
}

export function durationGenerator(date: Date): string {
  // Convert the timestamp to a Date object
  const inputDate = date;

  // Get the current date and time
  const currentDate = new Date();

  // Calculate the duration between the two dates
  let diff = currentDate.getTime() - inputDate.getTime();

  // Calculate the duration in years, months, days, hours, minutes, and seconds
  const years = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  diff -= years * 365.25 * 24 * 60 * 60 * 1000;

  const months = Math.floor(diff / (30.44 * 24 * 60 * 60 * 1000));
  diff -= months * 30.44 * 24 * 60 * 60 * 1000;

  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  diff -= days * 24 * 60 * 60 * 1000;

  const hours = Math.floor(diff / (60 * 60 * 1000));
  diff -= hours * 60 * 60 * 1000;

  const minutes = Math.floor(diff / (60 * 1000));
  diff -= minutes * 60 * 1000;

  const seconds = Math.floor(diff / 1000);

  // Format the duration in a human-readable format
  let durationStr = "";
  if (years > 0) durationStr += `${years} years, `;
  if (months > 0) durationStr += `${months} months, `;
  if (days > 0) durationStr += `${days} days, `;
  if (hours > 0) durationStr += `${hours} hours, `;
  if (minutes > 0) durationStr += `${minutes} minutes, `;
  if (seconds > 0 || durationStr === "") durationStr += `${seconds} seconds`;

  // Remove any trailing comma and space
  durationStr = durationStr.trim().replace(/,$/, "");

  return durationStr;
}

export function parseNumber(value: string): number | undefined {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? undefined : parsed;
}

export function generateRandomColor(): string {
  // Generate a random color in hex format
  const randomColor = Math.floor(Math.random() * 16777215).toString(16);
  return `#${randomColor.padStart(6, "0")}`;
}

export function getContrastColor(hexColor: string): string {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(1, 3), 16);
  const b = parseInt(hexColor.slice(1, 3), 16);

  // Calculate brightness based on YIQ formula
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  // Return black for bright colors and white for dark colors
  return brightness > 128 ? "#000000" : "#FFFFFF";
}

export function generateRandomContrastColor(): { color: string; contrastColor: string } {
  const color = generateRandomColor();
  const contrastColor = getContrastColor(color);

  return { color, contrastColor };
}

export function generateContrastVariants(): string[] {
  const variants: string[] = [];

  // Convert hex to HSL
  function hexToHSL(hex: string): [number, number, number] {
    let r = parseInt(hex.slice(1, 3), 16) / 255;
    let g = parseInt(hex.slice(3, 5), 16) / 255;
    let b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    let h: number,
      s: number,
      l: number = (max + min) / 2;

    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
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
        default:
          h = 0;
      }
      h /= 6;
    }

    return [h * 360, s * 100, l * 100];
  }

  // Convert HSL back to hex
  function hslToHex(h: number, s: number, l: number): string {
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

    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
  }
  const hexColor = "#ffbf00";
  const [h, s, l] = hexToHSL(hexColor);

  // Generate lighter and darker variants by adjusting lightness
  for (let i = -2; i <= 2; i++) {
    const newL = Math.max(0, Math.min(100, l + i * 20)); // Adjust lightness, stay within [0, 100]
    variants.push(hslToHex(h, s, newL));
  }

  return variants;
}

export function randomElement<T>(data: T[]): T {
  const randomIndex = Math.floor(Math.random() * data.length);
  return data[randomIndex];
}

export function convertToTitleCase(input: string): string {
  return input
    .split("-") // Split the string by hyphen
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize the first letter of each word
    .join(" "); // Join the words with a space
}

export function convertTo12HourFormat(hour: number): string {
  const period = hour < 12 ? "AM" : "PM";
  const adjustedHour = hour % 12 || 12;
  return `${adjustedHour} ${period}`;
}

export function purifiedNumber(raw: number): number {
  const formattedNumber = raw.toFixed(Number.isInteger(raw) ? 0 : 3);
  return parseFloat(formattedNumber);
}

export function dateRangeBetween(from: Date, to: Date): Date[] {
  const result: Date[] = [];
  const differentDateCount = Math.abs(Math.ceil((+to - +from) / (1000 * 60 * 60 * 24)));

  for (let i = 0; i <= differentDateCount; i++) {
    const intervalDate = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
    result.push(intervalDate);
  }

  return result;
}

export function sleep(seconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

export function noConnection() {
  if (!navigator.onLine) {
    toast({
      title: (
        <p className="flex flex-row items-center justify-start">
          <WifiOff className="size-5 transition-all hover:scale-110 text-slate-600 hover:text-destructive mr-3" />
          No Internet Connection
        </p>
      ),
      action: (
        <ToastAction
          onClick={() => window.electron.ipcRenderer.invoke("openInternetSetting")}
          altText={"Back Up File Path"}
        >
          Open
        </ToastAction>
      ),
      duration: 1000
    });
    return true;
  } else {
    return false;
  }
}
