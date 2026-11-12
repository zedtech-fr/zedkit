import { Container, signatureMotionClass } from "@zedtech/zedkit-ui";
import { publicIssueHref } from "@/features/reviews/compose";
import { HomeHeroLead } from "@/ui/home/home-hero-lead";

/**
 * Colour behind the window and the cards over its edges: glass has nothing to refract without it. Glass only (CSS).
 * It lives in the band, inside its box, so nothing in the window or the page grows or scrolls because of it.
 */
function HeroShapes() {
  return (
    <span aria-hidden="true" data-hero-shapes="" className="pointer-events-none absolute pin-fill">
      <span data-shape="1" />
      <span data-shape="2" />
      <span data-shape="3" />
    </span>
  );
}

/** Hero band: the proposition, kit pills, and a static glass illustration of one run. */
export async function HomeHero() {
  const issuesHref = await publicIssueHref();
  return (
    <Container width="wide" data-home-hero-band="" className={`relative ${signatureMotionClass.settle}`}>
      <HeroShapes />
      <HomeHeroLead issuesHref={issuesHref} />
    </Container>
  );
}
