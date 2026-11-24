export const metadata = {
  title: "SkipQ Partner | Store Counter Dashboard",
  description: "Live Counter Operations, Multi-Station Calling & Store Billing Dashboard",
  manifest: "/merchant-manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SkipQ Partner",
  },
  icons: {
    icon: "/icon-merchant-192.png",
    apple: "/icon-merchant-192.png",
  },
};

export default function MerchantLayout({ children }) {
  return (
    <>
      <link rel="manifest" href="/merchant-manifest.json" />
      {children}
    </>
  );
}
