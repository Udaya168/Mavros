// Sample pilot tenant data. Replace with real records once storage is connected.
export type Role = "owner" | "admin" | "marketing" | "sales" | "analyst";
export type UnitStatus = "available" | "held" | "booked";
export type LeadStage =
  "New" | "Contacted" | "Qualified" | "Visit Booked" | "Visited" | "Negotiation" | "Won" | "Lost";

export interface Unit {
  id: string;
  number: string;
  tower: string;
  config: string;
  carpetSqft: number;
  priceInr: number;
  status: UnitStatus;
}

export interface Project {
  id: string;
  slug: string;
  name: string;
  location: string;
  reraId: string;
  possession: string;
  status: "draft" | "published";
  tagline: string;
  amenities: string[];
  image: string;
  units: Unit[];
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  projectId: string;
  config: string;
  budget: string;
  source: string;
  stage: LeadStage;
  owner: string;
  score: number;
  createdAt: string;
}

export interface Activity {
  id: string;
  actor: string;
  action: string;
  entity: string;
  at: string;
}

export const tenant = {
  slug: "aranya-developers",
  name: "Aranya Developers",
  members: [
    { name: "Priya Menon", email: "priya@aranya.in", role: "owner" as Role },
    { name: "Rahul Iyer", email: "rahul@aranya.in", role: "marketing" as Role },
    { name: "Kavya Rao", email: "kavya@aranya.in", role: "sales" as Role },
    { name: "Arjun Shah", email: "arjun@aranya.in", role: "sales" as Role },
  ],
};

const mkUnits = (prefix: string, base: number): Unit[] =>
  Array.from({ length: 12 }, (_, i) => {
    const three = i % 3 === 0;
    return {
      id: `${prefix}-${i}`,
      number: `${prefix}-${(Math.floor(i / 4) + 3) * 100 + (i % 4) + 1}`,
      tower: prefix,
      config: three ? "3 BHK" : "2 BHK",
      carpetSqft: three ? 1340 + i * 5 : 960 + i * 4,
      priceInr: (three ? base * 1.4 : base) + i * 150000,
      status: (["available", "available", "held", "booked"] as const)[i % 4] as UnitStatus,
    };
  });

export const projects: Project[] = [
  {
    id: "prj-1",
    slug: "aranya-greens",
    name: "Aranya Greens",
    location: "Whitefield, Bengaluru",
    reraId: "PRM/KA/RERA/1251/446/PR/000000 (sample)",
    possession: "Dec 2027",
    status: "published",
    tagline: "Garden residences beside a 4-acre central park.",
    amenities: ["Clubhouse", "Lap pool", "Jogging loop", "Co-working lounge", "Kids' play"],
    image:
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1600&q=80&auto=format&fit=crop",
    units: mkUnits("A", 9500000),
  },
  {
    id: "prj-2",
    slug: "aranya-skyline",
    name: "Aranya Skyline",
    location: "Hebbal, Bengaluru",
    reraId: "Pending developer verification",
    possession: "Jun 2028",
    status: "draft",
    tagline: "Lake-view towers near the airport corridor.",
    amenities: ["Sky deck", "Gym", "Indoor games"],
    image:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600&q=80&auto=format&fit=crop",
    units: mkUnits("S", 12000000),
  },
];

export const leads: Lead[] = [
  {
    id: "l1",
    name: "Ananya Kulkarni",
    phone: "+91 98•••• 1204",
    projectId: "prj-1",
    config: "3 BHK",
    budget: "₹1.3–1.5 Cr",
    source: "Instagram",
    stage: "Qualified",
    owner: "Kavya Rao",
    score: 82,
    createdAt: "2026-10-18",
  },
  {
    id: "l2",
    name: "Vikram Nair",
    phone: "+91 99•••• 7731",
    projectId: "prj-1",
    config: "2 BHK",
    budget: "₹95 L–1.1 Cr",
    source: "Google Ads",
    stage: "Visit Booked",
    owner: "Arjun Shah",
    score: 76,
    createdAt: "2026-10-17",
  },
  {
    id: "l3",
    name: "Sneha Pillai",
    phone: "+91 97•••• 0042",
    projectId: "prj-1",
    config: "2 BHK",
    budget: "₹90 L",
    source: "Website",
    stage: "New",
    owner: "Unassigned",
    score: 41,
    createdAt: "2026-10-19",
  },
  {
    id: "l4",
    name: "Rohit Desai",
    phone: "+91 90•••• 5519",
    projectId: "prj-2",
    config: "3 BHK",
    budget: "₹1.7 Cr",
    source: "Referral",
    stage: "Negotiation",
    owner: "Kavya Rao",
    score: 91,
    createdAt: "2026-10-12",
  },
  {
    id: "l5",
    name: "Meera Joshi",
    phone: "+91 88•••• 6620",
    projectId: "prj-1",
    config: "3 BHK",
    budget: "₹1.4 Cr",
    source: "WhatsApp",
    stage: "Contacted",
    owner: "Arjun Shah",
    score: 63,
    createdAt: "2026-10-16",
  },
  {
    id: "l6",
    name: "Karthik Reddy",
    phone: "+91 96•••• 3318",
    projectId: "prj-1",
    config: "2 BHK",
    budget: "₹1 Cr",
    source: "Facebook",
    stage: "Visited",
    owner: "Kavya Rao",
    score: 70,
    createdAt: "2026-10-10",
  },
];

export const activity: Activity[] = [
  {
    id: "a1",
    actor: "Kavya Rao",
    action: "moved lead to Qualified",
    entity: "Ananya Kulkarni",
    at: "2026-10-19 10:42",
  },
  {
    id: "a2",
    actor: "Rahul Iyer",
    action: "approved 6 knowledge facts",
    entity: "Aranya Greens",
    at: "2026-10-19 09:15",
  },
  {
    id: "a3",
    actor: "Priya Menon",
    action: "invited team member",
    entity: "arjun@aranya.in",
    at: "2026-10-18 17:03",
  },
  {
    id: "a4",
    actor: "Arjun Shah",
    action: "booked site visit",
    entity: "Vikram Nair",
    at: "2026-10-18 12:20",
  },
  {
    id: "a5",
    actor: "System",
    action: "marked unit held",
    entity: "A-302",
    at: "2026-10-18 11:00",
  },
];

export const tenants = [
  {
    name: "Aranya Developers",
    slug: "aranya-developers",
    plan: "Pilot",
    projects: 2,
    seats: 4,
    status: "active",
  },
  {
    name: "Coastline Homes",
    slug: "coastline-homes",
    plan: "Growth",
    projects: 5,
    seats: 11,
    status: "active",
  },
  {
    name: "Northgate Realty",
    slug: "northgate-realty",
    plan: "Trial",
    projects: 1,
    seats: 2,
    status: "onboarding",
  },
];

export const formatInr = (n: number) =>
  n >= 10000000 ? `₹${(n / 10000000).toFixed(2)} Cr` : `₹${(n / 100000).toFixed(0)} L`;

export const getProject = (id: string) => projects.find((p) => p.id === id);
export const getProjectBySlug = (slug: string) => projects.find((p) => p.slug === slug);
