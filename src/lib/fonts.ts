import { Archivo, IBM_Plex_Mono, Instrument_Sans } from "next/font/google";

// Font loading per design/SPEC.md §3: latin only, and only the axes and weights the spec uses.

/** Display. Variable wght + wdth (62–125), used via font-stretch. */
export const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
  variable: "--font-archivo",
});

/** Body. Variable wght only (the wdth axis is not used). */
export const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-instrument-sans",
});

/** Mono. Static 400 and 500. latin-ext carries the rupee sign (U+20B9) used in Services prices. */
export const plexMono = IBM_Plex_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-plex-mono",
});

export const fontVariables = [archivo.variable, instrumentSans.variable, plexMono.variable].join(" ");
