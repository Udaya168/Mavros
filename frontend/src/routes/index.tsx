import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bot,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  Film,
  Layers3,
  Menu,
  MessageCircle,
  MousePointerClick,
  PhoneCall,
  Send,
  ShieldCheck,
  Workflow,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from "react";
import amenityClubhouse from "@/assets/amenity-clubhouse.jpg";
import amenityJogging from "@/assets/amenity-jogging.jpg";
import amenityPool from "@/assets/amenity-pool.jpg";
import garden from "@/assets/garden.jpg";
import interior from "@/assets/interior.jpg";
import pool from "@/assets/pool.jpg";
import residenceBalcony from "@/assets/residence-balcony.jpg";
import residenceBedroom from "@/assets/residence-bedroom.jpg";
import residence3bhk from "@/assets/residence-3bhk.jpg";
import sales from "@/assets/sales.jpg";
import { AccountMenu } from "@/components/public-app/account-menu";
import AccordionGallery from "@/components/AccordionGallery";
import CircularCarousel from "@/components/CircularCarousel";
import FolderFloat from "@/components/FolderFloat";
import { getPublicUserSession } from "@/lib/public-auth";

export const Route = createFileRoute("/")({
  loader: async () => {
    const session = await getPublicUserSession();
    if (session.user && session.role === "owner") throw redirect({ to: "/control" });
    if (session.user && session.role === "developer") throw redirect({ to: "/app" });
    return session;
  },
  head: () => ({
    meta: [
      { title: "Mavros RealtyAI × Veytrix.AI — From property interest to sales conversations" },
      {
        name: "description",
        content:
          "Meet Mavros RealtyAI, a property sales workflow concept, alongside Veytrix.AI, a creative studio concept for property marketing.",
      },
      {
        property: "og:title",
        content: "Mavros RealtyAI × Veytrix.AI — From property interest to sales conversations",
      },
      {
        property: "og:description",
        content:
          "A connected vision for property marketing, buyer conversations and organized sales workflows.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const navLinks = [
  { label: "Platform", href: "#platform" },
  { label: "Solutions", href: "#solutions" },
  { label: "Veytrix Studio", href: "#veytrix" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing / Pilot", href: "#pilot" },
  { label: "FAQ", href: "#faq" },
];

const steps = [
  {
    number: "01",
    title: "Attract",
    description: "Introduce a project through campaigns and a clear, branded property page.",
    icon: MousePointerClick,
  },
  {
    number: "02",
    title: "Engage",
    description: "Let buyers explore project details and try an AI-advisor demonstration.",
    icon: MessageCircle,
  },
  {
    number: "03",
    title: "Qualify",
    description: "Understand the buyer's preferred home, budget and purchase timeline.",
    icon: Check,
  },
  {
    number: "04",
    title: "Connect",
    description: "Give the sales team context for a useful, human follow-up.",
    icon: PhoneCall,
  },
  {
    number: "05",
    title: "Schedule",
    description: "Coordinate the next step, such as a requested project visit.",
    icon: CalendarDays,
  },
  {
    number: "06",
    title: "Analyze",
    description: "Review enquiry sources and the shape of the sales journey.",
    icon: BarChart3,
  },
];

const solutionPanels = [
  {
    src: residenceBalcony,
    alt: "Luxury apartment balcony overlooking landscaped grounds",
    title: "Luxury Apartments",
    subtitle: "Elevated city living",
  },
  {
    src: pool,
    alt: "Contemporary residential property beside a private swimming pool",
    title: "Modern Villas",
    subtitle: "Architecture and escape",
  },
  {
    src: interior,
    alt: "Premium living room with expansive windows and warm finishes",
    title: "Premium Living Rooms",
    subtitle: "Spaces made for living",
  },
  {
    src: amenityJogging,
    alt: "Landscaped residential community garden and walking path",
    title: "Residential Communities",
    subtitle: "A connected neighborhood",
  },
  {
    src: residenceBedroom,
    alt: "Refined luxury bedroom with a landscaped outlook",
    title: "Luxury Interiors",
    subtitle: "Thoughtful details",
  },
  {
    src: sales,
    alt: "Property consultant presenting a development to prospective buyers",
    title: "Property Consultation",
    subtitle: "Personal guidance",
  },
];

const faqs = [
  {
    question: "What is Mavros RealtyAI?",
    answer:
      "Mavros RealtyAI is a product concept for property developers that brings project discovery, buyer questions, enquiry qualification and sales follow-up into one connected workflow. The current website is a frontend prototype with illustrative sample data.",
  },
  {
    question: "How does Veytrix.AI fit into the platform?",
    answer:
      "Veytrix.AI is a distinct creative-studio concept for making property marketing content. RealtyAI focuses on buyer engagement and sales workflows; Veytrix focuses on creating campaigns that can attract buyers.",
  },
  {
    question: "Can the AI answer questions about a specific property?",
    answer:
      "The intended product direction is for an advisor to answer from approved project information. The demonstration on this page uses predefined sample responses only; it is not connected to a live AI service or property inventory.",
  },
  {
    question: "How is project information reviewed?",
    answer:
      "The intended workflow includes reviewing and approving project facts before they are used in buyer-facing answers. This prototype does not implement a live review or publishing system.",
  },
  {
    question: "Can the platform work with an existing CRM?",
    answer:
      "CRM and ERP connectivity are integration options to discuss for a future implementation. No CRM integration is connected in this prototype.",
  },
  {
    question: "How does site-visit scheduling work?",
    answer:
      "The product concept includes coordinating visit requests with a developer's sales team. The sample form on this page is a local-only demonstration and does not create or send a booking.",
  },
  {
    question: "Which integrations are available?",
    answer:
      "WhatsApp Business, email, calendars, CRM/ERP systems and campaign analytics are integration categories to explore. Their availability depends on project requirements; no live connections are represented here.",
  },
  {
    question: "How can a developer start a pilot?",
    answer:
      "Use the form below to preview the information a pilot conversation could cover. This site does not submit or store the form. A real enquiry channel can be added when a verified destination is available.",
  },
];

const integrationOptions: { label: string; icon: LucideIcon }[] = [
  { label: "WhatsApp Business", icon: MessageCircle },
  { label: "Email", icon: Send },
  { label: "Calendars", icon: CalendarDays },
  { label: "CRM & ERP", icon: Building2 },
  { label: "Campaign Analytics", icon: BarChart3 },
  { label: "Veytrix.AI", icon: Layers3 },
];

const trustPrinciples: { title: string; description: string; icon: LucideIcon }[] = [
  {
    title: "Approved answers",
    description: "Ground buyer-facing answers in project facts reviewed by the developer.",
    icon: Check,
  },
  {
    title: "Human handoff",
    description: "Make it easier to involve a person when a detail is uncertain.",
    icon: PhoneCall,
  },
  {
    title: "Privacy-conscious capture",
    description: "Collect only what a real enquiry workflow needs, with clear expectations.",
    icon: ShieldCheck,
  },
  {
    title: "Controlled access",
    description: "Design boundaries around access to each developer's information.",
    icon: Building2,
  },
  {
    title: "Creative review",
    description: "Preview and approve marketing assets before they are used.",
    icon: Film,
  },
  {
    title: "Thoughtful integrations",
    description: "Connect only the channels and systems agreed for a project.",
    icon: Workflow,
  },
];

const capabilities: {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
}[] = [
  {
    title: "AI Property Advisor",
    description:
      "Help buyers explore project information through an approachable, project-aware conversation concept.",
    image: interior,
    imageAlt: "Warm contemporary living space",
  },
  {
    title: "Property Matching",
    description:
      "Help buyers compare layouts and project details relevant to their needs—based on information the developer supplies.",
    image: residence3bhk,
    imageAlt: "Warm contemporary living room in a sample home",
  },
  {
    title: "Lead Qualification",
    description: "Organize requirements and enquiry context for a more informed sales handoff.",
    image: sales,
    imageAlt: "A sales team discussing a residential development with prospective buyers",
  },
  {
    title: "Buyer Engagement",
    description:
      "Help buyers explore project details, understand next steps and stay connected throughout their journey.",
    image: residenceBedroom,
    imageAlt: "A thoughtfully furnished bedroom in a sample residence",
  },
  {
    title: "Project Discovery",
    description:
      "Bring project information, home configurations and amenities together for easier exploration.",
    image: amenityClubhouse,
    imageAlt: "Clubhouse at an illustrative residential development",
  },
  {
    title: "Sales Follow-up",
    description:
      "Carry buyer preferences and enquiry context into a timely, informed sales handoff.",
    image: garden,
    imageAlt: "Landscaped residential development",
  },
];

const platformGalleryItems = capabilities.map((feature) => ({
  image: feature.image,
  label: feature.title,
  description: feature.description,
  alt: feature.imageAlt,
}));

type ChatMessage = { role: "buyer" | "advisor"; text: string };

const suggestedQuestions = [
  "What details are shown for the sample 3-bedroom home?",
  "How does a buyer request a project visit?",
  "Is this connected to live property availability?",
];

function getDemoReply(question: string) {
  const normalized = question.toLowerCase();
  if (normalized.includes("visit") || normalized.includes("schedule")) {
    return "In this sample journey, a buyer can preview a visit-request form. It does not send a request, reserve a time or contact a sales team.";
  }
  if (
    normalized.includes("live") ||
    normalized.includes("available") ||
    normalized.includes("inventory")
  ) {
    return "No. This is a predefined demonstration with illustrative project information. It is not connected to live inventory, pricing, an AI provider or a CRM.";
  }
  if (normalized.includes("budget") || normalized.includes("match")) {
    return "For this illustration, a buyer could compare sample homes by configuration and budget. Any matches shown here would be examples only—not verified availability or a recommendation.";
  }
  return "The sample project page can present illustrative details such as home configurations, amenities and possession timing. A real advisor should use only information reviewed and approved by the developer.";
}

function Home() {
  const initialAuthSession = Route.useLoaderData();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [compactIntegrations, setCompactIntegrations] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "buyer",
      text: "I'm looking for a 3-bedroom apartment within my budget.",
    },
    {
      role: "advisor",
      text: "Here is an illustrative match to explore. The sample details below are not verified availability or a live offer.",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [formPreviewed, setFormPreviewed] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 640px)");
    const update = () => setCompactIntegrations(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const page = document.querySelector<HTMLElement>(".home-page");
    const header = page?.querySelector<HTMLElement>(".home-header");
    if (!page || !header) return;

    const syncHeader = () => header.toggleAttribute("data-scrolled", window.scrollY > 12);
    syncHeader();
    window.addEventListener("scroll", syncHeader, { passive: true });

    const heroVisual = page.querySelector<HTMLElement>(".home-hero-visual");
    const heroImage = heroVisual?.querySelector<HTMLElement>("[data-hero-image]");
    const moveHeroImage = (event: PointerEvent) => {
      if (!heroVisual || !heroImage || event.pointerType === "touch") return;
      const bounds = heroVisual.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      heroImage.style.setProperty("--hero-x", `${x * -8}px`);
      heroImage.style.setProperty("--hero-y", `${y * -8}px`);
    };
    const resetHeroImage = () => {
      heroImage?.style.setProperty("--hero-x", "0px");
      heroImage?.style.setProperty("--hero-y", "0px");
    };
    heroVisual?.addEventListener("pointermove", moveHeroImage);
    heroVisual?.addEventListener("pointerleave", resetHeroImage);

    if (!("IntersectionObserver" in window)) {
      return () => {
        window.removeEventListener("scroll", syncHeader);
        heroVisual?.removeEventListener("pointermove", moveHeroImage);
        heroVisual?.removeEventListener("pointerleave", resetHeroImage);
      };
    }

    const revealTargets = page.querySelectorAll<HTMLElement>("main > section .home-container > *");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset["visible"] = "true";
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -36px 0px" },
    );
    revealTargets.forEach((target) => {
      target.dataset["reveal"] = "true";
      observer.observe(target);
    });
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveSection(`#${entry.target.id}`);
        }
      },
      { rootMargin: "-35% 0px -60% 0px" },
    );
    navLinks.forEach(({ href }) => {
      const section = page.querySelector<HTMLElement>(href);
      if (section) sectionObserver.observe(section);
    });
    page.dataset["motionReady"] = "true";

    return () => {
      window.removeEventListener("scroll", syncHeader);
      heroVisual?.removeEventListener("pointermove", moveHeroImage);
      heroVisual?.removeEventListener("pointerleave", resetHeroImage);
      observer.disconnect();
      sectionObserver.disconnect();
    };
  }, []);

  const navigateFromMobileMenu = (event: MouseEvent<HTMLAnchorElement>) => {
    const hash = event.currentTarget.hash;
    const target = hash ? document.getElementById(hash.slice(1)) : null;
    setMenuOpen(false);

    if (!target) return;

    event.preventDefault();
    window.history.pushState(null, "", hash);
    window.requestAnimationFrame(() => target.scrollIntoView({ block: "start" }));
  };

  const sendQuestion = (question: string) => {
    const trimmed = question.trim();
    if (!trimmed) return;
    setMessages((current) => [
      ...current,
      { role: "buyer", text: trimmed },
      { role: "advisor", text: getDemoReply(trimmed) },
    ]);
    setChatInput("");
  };

  const submitChat = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendQuestion(chatInput);
  };

  const previewForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormPreviewed(true);
  };

  return (
    <div className="home-page home-editorial min-h-screen bg-[#050505] text-[#f5f2ec]">
      <header className="home-header sticky top-0 z-50 border-b border-white/10 bg-[#050505]/70 backdrop-blur-xl">
        <div className="home-container flex h-[72px] items-center justify-between">
          <a href="#top" className="flex items-center gap-3" aria-label="Mavros RealtyAI home">
            <span className="flex size-9 items-center justify-center rounded-full border border-white/20 text-[#f5f2ec]">
              <Building2 size={19} strokeWidth={1.8} />
            </span>
            <span className="leading-none">
              <span className="block text-[15px] font-semibold tracking-[0.22em]">MAVROS</span>
              <span className="mt-1 block text-[10px] font-medium tracking-[0.2em] text-white/55">
                REALTYAI
              </span>
            </span>
          </a>

          <nav aria-label="Main navigation" className="hidden items-center gap-4 lg:flex xl:gap-7">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                aria-current={activeSection === link.href ? "location" : undefined}
                className="home-nav-link rounded-sm text-xs font-medium text-white/70 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#55ddf2] active:text-white xl:text-[13px]"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <AccountMenu session={initialAuthSession} />
            <a
              href="#pilot"
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/30 bg-white px-4 text-xs font-semibold text-[#080808] transition hover:bg-[#f5f2ec] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#55ddf2] active:scale-[0.98] xl:px-5 xl:text-[13px]"
            >
              Book a demo <ArrowUpRight size={15} />
            </a>
          </div>
          <button
            ref={menuButtonRef}
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-full border border-white/25 bg-black/20 text-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#55ddf2] active:scale-[0.96] lg:hidden"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setMenuOpen(false);
            }}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {menuOpen && (
          <nav
            id="mobile-navigation"
            aria-label="Mobile navigation"
            className="border-t border-white/10 bg-[#0b0b0b] py-4 lg:hidden"
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setMenuOpen(false);
                menuButtonRef.current?.focus();
              }
            }}
          >
            <div className="home-container flex flex-col gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={navigateFromMobileMenu}
                  className="rounded-xl px-3 py-3 text-sm font-medium text-white/75 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#55ddf2] active:bg-white/10"
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-2 flex gap-2">
                <AccountMenu
                  session={initialAuthSession}
                  mobile
                  onNavigate={() => setMenuOpen(false)}
                />
                <a
                  href="#pilot"
                  onClick={navigateFromMobileMenu}
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-black transition hover:bg-[#f5f2ec] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#55ddf2] active:scale-[0.98]"
                >
                  Book a demo <ArrowUpRight size={16} />
                </a>
              </div>
            </div>
          </nav>
        )}
      </header>

      <main id="top">
        <section className="home-hero relative isolate">
          <div className="home-container home-hero-content grid min-w-0 gap-10 pb-14 pt-10 sm:gap-12 sm:pb-16 sm:pt-14 lg:grid-cols-2 lg:items-center lg:gap-8 lg:py-6">
            <div className="relative z-10 min-w-0 max-w-[650px]">
              <h1 className="home-hero-title mt-0 max-w-[12ch] font-display text-[clamp(2.75rem,5.4vw,5.25rem)] leading-[0.98] tracking-[-0.055em] text-[#102039]">
                Turn Property Interest Into{" "}
                <span className="text-[#1268e8]">Sales Conversations.</span>
              </h1>
              <p className="mt-5 max-w-[570px] text-base leading-7 text-[#596a82] sm:mt-7 sm:text-lg sm:leading-8">
                Bring property discovery, buyer questions and organized follow-up into one
                intelligent workflow. Create the campaigns that start it all with Veytrix.AI.
              </p>
              <div className="home-hero-actions mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row">
                <a
                  href="#pilot"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#1268e8] px-6 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(18,104,232,0.2)] transition hover:-translate-y-0.5 hover:bg-[#0d58cb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1268e8] active:scale-[0.98]"
                >
                  Book a demo <ArrowRight size={16} />
                </a>
                <a
                  href="#platform"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#d6deea] bg-white px-6 text-sm font-semibold text-[#20314a] transition hover:border-[#a9bdd7] hover:bg-[#fafdff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1268e8] active:scale-[0.98]"
                >
                  Explore the platform <ArrowDownRight size={16} />
                </a>
              </div>
              <p className="mt-5 text-xs font-medium tracking-wide text-[#77869b] sm:mt-7">
                For property developers, marketing teams and sales teams.
              </p>
              <div className="home-hero-features mt-7 flex flex-wrap gap-x-6 gap-y-3 border-t border-[#dbe2ec] pt-5 text-[12px] font-medium text-[#4d5d74] sm:mt-9 sm:pt-6">
                <span className="flex items-center gap-2">
                  <Check size={14} className="text-[#1268e8]" /> Buyer-ready project pages
                </span>
                <span className="flex items-center gap-2">
                  <Check size={14} className="text-[#1268e8]" /> Clear sales handoff
                </span>
                <span className="flex items-center gap-2">
                  <Check size={14} className="text-[#1268e8]" /> Creative with Veytrix.AI
                </span>
              </div>
            </div>

            <div className="home-hero-visual relative mx-auto min-w-0 w-full max-w-[660px] lg:ml-auto">
              <div className="home-hero-visual-frame overflow-hidden rounded-[28px] border border-white/80 bg-white p-2.5 shadow-[0_32px_100px_rgba(31,56,91,0.18)] sm:p-3">
                <div className="home-hero-image-wrap relative aspect-[1.35/1] overflow-hidden rounded-[21px] sm:aspect-[1.65/1]">
                  <img
                    src={amenityPool}
                    alt="Contemporary residential towers around an illuminated pool at dusk"
                    width={1280}
                    height={896}
                    fetchPriority="high"
                    data-hero-image
                    className="absolute inset-0 size-full object-cover"
                  />
                  <div className="home-hero-overlay absolute inset-0 bg-gradient-to-t from-[#07172d]/90 via-[#07172d]/15 to-[#07172d]/5" />
                </div>

                <div className="grid gap-2.5 p-1.5 sm:grid-cols-[1.12fr_0.88fr] sm:p-2">
                  <div className="rounded-[18px] border border-[#e7ebf2] bg-[#f8faff] p-4 sm:p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-8 items-center justify-center rounded-xl bg-[#e9f1ff] text-[#1268e8]">
                          <Bot size={17} />
                        </span>
                        <div>
                          <p className="text-xs font-semibold text-[#1c2b42]">Property advisor</p>
                          <p className="mt-0.5 text-[10px] text-[#8692a4]">Sample conversation</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-medium text-[#74839a]">DEMO</span>
                    </div>
                    <div className="mt-4 rounded-2xl rounded-tl-sm bg-[#eaf1fb] px-3.5 py-3 text-[11px] leading-5 text-[#42536d]">
                      Are there any 3-bedroom homes in this project?
                    </div>
                    <div className="mt-2 rounded-2xl rounded-tr-sm bg-white px-3.5 py-3 text-[11px] leading-5 text-[#42536d] shadow-sm">
                      The sample listing includes 3-bedroom layouts. Ask the sales team to confirm
                      current availability.
                    </div>
                  </div>
                  <div className="flex flex-col justify-between rounded-[18px] bg-[#102039] p-4 text-white sm:p-5">
                    <div>
                      <div className="flex items-center gap-2 text-[#94bfff]">
                        <Layers3 size={15} />
                        <span className="text-[10px] font-semibold uppercase tracking-[0.14em]">
                          Sales context
                        </span>
                      </div>
                      <p className="mt-4 font-display text-xl">A clearer next step.</p>
                      <p className="mt-1.5 text-[11px] leading-5 text-white/65">
                        Buyer interests can be organized for a human follow-up.
                      </p>
                    </div>
                    <div className="mt-5 flex items-center justify-between border-t border-white/15 pt-3 text-[10px] text-white/70">
                      <span>Illustrative workflow</span>
                      <ArrowUpRight size={14} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-start gap-2 px-2 text-[10px] leading-4 text-[#7a889b]">
                <CircleHelp size={13} className="mt-0.5 shrink-0" />
                <p>
                  Product preview uses sample content; no live inventory, AI service or CRM is
                  connected.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="solutions" className="home-section">
          <div className="home-container home-solutions-container">
            <div className="home-solutions-intro">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#1268e8]">
                About MAVROS RealtyAI
              </p>
              <h2 className="mt-5 max-w-xl font-display text-4xl leading-[1.08] tracking-[-0.04em] text-[#102039] sm:text-5xl">
                Property marketing should do more than generate enquiries.
              </h2>
              <p className="mt-5 max-w-md text-sm leading-7 text-[#66758b]">
                A buyer's first question is the beginning of a journey. RealtyAI is designed to help
                teams keep that journey connected.
              </p>
              <a
                href="#how-it-works"
                className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[#55ddf2] hover:text-white"
              >
                See how the workflow connects <ArrowRight size={15} />
              </a>
            </div>
            <div className="home-solutions-carousel">
              <CircularCarousel
                items={solutionPanels}
                preset="orbit"
                intro="spin"
                cardWidth={520}
                aspectRatio={1.1}
                gap={32}
                tilt={-5}
                autoplay="off"
                draggable
                momentum={0.72}
                snap
                focusOnClick
                fadeColor="#080909"
                innerShade={0.45}
                cornerRadius={12}
                captions
                style={{ height: "100%", "--cc-accent": "#39D5E5" }}
              />
            </div>
          </div>
        </section>

        <section id="how-it-works" className="home-section home-journey-section">
          <div className="home-container">
            <div className="home-journey-intro">
              <div>
                <p className="home-journey-kicker">One connected journey</p>
                <h2 className="home-journey-heading">
                  From first impression to the next conversation.
                </h2>
              </div>
              <p className="home-journey-summary">
                A straightforward way to understand where RealtyAI fits—from the campaign that
                starts interest to the human follow-up that moves it forward.
              </p>
            </div>
            <div
              className="home-journey-track"
              role="list"
              aria-label="The six stages of the RealtyAI journey"
            >
              {steps.map((step) => {
                const Icon = step.icon;
                return (
                  <article
                    key={step.number}
                    className="home-journey-step"
                    role="listitem"
                    tabIndex={0}
                    aria-labelledby={`journey-stage-${step.number}`}
                  >
                    <div className="home-journey-marker" aria-hidden="true">
                      <Icon size={19} strokeWidth={1.7} />
                    </div>
                    <div className="home-journey-meta">
                      <span>Stage</span>
                      <span>{step.number}</span>
                    </div>
                    <h3 id={`journey-stage-${step.number}`}>{step.title}</h3>
                    <p>{step.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="platform" className="home-section">
          <div className="home-container">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#1268e8]">
                Mavros RealtyAI
              </p>
              <h2 className="mt-5 font-display text-4xl leading-[1.08] tracking-[-0.04em] sm:text-5xl">
                A more thoughtful way to move a property conversation forward.
              </h2>
              <p className="mt-5 text-sm leading-7 text-[#66758b]">
                Explore the capabilities the product is designed around. The experience shown here
                is a prototype; production connections and operational features are not implied.
              </p>
            </div>
            <div className="mt-12">
              <AccordionGallery
                items={platformGalleryItems}
                defaultIndex={-1}
                accentColor="#39d5e5"
                overlayColor="#080909"
                textColor="#f4f0e8"
                height={420}
                gap={10}
                radius={12}
                expandRatio={0.42}
              />
            </div>
          </div>
        </section>

        <section id="veytrix" className="home-section">
          <div className="home-container grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#4f6381]">
                A complementary product
              </p>
              <h2 className="mt-6 max-w-xl font-display text-4xl leading-[1.08] tracking-[-0.04em] text-[#102039] sm:text-5xl">
                Create property campaigns that make people stop scrolling.
              </h2>
              <p className="mt-5 max-w-lg text-sm leading-7 text-[#617189]">
                Veytrix.AI is a distinct creative-studio concept for turning property imagery into
                branded marketing content. RealtyAI helps carry that interest into a buyer
                conversation.
              </p>
              <div className="mt-8 grid gap-x-5 gap-y-4 sm:grid-cols-2">
                {[
                  "Property photo-to-video concepts",
                  "Promotional reels and formats",
                  "Branded templates and overlays",
                  "Preview and approval workflow",
                ].map((item) => (
                  <p key={item} className="flex items-start gap-2 text-xs leading-5 text-[#43536b]">
                    <Check size={14} className="mt-0.5 shrink-0 text-[#1268e8]" />
                    {item}
                  </p>
                ))}
              </div>
              <p className="mt-7 text-[11px] leading-5 text-[#7a899d]">
                Creative editor shown is a visual concept, not a connected rendering tool.
              </p>
              <a href="#veytrix-studio-preview" className="home-editorial-link mt-6">
                Explore Veytrix.AI <ArrowUpRight size={15} />
              </a>
            </div>

            <figure id="veytrix-studio-preview" className="home-studio-showcase">
              <div className="home-studio-frame">
                <img
                  src={residenceBedroom}
                  alt="Sunlit contemporary bedroom used as a sample property campaign visual"
                  width={1024}
                  height={768}
                  loading="lazy"
                />
                <div className="home-studio-shade" />
                <div className="home-studio-topline">
                  <span>
                    <Film size={15} /> Veytrix.AI Studio
                  </span>
                  <span>Creative concept</span>
                </div>
                <div className="home-studio-title">
                  <span>Campaign study · 01</span>
                  <p>
                    A quieter kind
                    <br />
                    of arrival.
                  </p>
                </div>
                <span className="home-studio-format">Property campaign / vertical edit</span>
              </div>
              <figcaption className="home-studio-storyboard">
                <span className="home-studio-story-label">Visual sequence · sample</span>
                <div>
                  <img src={amenityClubhouse} alt="" width={320} height={220} loading="lazy" />
                  <img src={interior} alt="" width={320} height={220} loading="lazy" />
                  <img src={amenityJogging} alt="" width={320} height={220} loading="lazy" />
                </div>
              </figcaption>
            </figure>
          </div>
        </section>

        <section id="advisor-demo" className="home-section">
          <div className="home-container grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-center lg:gap-20">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#1268e8]">
                Sample interaction
              </p>
              <h2 className="mt-5 font-display text-4xl leading-[1.08] tracking-[-0.04em] sm:text-5xl">
                Ask about a project. See the journey.
              </h2>
              <p className="mt-5 text-sm leading-7 text-[#66758b]">
                Try a lightweight, predefined conversation to see how a buyer-facing advisor might
                keep the discussion moving.
              </p>
              <div className="home-advisor-disclaimer mt-6 rounded-2xl border border-[#dce5f1] bg-white p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#65758c]">
                  Sample demonstration data
                </p>
                <p className="mt-2 text-xs leading-5 text-[#78869a]">
                  Replies are deterministic examples. No live inventory, AI provider or CRM is
                  connected, and no personal information is sent.
                </p>
              </div>
            </div>

            <div className="home-advisor-shell overflow-hidden rounded-[24px] border border-[#dfe6ef] bg-white shadow-[0_20px_60px_rgba(25,48,80,0.09)]">
              <div className="flex items-center justify-between border-b border-[#e9edf3] px-5 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#1268e8]">
                    <Bot size={20} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">Sample Property Advisor</p>
                    <p className="mt-0.5 text-[10px] text-[#8995a6]">Interactive prototype</p>
                  </div>
                </div>
                <span className="rounded-full bg-[#eef3fa] px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wide text-[#60718a]">
                  Demo
                </span>
              </div>
              <div
                aria-label="Sample conversation"
                aria-live="polite"
                className="home-advisor-chat flex max-h-[310px] min-h-[260px] flex-col gap-3 overflow-y-auto bg-[#f8faff] p-4 sm:p-6"
              >
                {messages.map((message, index) => (
                  <div
                    key={`${index}-${message.role}`}
                    className={`home-advisor-message max-w-[88%] break-words rounded-2xl px-4 py-3 text-xs leading-5 ${
                      message.role === "buyer"
                        ? "ml-auto rounded-br-sm bg-[#1268e8] text-white"
                        : "rounded-bl-sm border border-[#e7ebf2] bg-white text-[#4d5d74]"
                    }`}
                  >
                    {message.text}
                  </div>
                ))}
                {messages.length === 2 && (
                  <article className="home-advisor-property-card max-w-[88%] rounded-2xl rounded-bl-sm border border-[#e1e7ef] bg-white p-4">
                    <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#8190a4]">
                      Sample property match · illustrative data
                    </p>
                    <h3 className="mt-2 text-xs font-semibold text-[#20324a]">
                      Aranya Greens · sample 3 BHK
                    </h3>
                    <p className="mt-1 text-[10px] leading-5 text-[#6d7c91]">
                      1,340 sq ft carpet · example price ₹1.33 Cr
                    </p>
                    <p className="mt-1 text-[9px] leading-4 text-[#8a96a7]">
                      Not live availability or a verified price.
                    </p>
                    <a
                      href="#pilot"
                      className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#1268e8] hover:text-[#0d58cb]"
                    >
                      Preview a callback request <ArrowRight size={12} />
                    </a>
                    <p className="mt-1 text-[9px] text-[#8995a6]">
                      This preview will not contact a sales team.
                    </p>
                  </article>
                )}
              </div>
              <div className="border-t border-[#e9edf3] p-4 sm:px-6">
                <p className="text-[10px] font-semibold text-[#78869a]">Try a sample question</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {suggestedQuestions.map((question) => (
                    <button
                      key={question}
                      type="button"
                      onClick={() => sendQuestion(question)}
                      className="home-advisor-question rounded-full border border-[#dfe6ef] bg-white px-3 py-2 text-left text-[10px] leading-4 text-[#53637a] transition hover:border-[#a9c5ef] hover:text-[#1268e8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1268e8]"
                    >
                      {question}
                    </button>
                  ))}
                </div>
                <form onSubmit={submitChat} className="mt-4 flex gap-2">
                  <label htmlFor="advisor-question" className="sr-only">
                    Ask the sample property advisor
                  </label>
                  <input
                    id="advisor-question"
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    placeholder="Ask a sample question…"
                    maxLength={500}
                    className="h-11 min-w-0 flex-1 rounded-full border border-[#dfe6ef] bg-[#f8faff] px-4 text-xs outline-none placeholder:text-[#9aa6b6] focus:border-[#1268e8] focus:ring-2 focus:ring-[#1268e8]/15"
                  />
                  <button
                    type="submit"
                    aria-label="Send sample question"
                    className="home-advisor-send flex size-11 shrink-0 items-center justify-center rounded-full bg-[#1268e8] text-white transition hover:bg-[#0d58cb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1268e8]"
                  >
                    <Send size={16} />
                  </button>
                </form>
                <a
                  href="#pilot"
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#1268e8] hover:text-[#0d58cb]"
                >
                  Request a demo <ArrowRight size={14} />
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="trust" className="home-section">
          <div className="home-container">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:gap-20">
              <div>
                <span className="home-trust-emblem flex size-12 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#1268e8]">
                  <ShieldCheck size={22} />
                </span>
                <p className="mt-7 text-xs font-bold uppercase tracking-[0.2em] text-[#1268e8]">
                  Designed with care
                </p>
                <h2 className="mt-4 max-w-md font-display text-4xl leading-[1.08] tracking-[-0.04em] sm:text-5xl">
                  Trust is part of the experience.
                </h2>
                <p className="mt-5 max-w-md text-sm leading-7 text-[#66758b]">
                  These are product principles that can guide implementation—not claims of
                  production controls or certifications.
                </p>
              </div>
              <div className="home-trust-principles">
                {trustPrinciples.map(({ title, description, icon: Icon }, index) => (
                  <article key={title} className="home-trust-principle">
                    <span className="home-trust-principle-icon">
                      <Icon size={16} strokeWidth={1.6} />
                    </span>
                    <span className="home-trust-principle-copy">
                      <span className="home-trust-principle-number">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <h3>{title}</h3>
                      <p>{description}</p>
                    </span>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="integrations" className="home-section">
          <div className="home-container home-integration-layout">
            <div className="home-integration-intro">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#1268e8]">
                Flexible by design
              </p>
              <h2 className="mt-4 max-w-md font-display text-4xl leading-tight tracking-[-0.04em]">
                Integration options for your workflow.
              </h2>
              <p className="mt-4 max-w-md text-sm leading-6 text-[#69788e]">
                Explore the channels and systems that may fit your project. This prototype does not
                imply live connections or partnerships.
              </p>
            </div>
            <div className="home-integration-folders">
              {[
                {
                  label: "Buyer Conversations",
                  items: integrationOptions.slice(0, 3),
                },
                {
                  label: "Team Systems & Creative",
                  items: integrationOptions.slice(3),
                },
              ].map((group) => (
                <div className="home-integration-folder" key={group.label}>
                  <FolderFloat
                    items={group.items.map(({ label, icon }) => ({
                      label,
                      value: label,
                      icon,
                    }))}
                    label={group.label}
                    sublabel={`${group.items.length} optional integrations`}
                    trigger="hover"
                    closeOnSelect
                    physics
                    drift={0.28}
                    folderColor="#15191B"
                    frontColor="#25373A"
                    paperColor="#F4F0E8"
                    itemColor="#F4F0E8"
                    itemTextColor="#080909"
                    labelColor="#F4F0E8"
                    width={compactIntegrations ? 224 : 248}
                    height={compactIntegrations ? 150 : 166}
                    radius={16}
                    spread={compactIntegrations ? 90 : 168}
                    lift={26}
                    tilt={5}
                    flapAngle={34}
                    restAngle={12}
                    openDuration={520}
                    stagger={48}
                    bounce={0.24}
                    className="home-integration-folder-float"
                  />
                </div>
              ))}
            </div>
            <p className="home-integration-disclaimer">
              Optional integration concepts to explore; none are represented as connected.
            </p>
          </div>
        </section>

        <section id="pilot" className="home-section bg-[#102039] text-white">
          <div className="home-container grid gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:gap-20">
            <div className="home-pilot-copy">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8ab8ff]">
                Pilot conversation
              </p>
              <h2 className="mt-5 max-w-xl font-display text-4xl leading-[1.08] tracking-[-0.04em] sm:text-5xl">
                Start with one project. Prove the workflow. Scale with confidence.
              </h2>
              <p className="mt-5 max-w-lg text-sm leading-7 text-white/65">
                A focused pilot discussion can shape a useful first step around your project and
                team—without assuming a price, timeline or outcome.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  "One developer and one selected property project",
                  "Project information reviewed with your team",
                  "Buyer enquiry and sales workflow to explore",
                  "Defined measures, review points and expansion discussion",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-xs leading-5 text-white/80">
                    <Check size={15} className="mt-0.5 shrink-0 text-[#8ab8ff]" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-8 text-[10px] leading-5 text-white/65">
                This website is a prototype. Pilot availability and commercial terms are not
                specified here.
              </p>
            </div>

            <div className="home-pilot-card rounded-[24px] bg-white p-5 text-[#15253d] shadow-[0_24px_70px_rgba(0,0,0,0.18)] sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-2xl">Discuss a pilot</h3>
                  <p className="mt-2 text-xs leading-5 text-[#75839a]">
                    Preview the details a conversation might cover.
                  </p>
                </div>
                <span className="rounded-full bg-[#eef3fa] px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wide text-[#60718a]">
                  Preview only
                </span>
              </div>
              <form onSubmit={previewForm} className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="pilot-name"
                      className="text-[11px] font-semibold text-[#394b63]"
                    >
                      Name
                    </label>
                    <input
                      id="pilot-name"
                      name="name"
                      required
                      maxLength={100}
                      autoComplete="name"
                      className="mt-1.5 h-11 w-full rounded-xl border border-[#dfe5ed] px-3 text-sm outline-none transition focus:border-[#1268e8] focus:ring-2 focus:ring-[#1268e8]/15"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="pilot-email"
                      className="text-[11px] font-semibold text-[#394b63]"
                    >
                      Business email
                    </label>
                    <input
                      id="pilot-email"
                      name="email"
                      type="email"
                      required
                      maxLength={255}
                      autoComplete="email"
                      className="mt-1.5 h-11 w-full rounded-xl border border-[#dfe5ed] px-3 text-sm outline-none transition focus:border-[#1268e8] focus:ring-2 focus:ring-[#1268e8]/15"
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="pilot-company"
                      className="text-[11px] font-semibold text-[#394b63]"
                    >
                      Company / developer
                    </label>
                    <input
                      id="pilot-company"
                      name="company"
                      required
                      maxLength={150}
                      autoComplete="organization"
                      className="mt-1.5 h-11 w-full rounded-xl border border-[#dfe5ed] px-3 text-sm outline-none transition focus:border-[#1268e8] focus:ring-2 focus:ring-[#1268e8]/15"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="pilot-projects"
                      className="text-[11px] font-semibold text-[#394b63]"
                    >
                      Number of projects{" "}
                      <span className="font-normal text-[#68778d]">· optional</span>
                    </label>
                    <input
                      id="pilot-projects"
                      name="projects"
                      type="number"
                      min={1}
                      max={999}
                      inputMode="numeric"
                      className="mt-1.5 h-11 w-full rounded-xl border border-[#dfe5ed] px-3 text-sm outline-none transition focus:border-[#1268e8] focus:ring-2 focus:ring-[#1268e8]/15"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="pilot-message"
                    className="text-[11px] font-semibold text-[#394b63]"
                  >
                    What would you like to explore?{" "}
                    <span className="font-normal text-[#68778d]">· optional</span>
                  </label>
                  <textarea
                    id="pilot-message"
                    name="message"
                    rows={3}
                    maxLength={1000}
                    className="mt-1.5 w-full resize-y rounded-xl border border-[#dfe5ed] px-3 py-2.5 text-sm outline-none transition focus:border-[#1268e8] focus:ring-2 focus:ring-[#1268e8]/15"
                  />
                </div>
                <label className="flex items-start gap-2.5 text-[10px] leading-4 text-[#6e7c91]">
                  <input
                    type="checkbox"
                    required
                    className="mt-0.5 size-4 shrink-0 accent-[#1268e8]"
                  />
                  I understand this is a local-only preview. My details will not be sent or stored.
                </label>
                <button
                  type="submit"
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#1268e8] px-5 text-sm font-semibold text-white transition hover:bg-[#0d58cb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1268e8]"
                >
                  Preview demo request <ArrowRight size={16} />
                </button>
                <p
                  role="status"
                  aria-live="polite"
                  className="min-h-5 text-center text-[11px] leading-5 text-[#53647b]"
                >
                  {formPreviewed
                    ? "Preview complete. Nothing was sent or saved."
                    : "Demo-only form: no information leaves this page."}
                </p>
              </form>
            </div>
          </div>
        </section>

        <section id="faq" className="home-section">
          <div className="home-container grid gap-8 lg:grid-cols-[0.65fr_1.35fr] lg:gap-20">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#1268e8]">
                Questions, answered
              </p>
              <h2 className="mt-5 font-display text-4xl leading-[1.08] tracking-[-0.04em] sm:text-5xl">
                A few things worth knowing.
              </h2>
              <p className="mt-5 max-w-sm text-sm leading-6 text-[#6b7a90]">
                Clear answers about the product direction and what this prototype does—and
                doesn’t—connect to.
              </p>
              <CircleHelp size={28} strokeWidth={1.4} className="mt-8 text-[#9aabc0]" />
            </div>
            <div className="divide-y divide-[#e2e7ef] border-y border-[#e2e7ef]">
              {faqs.map((faq) => (
                <details key={faq.question} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-5 rounded-sm text-sm font-semibold text-[#20324a] marker:hidden focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1268e8] [&::-webkit-details-marker]:hidden">
                    {faq.question}
                    <ChevronDown
                      size={17}
                      className="shrink-0 text-[#8190a4] transition-transform group-open:rotate-180"
                    />
                  </summary>
                  <p className="max-w-2xl pt-3 pr-8 text-xs leading-6 text-[#6c7b91]">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section id="home-cta" className="home-section home-section-cta">
          <div className="home-container relative overflow-hidden rounded-[30px] bg-[#dce9fa] px-6 py-12 sm:px-12 sm:py-14 lg:px-16">
            <img
              className="home-cta-image"
              src={residenceBalcony}
              alt=""
              width={1600}
              height={900}
              loading="lazy"
              aria-hidden="true"
            />
            <div className="pointer-events-none absolute -right-10 -top-28 size-96 rounded-full border border-white/50" />
            <div className="pointer-events-none absolute -right-4 -top-20 size-80 rounded-full border border-white/50" />
            <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#41628e]">
                  Mavros RealtyAI × Veytrix.AI
                </p>
                <h2 className="mt-4 font-display text-4xl leading-[1.08] tracking-[-0.04em] text-[#102039] sm:text-5xl">
                  Connect Property Marketing With Your Sales Workflow.
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-6 text-[#536883]">
                  See how creative campaigns and buyer conversations could work together for your
                  property projects.
                </p>
              </div>
              <a
                href="#pilot"
                className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-[#102039] px-6 text-sm font-semibold text-white transition hover:bg-[#1c3557]"
              >
                Book a demo <ArrowUpRight size={16} />
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="home-footer">
        <div className="home-container home-footer-grid">
          <div className="home-footer-brand">
            <a href="#top" className="inline-flex items-center gap-3" aria-label="Mavros home">
              <span className="home-footer-mark">
                <Building2 size={18} />
              </span>
              <span>
                <span className="block text-xs font-bold tracking-[0.2em]">MAVROS</span>
                <span className="mt-1 block text-[9px] font-medium tracking-[0.18em] text-white/55">
                  REALTYAI
                </span>
              </span>
            </a>
            <p className="mt-5 max-w-sm text-xs leading-6 text-white/55">
              A connected product vision for property marketing, buyer conversations and sales
              workflows. Veytrix.AI is a complementary creative-studio concept.
            </p>
          </div>
          <nav aria-label="Quick links">
            <h2>Quick links</h2>
            <a href="#solutions">About MAVROS</a>
            <a href="#platform">Platform</a>
            <a href="#pilot">Pilot conversation</a>
          </nav>
          <nav aria-label="Platform navigation">
            <h2>Explore</h2>
            <a href="#how-it-works">How it works</a>
            <a href="#advisor-demo">Property Advisor demo</a>
            <a href="#integrations">Integration options</a>
            <a href="#faq">FAQs</a>
          </nav>
          <nav aria-label="Related product">
            <h2>Related product</h2>
            <a href="#veytrix">Veytrix.AI Studio</a>
            <a href="#home-cta">Book a demo</a>
          </nav>
        </div>
        <div className="home-container home-footer-bottom">
          <p>© {new Date().getFullYear()} Mavros Tech. All rights reserved.</p>
          <p>Product concepts and sample content shown for demonstration purposes.</p>
        </div>
      </footer>
    </div>
  );
}
