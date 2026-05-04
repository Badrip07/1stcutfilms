import fs from "fs";

function stripBom(s) {
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

function clean(v) {
  const o = { ...v };
  if (typeof o.title === "string") o.title = o.title.trim();
  if (typeof o.subtitle === "string") o.subtitle = o.subtitle.trim();
  delete o.vimeoUrl;
  delete o.bunnyUrl;
  for (const k of Object.keys(o)) {
    if (o[k] === "") delete o[k];
  }
  return o;
}

const raw = stripBom(fs.readFileSync("./tmp-work-api.json", "utf8"));
const api = JSON.parse(raw);
const v10 = api.video.slice(0, 10).map(clean);

const extra5 = [
  {
    id: 11,
    title: "DEPEND",
    subtitle: "CAMPAIGN",
    category: "",
    thumbnail: "/video-11.jpg",
    vimeoUrl: "https://vimeo.com/1172194756",
    brandImage: "/work/logos/Depend-logo.png",
    content:
      "We've worked with Depend for years, but this time we wanted to raise the bar. Their O2 Care series, built around healthier nails and cuticles, deserved more than a straightforward product push. It needed to feel real, warm, and relevant to everyday women. So, we created a soft, living film that shows exactly when and how their nail oil fits into life. The kind of content that doesn't feel like an ad, even when it is one.",
    campaignStills: [
      "/work/AR500020_2_11zon.jpg",
      "/work/AR500118---_5_11zon.jpg",
      "/work/AR500128_3_11zon.jpg",
      "/work/AR500143_4_11zon.jpg",
      "/work/AR500195_1_11zon.jpg",
    ],
  },
  {
    id: 12,
    title: "AIMO",
    subtitle: "Sketches",
    category: "",
    vimeoUrl: "https://vimeo.com/1172142423",
    brandImage: "/works/logos/Aimo.png",
    content:
      "Aimo approached us with a unique request: to create a series of comedic sketches that would communicate their key messages in a lighthearted and engaging way. They wanted to tackle their pain points head-on but do so with humor and creativity, steering clear of traditional approaches.",
  },
  {
    id: 13,
    title: "BALCK COFFE",
    subtitle: "DOCUMENTERY",
    category: "",
    vimeoUrl: "https://vimeo.com/392218352",
    brandImage: "/profeel.png",
    content:
      "Our first ever client. And still the most ambitious thing we've ever made. We traveled deep into the rainforests of Ethiopia to document the world behind the coffee we drink every day. The farmers, the land, the process. And how Balck, through honest and fair trade, is quietly making that world a little better. Some projects you just don't forget.",
    campaignStills: [
      "/work/A7306348_1_11zon.jpg",
      "/work/A7306400-2_4_11zon.jpg",
      "/work/A7306415-2_5_11zon.jpg",
      "/work/A7306437_8_11zon.jpg",
      "/work/A7306474_7_11zon.jpg",
      "/work/DSC00329_6_11zon.jpg",
      "/work/DSC00525_3_11zon.jpg",
      "/work/DSC00994_2_11zon.jpg",
    ],
  },
  {
    id: 14,
    title: "INSURELLO",
    subtitle: "TV SPOT",
    category: "",
    vimeoUrl: "https://vimeo.com/994994366",
    brandImage: "/work/logos/Insurell.png",
    content:
      "We've been working with Insurello for several years, focusing on sales-driven ads. This time, we got the chance to create a TV commercial that emphasizes their brand with humor and relatable situations, but with a twist.",
    campaignStills: [
      "/work/AR507960-1_5_11zon.jpg",
      "/work/AR507991-1_6_11zon.jpg",
      "/work/AR508087-1_3_11zon.jpg",
      "/work/AR508310-1_4_11zon.jpg",
      "/work/AR508830-1_2_11zon.jpg",
      "/work/AR509086-1_1_11zon.jpg",
      "/work/AR509190_7_11zon.jpg",
    ],
  },
  {
    id: 15,
    title: "FOODORA",
    subtitle: "BRANDFILM",
    category: "",
    vimeoUrl: "https://vimeo.com/873665223",
    brandImage: "/work/logos/Foodora-Logo-Cherry-Pink.png",
    content:
      "Foodora didn't come to us for another ad. They needed something different. A film to strengthen their employer brand and give their office culture a real identity, the kind that makes people want to be part of something. We created a brand film built for recruitment, that didn't feel like a recruitment film. Just an honest look at who they actually are.",
  },
];

const videos = [...v10, ...extra5];

let wd = stripBom(fs.readFileSync("./src/Pages/Work/workData.js", "utf8"));
wd = wd.replace("],\\n  photography: [", "],\n  photography: [");
const photoIdx = wd.indexOf("  photography: [");
if (photoIdx === -1) throw new Error("photography: [ not found");
const tail = wd.slice(photoIdx);

const header = `// Video tab: 10 posts from admin (YouTube) + 5 legacy posts (Vimeo until you add youtubeUrl in admin).
export const workData = {
  video: `;

const out = header + JSON.stringify(videos, null, 2) + ",\n" + tail;
fs.writeFileSync("./src/Pages/Work/workData.js", out, "utf8");
console.log("Wrote", videos.length, "video entries");
