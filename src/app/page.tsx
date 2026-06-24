import dynamic from 'next/dynamic';
import Hero from '@/components/Hero';
import FeaturedItems from '@/components/FeaturedItems';
import WhyOnline from '@/components/WhyOnline';

const HowItWorks = dynamic(() => import('@/components/HowItWorks'));
const Testimonials = dynamic(() => import('@/components/Testimonials'));
const FinalCTA = dynamic(() => import('@/components/FinalCTA'));

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
