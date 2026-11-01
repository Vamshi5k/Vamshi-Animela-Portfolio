// Shared content types. Data files must only use `import type` from here so
// `npm run content:todos` can load them directly with Node's type stripping.

/** Content that has not been provided yet. Render an honest placeholder, never a guess. */
export type Todo = { readonly todo: string };

/** A value that is either known or still a TODO. */
export type Content<T> = T | Todo;

/** "YYYY-MM", e.g. "2023-08". */
export type YearMonth = `${number}-${number}`;

export type Link = {
  readonly label: string;
  readonly href: string;
};

export type Screenshot = {
  readonly src: string;
  readonly alt: string;
  readonly width: number;
  readonly height: number;
};

// profile.ts

export type Availability = "relocation" | "remote" | "freelance";

export type Language = {
  readonly name: string;
  readonly proficiency: "Native" | "Professional" | "Conversational";
};

export type Profile = {
  readonly siteName: string;
  /** Used for the page `<meta name="description">`. */
  readonly metaDescription: string;
  readonly name: string;
  readonly roles: readonly string[];
  readonly location: { readonly city: string; readonly country: string };
  readonly availability: readonly { readonly id: Availability; readonly label: string }[];
  readonly experience: { readonly approxYears: number; readonly label: string };
  readonly languages: readonly Language[];
  readonly headline: Content<string>;
  readonly bio: Content<string>;
};

// nav.ts

export type Nav = {
  readonly items: readonly Link[];
  readonly cta: Link;
};

// projects.ts

export type Project = {
  readonly slug: string;
  readonly number: string;
  readonly title: string;
  readonly category: Content<string>;
  /** Features as described by Vamshi. */
  readonly features: readonly string[];
  readonly tech: Content<readonly string[]>;
  /** Real screenshots only. Empty until provided. */
  readonly screenshots: readonly Screenshot[];
  /** `false` must always be stated in the UI (see `projectCopy.frontendOnly`). */
  readonly hasBackend: Content<boolean>;
  readonly summary: Content<string>;
};

// experience.ts

export type Role = {
  readonly title: string;
  readonly employmentType: Content<"Internship" | "Full-time">;
  readonly start: YearMonth;
  /** `"present"` for the current role. */
  readonly end: Content<YearMonth | "present">;
  readonly description: Content<string>;
  readonly highlights: Content<readonly string[]>;
};

export type Experience = {
  readonly company: string;
  readonly location: string;
  /** Oldest first. */
  readonly roles: readonly Role[];
};

// skills.ts

export type SkillGroup = {
  readonly id: string;
  readonly label: string;
  readonly items: readonly string[];
};

// services.ts

export type Service = {
  readonly id: string;
  readonly title: string;
  readonly description: Content<string>;
};

// clients.ts

export type Client = {
  readonly id: string;
  readonly name: string;
  readonly location?: string;
  readonly screenshot: Screenshot | null;
  readonly category: Content<string>;
  readonly contribution: Content<string>;
  readonly tech: Content<readonly string[]>;
  readonly liveUrl: string | null;
  /** Only render `liveUrl` as a link when this is true. */
  readonly urlVerified: boolean;
};

// education.ts

export type Degree = {
  readonly degree: string;
  readonly field: string;
  readonly institution: string;
  readonly year: number;
};

export type Credential =
  | { readonly kind: "certificate"; readonly title: string; readonly issuer: string }
  /** Self-directed learning. Never present as a formal certificate. */
  | { readonly kind: "learning"; readonly title: string; readonly providers: readonly string[] };

export type Education = {
  readonly degrees: readonly Degree[];
  readonly credentials: readonly Credential[];
};

// contact.ts

export type Contact = {
  readonly email: string;
  readonly socials: readonly Link[];
  /** E.164 format when provided. */
  readonly whatsapp: string | null;
};
