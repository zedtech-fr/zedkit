import { catalogStats, featuredPackage, gallery } from "@/content/gallery";
import { HomeView } from "@/ui/home/home-view";

export default function Home() {
  return <HomeView gallery={gallery} stats={catalogStats} featuredPackage={featuredPackage} />;
}
