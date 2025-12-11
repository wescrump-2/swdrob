import OBR, { Item } from "@owlbear-rodeo/sdk";
import { Util } from "./util";
import { Debug } from "./debug";
import { playerCache } from "./main";

export function createContextMenu(playerId:string) {
  // Add context menu item
  console.log(playerId);
  OBR.contextMenu.create({
    id: `${Util.StatBlockMkey}/open-statblock`,
    icons: [
      {
        icon: "/statblock.svg",
        label: "Savaged.us Character",
        filter: {
          roles: ["PLAYER", "GM"],
          some: [
            { key: "layer", value: "CHARACTER" },
            { key: "createdUserId", value: `${playerId}`,  },
          ],
        },
      },
    ],
    onClick: async (context: { items: Item[] }) => {
      const character = context.items.find((item) =>  item.layer === "CHARACTER" && item.type === "IMAGE");
      if (!character) {
        Debug.log("No character found in context items");
        return;
      }

      if (!playerCache.isGm && character.createdUserId != playerCache.id) {
        OBR.notification.show("Access restricted to characters that belong to you.", "WARNING");
        return;
      }

      try {
        await OBR.popover.open({
          id: `${Util.StatBlockMkey}/popover`,
          url: `/popup.html?itemId=${encodeURIComponent(character.id)}`,
          height: 640,
          width: 480,
          anchorReference: "ELEMENT",
          //anchorElementId: character.id,
          anchorPosition: {
            left: 0,
            top: 0,
          },
          anchorOrigin: {
            horizontal: "RIGHT",
            vertical: "TOP",
          },
          transformOrigin: {
            horizontal: "RIGHT",
            vertical: "TOP",
          },
          disableClickAway: true,
          hidePaper: true,
          marginThreshold: 60,
        });
      } catch (error) {
        Debug.error("Failed to open popover:", error);
      }
    },
  });
};