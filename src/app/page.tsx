import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import Hero from '@/components/Hero';
import FeaturedItems from '@/components/FeaturedItems';
import WhyOnline from '@/components/WhyOnline';

const HowItWorks = dynamic(() => import('@/components/HowItWorks'));
const Testimonials = dynamic(() => import('@/components/Testimonials'));
const FinalCTA = dynamic(() => import('@/components/FinalCTA'));

export const metadata: Metadata = {
  title: 'Home',
  description:
    'Skip the queue at Crave near LIC Metro, Chennai. Order fresh Shawarma, Burgers, and more online for pickup — no waiting, no hassle.',
  openGraph: {
    title: 'Crave — Skip The Queue. Order Smarter.',
    description:
      'Order your favorite meals in advance from Crave near LIC Metro, Chennai. Skip the queue, choose your pickup time, and collect fresh food.',
    url: '/',
  },
  twitter: {
    title: 'Crave — Skip The Queue. Order Smarter.',
    description:
      'Order your favorite meals in advance from Crave near LIC Metro, Chennai. Skip the queue, choose your pickup time.',
  },
  alternates: {
    canonical: '/',
  },
};

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
