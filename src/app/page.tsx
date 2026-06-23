import Hero from '@/components/Hero';
import FeaturedItems from '@/components/FeaturedItems';
import WhyOnline from '@/components/WhyOnline';
import HowItWorks from '@/components/HowItWorks';
import Testimonials from '@/components/Testimonials';
import FinalCTA from '@/components/FinalCTA';

export default function Home() {
  return (
    <>
      <Hero />
      <FeaturedItems />
      <WhyOnline />
      <HowItWorks />
      <Testimonials />
      <FinalCTA />
    </>
  );
}
