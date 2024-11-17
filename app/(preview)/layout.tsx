import "./globals.css";
import { Metadata } from "next";
import { Toaster } from "sonner";
import { ThemeProvider } from "../theme-provider";

export const metadata: Metadata = {
  metadataBase: new URL("https://ai-sdk-preview-attachments.vercel.dev"),
  title: "Attachments Preview",
  description: "Experimental preview of attachments in useChat hook",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
      <body>
        
        <Toaster position="top-center" richColors />
        {children}
      </body>
      </ThemeProvider>
    </html>
  );
}
