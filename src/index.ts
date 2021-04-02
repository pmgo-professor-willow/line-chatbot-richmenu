// Node modules.
import { readFileSync } from 'fs';
import dotenv from 'dotenv';
import * as line from '@line/bot-sdk';
import parse from 'csv-parse/lib/sync';

// Enable .env.
dotenv.config();

const client = new line.Client({
  channelAccessToken: process.env.TARGET === 'prod'
    ? process.env.LINE_CHANNEL_ACCESS_TOKEN!
    : process.env.LINE_CHANNEL_ACCESS_TOKEN_DEV!,
  channelSecret: process.env.TARGET === 'prod'
    ? process.env.LINE_CHANNEL_SECRET!
    : process.env.LINE_CHANNEL_SECRET_DEV!,
});

const deleteAllRichMenus = async () => {
  const richmenus = await client.getRichMenuList();
  await Promise.all(richmenus.map((richmenu) =>
    client.deleteRichMenu(richmenu.richMenuId)
  ));
};

const createRichMenu = async (name: string, chatBarText: string) => {
  const csvRaw = readFileSync('./data/richmenu-areas.csv', 'utf-8');
  const areasRaw: any[] = parse(csvRaw, {
    columns: true,
    skip_empty_lines: true,
  });

  const richMenuId = await client.createRichMenu({
    size: {
      width: 2500,
      height: 1686,
    },
    selected: false,
    name,
    chatBarText,
    areas: areasRaw.map((areaRaw) => ({
      bounds: {
        x: parseInt(areaRaw.x),
        y: parseInt(areaRaw.y),
        width: parseInt(areaRaw.width),
        height: parseInt(areaRaw.height),
      },
      action: areaRaw.type === 'uri'
        ? {
          type: areaRaw.type,
          uri: areaRaw.data,
          altUri: areaRaw.displayText,
        }
        : {
          type: areaRaw.type,
          label: areaRaw.label,
          data: areaRaw.data,
          displayText: areaRaw.displayText,
        },
    })),
  });

  // Upload.
  const richMenuImageBuffer = readFileSync('./data/RichMenu.png');
  await client.setRichMenuImage(richMenuId, richMenuImageBuffer);

  // Set to default for all users.
  await client.setDefaultRichMenu(richMenuId);

  return richMenuId;
};

const main = async () => {
  await deleteAllRichMenus();

  const richMenuId = await createRichMenu(
    "Ask game information",
    "向博士問問資訊",
  );

  console.log(`Create RichMenu: ${richMenuId}`);
};

main();
