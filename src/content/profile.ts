// Datos que no dependen del idioma. Los textos traducibles viven en /messages.

export const profile = {
  name: "Kevin Mata",
  email: "kevinmatta26@gmail.com",
  github: "https://github.com/KevinMatta",
  linkedin: "https://www.linkedin.com/in/kevin-mata-honduras",
  cv: null as string | null,
};

export const experience: { id: "cit" | "ahm"; short: string; since: string; until?: string }[] = [
  { id: "cit", short: "CIT", since: "2025-01" },
  { id: "ahm", short: "AHM", since: "2023-11", until: "2024-12" },
];

export type StackGroup = "backend" | "frontend" | "data" | "ai" | "infra" | "flow";


export const stack: { id: string; tool: string; group: StackGroup; icon?: string; mono?: string }[] = [
  { id: "csharp", tool: "C#", group: "backend", mono: "C#" },
  { id: "dotnet", tool: ".NET", group: "backend", mono: ".NET" },
  { id: "efcore", tool: "EF Core", group: "data", mono: "EF" },
  { id: "dapper", tool: "Dapper", group: "data", mono: "Dp" },
  { id: "node", tool: "Node.js", group: "backend", icon: "nodedotjs" },
  { id: "nest", tool: "NestJS", group: "backend", icon: "nestjs" },
  { id: "jwt", tool: "JWT", group: "backend", icon: "jsonwebtokens" },
  { id: "swagger", tool: "Swagger", group: "backend", icon: "swagger" },
  { id: "typescript", tool: "TypeScript", group: "frontend", icon: "typescript" },
  { id: "angular", tool: "Angular", group: "frontend", icon: "angular" },
  { id: "react", tool: "React", group: "frontend", icon: "react" },
  { id: "next", tool: "Next.js", group: "frontend", icon: "nextdotjs" },
  { id: "astro", tool: "Astro", group: "frontend", icon: "astro" },
  { id: "tailwind", tool: "Tailwind", group: "frontend", icon: "tailwindcss" },
  { id: "sqlserver", tool: "SQL Server", group: "data", mono: "SQL" },
  { id: "postgres", tool: "PostgreSQL", group: "data", icon: "postgresql" },
  { id: "mongo", tool: "MongoDB", group: "data", icon: "mongodb" },
  { id: "mcp", tool: "MCP", group: "ai", icon: "modelcontextprotocol" },
  { id: "llm", tool: "LLM APIs", group: "ai", mono: "LLM" },
  { id: "text2sql", tool: "Text-to-SQL", group: "ai", mono: "→SQL" },
  { id: "docker", tool: "Docker", group: "infra", icon: "docker" },
  { id: "nginx", tool: "Nginx", group: "infra", icon: "nginx" },
  { id: "actions", tool: "GitHub Actions", group: "infra", icon: "githubactions" },
  { id: "git", tool: "Git", group: "flow", icon: "git" },
  { id: "postman", tool: "Postman", group: "flow", icon: "postman" },
  { id: "jira", tool: "Jira", group: "flow", icon: "jira" },
];

type Localized = { es: string; en: string };

export type Project = {
  slug: string;
  status: "pending" | "live";
  title?: Localized;
  summary?: Localized;
  stack?: string[];
  year?: number;
  href?: string;
  repo?: string;
  image?: string;
};

export const projects: Project[] = [
  {
    slug: "johana-matta",
    status: "live",
    title: { es: "Johana Matta", en: "Johana Matta" },
    summary: {
      es: "Sitio de una maquillista profesional: portafolio, servicios, catálogo y SEO local en San Pedro Sula.",
      en: "A professional makeup artist's site: portfolio, services, catalog and local SEO in San Pedro Sula.",
    },
    stack: ["Next.js", "React", "GSAP", "TypeScript"],
    year: 2026,
    href: "https://johanamatta.com",
    repo: "https://github.com/KevinMatta/johana-matta",
    image: "/projects/johana-matta.jpg",
  },
  { slug: "proyecto-2", status: "pending" },
  { slug: "proyecto-3", status: "pending" },
];
