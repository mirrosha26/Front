import {
  Geist,
  Geist_Mono,
  Instrument_Sans,
  Inter,
  Mulish,
  Noto_Sans_Mono
} from 'next/font/google';

import { cn } from '@/lib/utils';

const fontSans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  fallback: ['system-ui', 'arial']
});

const fontMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  fallback: ['monospace']
});

const fontInstrument = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-instrument',
  display: 'swap',
  fallback: ['system-ui', 'arial']
});

const fontNotoMono = Noto_Sans_Mono({
  subsets: ['latin'],
  variable: '--font-noto-mono',
  display: 'swap',
  fallback: ['monospace']
});

const fontMullish = Mulish({
  subsets: ['latin'],
  variable: '--font-mullish',
  display: 'swap',
  fallback: ['system-ui', 'arial']
});

const fontInter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  fallback: ['system-ui', 'arial']
});

export const fontVariables = cn(
  fontSans.variable,
  fontMono.variable,
  fontInstrument.variable,
  fontNotoMono.variable,
  fontMullish.variable,
  fontInter.variable
);
