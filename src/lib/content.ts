import type { Content, Todo } from "@/data/types";

export function isTodo<T>(value: Content<T>): value is Todo {
  return typeof value === "object" && value !== null && "todo" in value;
}
