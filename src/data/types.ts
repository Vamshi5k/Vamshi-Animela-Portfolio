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
  readonly location: {
    readonly city: string;
    readonly country: string;
    /** Display string for the figure caption, e.g. "17.38° N 78.48° E". */
    readonly coordinates: string;
  };
  readonly availability: readonly { readonly id: Availability; readonly label: string }[];
  readonly experience: { readonly approxYears: number; readonly label: string };
  readonly languages: readonly Language[];
  readonly headline: Content<string>;
  /** One-sentence introduction under the hero headline. */
  readonly intro: Content<string>;
  readonly bio: Content<string>;
};

// hero.ts

/** Source-pixel rectangle of an image to show (SPEC §5). The file itself is never cropped. */
export type CropRect = { readonly x: number; readonly y: number; readonly width: number; readonly height: number };

export type Hero = {
  readonly primary: Link;
  readonly secondary: Link;
  /** Label of the decorative scroll indicator. */
  readonly scrollCue: string;
  readonly portrait: {
    readonly src: string;
    readonly width: number;
    readonly height: number;
    readonly alt: string;
    /** Source-pixel rectangle shown per layout (SPEC §5); tied to this exact image file. */
    readonly crop: { readonly mobile: CropRect; readonly tablet: CropRect; readonly desktop: CropRect };
  };
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
  /** Year the project was built (from Vamshi's resume). */
  readonly year: Content<number>;
};

// experience.ts

export type Role = {
  readonly title: string;
  readonly employmentType: Content<"Internship" | "Full-time">;
  readonly start: YearMonth;
  /** `"present"` for the current role. */
  readonly end: Content<YearMonth | "present">;
  readonly description: Content<string>;
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
  /** Optional. When null (or not verified), hide the link entirely. */
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

// ui.ts

export type UiCopy = {
  readonly skipToContent: string;
  /** Prefix of every pending placeholder: "PENDING — <what>". */
  readonly pending: string;
  readonly pendingWhat: { readonly screenshot: string; readonly bio: string };
  /** Figure caption prefix: "FIG. 00". */
  readonly figure: string;
  /** Mobile menu toggle labels. */
  readonly menuOpen: string;
  readonly menuClose: string;
  /** Accessible names for the primary nav landmark and the mobile menu dialog. */
  readonly primaryNav: string;
  readonly menuDialog: string;
  /** Technology marquee: accessible name and the pause toggle labels. */
  readonly marqueeLabel: string;
  readonly marqueePause: string;
  readonly marqueePlay: string;
  /** Fixed end of the Experience ruler; nothing reads the current date (SPEC). */
  readonly present: string;
  /** Unit for the Experience section count, e.g. "03 ROLES". */
  readonly unitRoles: string;
  /** Units for the Expertise section count, e.g. "06 GROUPS · 48 SKILLS". */
  readonly unitGroups: string;
  readonly unitSkills: string;
  /** About fact-sheet labels (SPEC §1a). Learning is never labelled as a certificate. */
  readonly about: {
    readonly experience: string;
    readonly location: string;
    readonly languages: string;
    readonly education: string;
    readonly credentials: string;
    readonly certificate: string;
    readonly learning: string;
  };
  /** Contact: copy-to-clipboard states, the mailto link and link suffixes (SPEC §1a). */
  readonly contact: {
    /** Accessible description of the email line's action. */
    readonly copyAction: string;
    readonly copyHintPointer: string;
    readonly copyHintTouch: string;
    /** Shown only after the clipboard write resolves. */
    readonly copied: string;
    /** Shown when the clipboard write rejects. */
    readonly copyFailed: string;
    readonly mailto: string;
    /** Screen-reader suffix on links that open in a new tab. */
    readonly opensNewTab: string;
    readonly whatsapp: string;
  };
  /** Viewfinder cursor pill labels, keyed by the data-cursor value (see CLAUDE.md). */
  readonly cursor: { readonly view: string; readonly copy: string; readonly drag: string; readonly open: string };
};

// sections.ts

export type SectionMeta = {
  readonly id: string;
  /** Rendered as §01, §02, … (SPEC §4.1). */
  readonly index: number;
  readonly label: string;
};

// contact.ts

export type Contact = {
  /** Contact section headline, above the email line. */
  readonly headline: string;
  readonly email: string;
  readonly socials: readonly Link[];
  /** Optional, E.164 format when provided. When null, hide every WhatsApp element. */
  readonly whatsapp: string | null;
};
