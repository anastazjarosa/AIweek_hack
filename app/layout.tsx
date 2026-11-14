import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: "Mosaic — study material that fits your brain",
  description:
    "Upload lectures and textbooks. Get notes, flashcards and quizzes shaped around how you focus, read and remember.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${lexend.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
