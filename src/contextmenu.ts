import OBR, { Item } from "@owlbear-rodeo/sdk";
import { Util } from "./util";
import { Debug } from "./debug";
import { playerCache } from "./main";

export function createContextMenu() {
  // Add context menu item
  OBR.contextMenu.create({
    id: `${Util.StatBlockMkey}/open-statblock`,
    icons: [
      {
        icon: "/statblock.svg",
        label: "Savage Worlds Stat Block",
        filter: {
          roles: ["PLAYER", "GM"],
        },
      },
    ],
    onClick: async (context: { items: Item[] }) => {
      const character = context.items.find((item) => item.createdUserId===playerCache.id && item.layer==="CHARACTER" && item.type === "IMAGE");
      if (!character) {
        Debug.log("No character found in context items");
        return;
      }

      Debug.log("Character found:", character.id);

      try {
        Debug.log("Opening popover with itemId:", character.id);
        await OBR.popover.open({
          id: `${Util.StatBlockMkey}/popover`,
          url: `/popup.html?itemId=${encodeURIComponent(character.id)}`,
          height: 680,
          width: 480,
        });
        Debug.log("Popover opened successfully");
      } catch (error) {
        Debug.error("Failed to open popover:", error);
      }
    },
  });
};