import { Geist, Geist_Mono } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils";
import { ChatIA } from "@/components/chat-ia/chat-ia";

const geist = Geist({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", geist.variable)}
    >
      <body>
        <ThemeProvider>
          <ChatIA
            logoIa="https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/google-gemini.svg"
             logoIaDark="https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/google-gemini.svg"
            logoIaSize={70}
            name="Assistente"
            color="#F2A900"
            borderColor="var(--border)"
            floating={false}
            floatingMargin={5}
            floatingRadius={24}
            floatingShadow={false}
            floatingMarginLeft={15}
          >
            {children}
          </ChatIA>
        </ThemeProvider>
      </body>
    </html>
  )
}
