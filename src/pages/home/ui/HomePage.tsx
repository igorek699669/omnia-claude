import { Hero } from "./components/Hero";
import { Quote } from "./components/Quote";
import { OurProducts } from "./components/OurProducts";
// import { SoundPicker } from "./components/SoundPicker"; // временно скрыт, вернуть позже
import { Steel } from "./components/Steel";
import { HandpanGuide } from "./components/HandpanGuide";
import { Firsthand } from "./components/Firsthand";
import { DeliverySteps } from "./components/DeliverySteps";
import { CtaBand } from "./components/CtaBand";
import { Faq } from "./components/Faq";

export function HomePage() {
  return (
    <>
      <Hero />
      <Quote />
      <OurProducts />
      {/* <SoundPicker /> временно скрыт, вернуть позже */}
      <Steel />
      <HandpanGuide />
      <Firsthand />
      <DeliverySteps />
      <CtaBand />
      <Faq />
    </>
  );
}
