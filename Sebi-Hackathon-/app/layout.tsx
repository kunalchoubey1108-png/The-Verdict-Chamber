import "./globals.css";
import "./styles.css";

export const metadata = {
  title: "The Verdict Chamber — Pre-Trade Risk Intelligence",
  description:
    "Submit a trade thesis. The multi-agent AI jury breaks it apart before capital is at risk.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;700;900&family=Syne:wght@700;800;900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        {/* dotLottie web component — used by NiveshOS onboarding */}
        <script
          type="module"
          src="https://unpkg.com/@lottiefiles/dotlottie-wc@0.9.4/dist/dotlottie-wc.js"
        />
      </body>
    </html>
  );
}
