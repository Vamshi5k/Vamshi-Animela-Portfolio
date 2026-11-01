// The only place where content fields are declared optional for the content gate.
// A null or empty value at a matching path is allowed; components must hide the element.
// Patterns use the paths printed by content:todos. `[*]` matches any array item.
// Do not add entries without Vamshi's approval.
export const optionalPaths = [
  { pattern: "contact.whatsapp", reason: "number may not be published" },
  { pattern: "clients[*].liveUrl", reason: "link is only rendered when urlVerified is true" },
];
