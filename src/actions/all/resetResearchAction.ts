import { INVENTION_ITEMS } from "../../constants";
import { getRandomItemsByRideType } from "../../utils";

export function resetResearchAction() {
  return {
    name: "resetResearch",
    query: (event: GameActionEventArgs): GameActionResult => {
      console.log("Querying inventNextItem action with event args:", event.args);
      return { error: 0 };
    },
    execute: (event: GameActionEventArgs): GameActionResult => {
      // Dummy usage to avoid TypeScript warning
      void event;
      const research = park.research;
      const researchItems = getRandomItemsByRideType(INVENTION_ITEMS);
      const researchItemsExcludingScenery = researchItems.filter(item => item.category !== "scenery");
      const researchItemsWeWant = researchItems.filter(item => item.category === "scenery" || item.category === "shop");
      research.uninventedItems = researchItemsExcludingScenery as ResearchItem[];
      research.inventedItems = researchItemsWeWant as ResearchItem[];
      research.funding = 3;
      research.progress = 0;
      research.priorities = ["transport", "gentle", "rollercoaster", "thrill", "water", "shop", "scenery"];
      return { error: 0 };
    }
  };
}


