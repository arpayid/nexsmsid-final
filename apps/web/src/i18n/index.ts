import id from "./id.json";
import en from "./en.json";

export type Locale = "id" | "en";

const messages: Record<Locale, Record<string, unknown>> = { id, en };

export function getMessages(locale: Locale) {
  return messages[locale] ?? messages.id;
}

export function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split(".");
  let result: unknown = obj;
  for (const key of keys) {
    if (result && typeof result === "object" && key in result) {
      result = (result as Record<string, unknown>)[key];
    } else {
      return path;
    }
  }
  return typeof result === "string" ? result : path;
}
