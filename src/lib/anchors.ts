/** Section id targeted by an in-page href: "/#work" → "work". */
export const anchorId = (href: string) => href.split("#")[1] ?? "";
