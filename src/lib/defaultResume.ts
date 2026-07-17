/**
 * Starter LaTeX resume template.
 *
 * Deliberately restricted to LaTeX constructs the in-browser renderer
 * (latex.js — see lib/latexCompiler.ts) actually supports: no \newcommand /
 * \renewcommand, no \hfill / \rule, no third-party packages like geometry or
 * enumitem (they're either unrecognized or silently no-op). Sticking to core
 * article-class commands (\section*, itemize, textbf/textit, center, \\)
 * also happens to line up with the ATS rules (no tables/icons/images,
 * standard structure) — see the tailoring prompt in lib/anthropic.ts.
 */
export const DEFAULT_RESUME_LATEX = String.raw`\documentclass[11pt]{article}
\pagestyle{empty}

\begin{document}

\begin{center}
{\Huge\bfseries Jane Doe}\\
San Francisco, CA --- (555) 123-4567 --- jane.doe@email.com --- linkedin.com/in/janedoe
\end{center}

\section*{Summary}
Software engineer with 5+ years of experience building and shipping web applications.
Skilled in JavaScript/TypeScript, React, and Node.js, with a track record of improving
performance and reliability for production systems.

\section*{Experience}
\textbf{Software Engineer} --- \textit{Acme Corp}, San Francisco, CA \\
\textit{Jan 2022 -- Present}
\begin{itemize}
\item Built and maintained a React/TypeScript front end serving 50{,}000+ monthly active users.
\item Led migration of a legacy service to a microservice architecture, cutting average response time by 35\%.
\item Mentored two junior engineers and ran weekly code reviews.
\end{itemize}

\textbf{Software Engineer} --- \textit{Beta Industries}, Remote \\
\textit{Jun 2019 -- Dec 2021}
\begin{itemize}
\item Developed internal tooling in Node.js that reduced manual QA time by 20 hours per week.
\item Collaborated with product and design to ship 10+ customer-facing features.
\end{itemize}

\section*{Education}
\textbf{B.S. in Computer Science} --- \textit{State University} \\
\textit{2015 -- 2019}

\section*{Skills}
JavaScript, TypeScript, React, Node.js, Python, SQL, Git, REST APIs, Agile/Scrum

\end{document}
`
