import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Navbar } from './_components/navbar';
import { Hero } from './_components/hero';
import { Features } from './_components/features';
import { HowItWorks } from './_components/how-it-works';
import { FeatureGrid } from './_components/feature-grid';
import { ThemeShowcase } from './_components/theme-showcase';
import { Testimonials } from './_components/testimonials';
import { FAQ } from './_components/faq';
import { CTAFooter } from './_components/cta-footer';
import { Footer } from './_components/footer';

export default async function LandingPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect('/dashboard');
  }

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <FeatureGrid />
        <ThemeShowcase />
        <Testimonials />
        <FAQ />
        <CTAFooter />
      </main>
      <Footer />
    </>
  );
}
