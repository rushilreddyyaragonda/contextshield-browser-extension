import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import HowItWorks from '@/components/HowItWorks';
import LiveDemo from '@/components/LiveDemo';
import Features from '@/components/Features';
import Installation from '@/components/Installation';
import Privacy from '@/components/Privacy';
import Developer from '@/components/Developer';
import Footer from '@/components/Footer';

function App() {
  return (
    <div className="min-h-screen bg-[#f7f4ed]">
      <Navigation />
      <main>
        <Hero />
        <HowItWorks />
        <LiveDemo />
        <Features />
        <Installation />
        <Privacy />
        <Developer />
      </main>
      <Footer />
    </div>
  );
}

export default App;
