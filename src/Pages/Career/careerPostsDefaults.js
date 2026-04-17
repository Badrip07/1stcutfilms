/**
 * Bundled career posts (list + detail fields). Used as API fallback and for seeding.
 * URL: /career/:legacy_numeric_id
 */
export const careerPostsDefaults = [
  {
    legacy_numeric_id: 1,
    sort_order: 0,
    payload: {
      title: "CREATIVE PRODUCER",
      description:
        "Fueled by our unwavering passion for advertising and film, we're here to shake up the industry. Tired of the industry's cautious approach, we founded Prites Photography to rewrite the rules. Here, it's all about pushing boundaries, outsmarting the norm, and enjoying every thrilling moment of the journey!",
      listImage: "/career-1.jpeg",
      subtitle: "CREATIVE. REMOTE. STOCKHOLM.",
      company: "CREATVIES",
      location: "STOCKHOLM",
      type: "HYBRID",
      heroImage: "",
      aboutStudio:
        "Welcome to Prites Photography. We are a creative studio focused on film, photography, and campaigns that feel alive. We combine craft and speed so your story lands with clarity and impact.",
      aboutRole:
        "We're now looking for a Production Coordinator. A resourceful, google-savvy operator who keeps our content production engine fueled with the right talent, locations, and creators. You'll be the go-to person for sourcing and booking everything we need to create scroll-stopping ads: models, actors, on-camera talent, stunning locations, and high-performing UGC creators for all our UGC ads. You'll coordinate shoots, manage talent relationships, and ensure every production day runs smoothly from brief to wrap.",
      aboutRole2:
        "This role sits at the intersection of logistics, creative execution, and relationship management. You'll work closely with our Creative Strategists, Media Buyers, and leadership to deliver the raw materials that become our clients' highest performing ads. You're a natural networker who thrives on coordination, loves the thrill of a production day, and has an eye for talent that converts, this is your role.",
      whatYoullDo: [
        "We're now looking for a Production Coordinator. A resourceful, people-savvy operator who keeps our content production engine fueled with the right talent, locations, and creators. You'll be the go-to person for sourcing and booking everything we need to create scroll-stopping ads: models, actors, on-camera talent, stunning locations, and high-performing UGC creators for all our UGC ads. You'll coordinate shoots, manage talent relationships, and ensure every production day runs smoothly from brief to wrap. You'll be the go-to person for sourcing and booking everything we need to create scroll-stopping ads: models, actors, on-camera talent, stunning locations, and high-performing UGC creators for all our UGC ads. You'll coordinate shoots, manage talent relationships, and ensure every production day runs smoothly from brief to wrap.",
      ],
    },
  },
  {
    legacy_numeric_id: 2,
    sort_order: 1,
    payload: {
      title: "ASSISTANT GAFFER",
      description:
        "Fueled by our unwavering passion for advertising and film, we're here to shake up the industry. Tired of the industry's cautious approach, we founded Prites Photography to rewrite the rules. Here, it's all about pushing boundaries, outsmarting the norm, and enjoying every thrilling moment of the journey!",
      listImage: "/career-2.jpeg",
      subtitle: "STOCKHOLM. HYBRID.",
      company: "",
      location: "STOCKHOLM",
      type: "HYBRID",
      heroImage: "",
      aboutStudio:
        "Welcome to Prites Photography. We are a creative studio focused on film, photography, and campaigns that feel alive. We combine craft and speed so your story lands with clarity and impact.",
      aboutRole:
        "We're looking for an Assistant Gaffer to join our production team. You'll work closely with our Gaffer and Director of Photography to set up and manage lighting equipment on set. This role is perfect for someone who is passionate about cinematography and wants to learn from experienced professionals.",
      aboutRole2:
        "You'll be responsible for assisting with lighting setups, managing equipment, and ensuring everything runs smoothly on production days. This is a hands-on role that requires attention to detail and a collaborative spirit.",
      whatYoullDo: [
        "Assist with lighting setups and equipment management",
        "Work closely with Gaffer and Director of Photography",
        "Maintain and organize lighting equipment",
        "Support production team on set",
        "Learn and grow within the cinematography field",
      ],
    },
  },
  {
    legacy_numeric_id: 3,
    sort_order: 2,
    payload: {
      title: "MARKETING MANAGER & COORDINATOR",
      description:
        "Fueled by our unwavering passion for advertising and film, we're here to shake up the industry. Tired of the industry's cautious approach, we founded Prites Photography to rewrite the rules. Here, it's all about pushing boundaries, outsmarting the norm, and enjoying every thrilling moment of the journey!",
      listImage: "/career-2.jpeg",
      subtitle: "CREATVIES. STOCKHOLM. HYBRID.",
      company: "CREATVIES",
      location: "STOCKHOLM",
      type: "HYBRID",
      heroImage: "",
      aboutStudio:
        "Welcome to Prites Photography. We are a creative studio focused on film, photography, and campaigns that feel alive. We combine craft and speed so your story lands with clarity and impact.",
      aboutRole:
        "We're seeking a Marketing Manager & Coordinator to drive our brand presence and coordinate marketing initiatives. You'll be responsible for developing and executing marketing strategies, managing campaigns, and coordinating with our creative team to ensure our brand message is consistent and compelling.",
      aboutRole2:
        "This role combines strategic thinking with hands-on execution. You'll work closely with our leadership team to develop marketing plans, manage social media presence, coordinate events, and ensure our brand story is told effectively across all channels.",
      whatYoullDo: [
        "Develop and execute marketing strategies",
        "Manage social media presence and content",
        "Coordinate marketing campaigns and initiatives",
        "Work with creative team on brand messaging",
        "Organize and coordinate events",
        "Analyze marketing performance and optimize strategies",
        "Build and maintain brand presence across channels",
      ],
    },
  },
];

/** Map legacy id -> full job object for single-page fallback */
export function careerPostsMapFromDefaults() {
  const map = {};
  for (const row of careerPostsDefaults) {
    map[row.legacy_numeric_id] = {
      id: row.legacy_numeric_id,
      ...row.payload,
    };
  }
  return map;
}
