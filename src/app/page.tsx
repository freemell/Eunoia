import { HeroScrollDemo } from "@/components/demo";
import { SplashDemo } from "@/components/demo-splash";
import { WavesDemo } from "@/components/demo-waves";

export default function Home() {
  return <HeroScrollDemo />;
  // Uncomment to see different demos:
  // return <SplashDemo />;  // Fluid cursor effects
  // return <WavesDemo />;   // Interactive waves
}
