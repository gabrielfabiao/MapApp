import '../style.css';
import TestNoticeBanner from '../components/common/TestNoticeBanner';

export const metadata = {
  title: 'BlooMap',
  description: 'An app to map any image.',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="preload" suppressHydrationWarning>
        {children}
        <TestNoticeBanner />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.addEventListener('load', function () { document.body.classList.remove('preload'); });`,
          }}
        />
      </body>
    </html>
  );
}
