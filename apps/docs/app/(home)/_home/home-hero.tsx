import { Container, signatureMotionClass } from "@zedtech/zedkit-ui";
import { HomeHeroLead } from "./home-hero-lead";

/** Hero band: the proposition, one map prompt, and a static glass illustration of one run. */
export function HomeHero() {
  return (
    <Container width="wide" data-home-hero-band="" className={signatureMotionClass.settle}>
      <HomeHeroLead />
    </Container>
  );
}
