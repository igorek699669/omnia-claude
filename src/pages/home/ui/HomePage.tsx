import { Hero } from "./components/Hero";
import { Quote } from "./components/Quote";
import { PopularProducts } from "./components/PopularProducts";
// import { SoundPicker } from "./components/SoundPicker"; // временно скрыт, вернуть позже
import { Steel } from "./components/Steel";
import { Firsthand } from "./components/Firsthand";
import { DeliverySteps } from "./components/DeliverySteps";
import { CtaBand } from "./components/CtaBand";
import { Faq } from "./components/Faq";

export function HomePage() {
  return (
    <>
      <Hero />
      <Quote />
      <PopularProducts />
      {/* <SoundPicker /> временно скрыт, вернуть позже */}
      <Steel />
      <Firsthand />
      <DeliverySteps />
      <CtaBand />
      <Faq />
    </>
  );
}
