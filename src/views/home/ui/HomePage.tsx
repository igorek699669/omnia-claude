import { Hero } from "./Hero";
import { Quote } from "./Quote";
import { PopularProducts } from "./PopularProducts";
import { SoundPicker } from "./SoundPicker";
import { Steel } from "./Steel";
import { Firsthand } from "./Firsthand";
import { DeliverySteps } from "./DeliverySteps";
import { CtaBand } from "./CtaBand";
import { Faq } from "./Faq";

export function HomePage() {
  return (
    <>
      <Hero />
      <Quote />
      <PopularProducts />
      <SoundPicker />
      <Steel />
      <Firsthand />
      <DeliverySteps />
      <CtaBand />
      <Faq />
    </>
  );
}
