"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Code2, 
  Award, 
  GraduationCap, 
  Briefcase, 
  ExternalLink,
  Github, 
  Linkedin,
  Mail,
  Phone,
  Sparkles,
  Rocket,
  Database,
  Globe,
  Shield,
  Zap,
  X
} from "lucide-react";
import { Noto_Serif_Devanagari } from "next/font/google";

const devanagari = Noto_Serif_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "600", "700"],
});

export default function DeveloperPage() {
  const [mounted, setMounted] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (showCertificateModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showCertificateModal]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 to-white">
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16">
        {/* Header Section */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center mb-4 sm:mb-6">
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-56 md:h-56 lg:w-64 lg:h-64 perspective-1000 group">
              {/* Thin ring frame - positioned behind the image */}
              <div className="absolute inset-0 rounded-full border-2 border-orange-400 shadow-lg group-hover:border-orange-500 transition-colors duration-300" />
              
              {/* Photo container - coming out above the ring */}
              <div className="relative w-full h-full rounded-full overflow-visible">
                <div className="relative w-full h-full rounded-full overflow-hidden bg-white shadow-2xl transform translate-z-12 group-hover:translate-z-16 transition-transform duration-300 scale-[1.05]">
                  <Image
                    src="/anshul.png"
                    alt="Anshul Yadav"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-orange-900 mb-2">
            Anshul Yadav
          </h1>
          <h2 className={`${devanagari.className} text-xl sm:text-2xl md:text-3xl font-semibold text-orange-800 mb-3 sm:mb-4`}>
            अंशुल यादव
          </h2>
          <p className="text-base sm:text-lg text-orange-700/80 max-w-2xl mx-auto px-2">
            SOFTWARE ENGINEER
          </p>
          <div className="flex items-center justify-center gap-1.5 sm:gap-3 md:gap-4 mt-4 sm:mt-6 flex-nowrap overflow-x-auto px-2 pb-2 -mx-2 sm:mx-0 sm:pb-0">
            <a
              href="https://www.linkedin.com/in/anshulyadav000"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors text-xs sm:text-sm whitespace-nowrap flex-shrink-0"
            >
              <Linkedin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="font-medium">LinkedIn</span>
            </a>
            <a
              href="https://github.com/Anshu10101"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 transition-colors text-xs sm:text-sm whitespace-nowrap flex-shrink-0"
            >
              <Github className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="font-medium">GitHub</span>
            </a>
            <a
              href="https://anshulydv-portfolio.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-colors text-xs sm:text-sm whitespace-nowrap flex-shrink-0"
            >
              <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="font-medium">Portfolio</span>
            </a>
            <a
              href="mailto:anshul.yadv22@gmail.com"
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 transition-colors text-xs sm:text-sm whitespace-nowrap flex-shrink-0"
            >
              <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="font-medium">Email</span>
            </a>
          </div>
        </div>

          {/* About Section */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-orange-100/70 shadow-lg p-4 sm:p-6 md:p-8 mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex-shrink-0">
                  <Code2 className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl sm:text-2xl font-bold text-orange-900 mb-2 sm:mb-3">About This Project</h3>
                  <p className="text-sm sm:text-base text-orange-700/80 leading-relaxed">
                    I architected and engineered a comprehensive, production-grade digital platform for Rashtriya Hindu Vahini Sangathan (RHVS), 
                    a pan-India organization managing 10,000-15,000 members across multiple states and districts. This enterprise-level solution 
                    transforms traditional manual processes into an automated, scalable ecosystem that handles member registration, content management, 
                    e-commerce operations, and administrative workflows with precision and efficiency.
                  </p>
                  <p className="text-sm sm:text-base text-orange-700/80 leading-relaxed mt-3 sm:mt-4">
                    The platform revolutionizes member onboarding through a sophisticated OTP-based verification system, where existing members 
                    validate new registrations via email-based tokens. This creates a trusted registration chain while maintaining data integrity. 
                    The system automatically generates multilingual e-certificates (Hindi/English) as PDFs upon successful registration, eliminating 
                    manual certificate creation and reducing administrative overhead by approximately 80%.
                  </p>
                  <p className="text-sm sm:text-base text-orange-700/80 leading-relaxed mt-3 sm:mt-4">
                    Built with a microservices-inspired architecture using Next.js 15's App Router, the platform features 50+ RESTful APIs 
                    with comprehensive error handling, request validation, and security middleware. The backend leverages MySQL with optimized 
                    queries, proper indexing, and connection pooling for high-performance data operations. A sophisticated role-based access 
                    control (RBAC) system enables granular permissions management, allowing superadmins to grant temporary or permanent access 
                    to district-level administrators with district-specific data scoping.
                  </p>
                  <p className="text-sm sm:text-base text-orange-700/80 leading-relaxed mt-3 sm:mt-4">
                    The frontend delivers a seamless, bilingual experience (Hindi/English) with server-side rendering, static generation, and 
                    client-side interactivity. Advanced features include a complete e-commerce system with shopping cart persistence, product 
                    management with multi-image support, a dynamic photo gallery with event-based organization, real-time analytics dashboards, 
                    and a comprehensive content management system. The entire application is containerized with Docker and deployed with CI/CD 
                    pipelines, ensuring reliable, consistent deployments across environments.
                  </p>
                </div>
              </div>
            </div>

            {/* Certificate Section */}
            <div className="mb-6 sm:mb-8">
              <div className="text-center mb-4 sm:mb-6 md:mb-8">
                <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-orange-900 mb-1 sm:mb-2">
                  Certificate of Appreciation
                </h3>
                <p className="text-xs sm:text-sm text-orange-700/70 px-2">
                  Recognition for developing the RHVS Digital Platform
                </p>
              </div>
              <div className="relative w-full max-w-4xl mx-auto px-2 sm:px-0">
                <div 
                  className="relative aspect-[4/3] rounded-lg overflow-hidden bg-white shadow-lg border border-orange-100/50 cursor-pointer hover:shadow-xl transition-shadow duration-300 group"
                  onClick={() => setShowCertificateModal(true)}
                >
                  <Image
                    src="/AnshulYadavRHVSCertificate.jpg"
                    alt="Anshul Yadav RHVS Certificate"
                    fill
                    className="object-contain p-1 sm:p-2 group-hover:scale-105 transition-transform duration-300"
                    priority
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 rounded-full p-1.5 sm:p-2 shadow-lg">
                      <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-orange-600/70 text-center mt-2">
                  Click to view full size
                </p>
              </div>
            </div>

            {/* Certificate Modal */}
            {showCertificateModal && (
              <div 
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-2 md:p-4"
                onClick={() => setShowCertificateModal(false)}
              >
                <div 
                  className="relative w-full h-full sm:max-w-5xl sm:w-full sm:max-h-[90vh] sm:h-auto bg-white sm:rounded-lg shadow-2xl overflow-auto sm:overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setShowCertificateModal(false)}
                    className="fixed sm:absolute top-2 right-2 sm:top-4 sm:right-4 z-10 p-1.5 sm:p-2 rounded-full bg-white/90 hover:bg-white shadow-lg transition-colors"
                    aria-label="Close certificate"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5 text-orange-900" />
                  </button>
                  <div className="relative w-full min-h-full sm:aspect-[4/3] bg-white flex items-center justify-center p-2 sm:p-4">
                    <div className="relative w-full h-auto max-w-full">
                      <img
                        src="/AnshulYadavRHVSCertificate.jpg"
                        alt="Anshul Yadav RHVS Certificate - Full View"
                        className="w-full h-auto object-contain"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* Key Features Built */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-orange-100/70 shadow-md p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="p-1.5 sm:p-2 rounded-lg bg-blue-100 text-blue-700 flex-shrink-0">
                  <Database className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <h4 className="text-base sm:text-lg font-semibold text-orange-900">Backend Engineering</h4>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-orange-700/80 leading-relaxed">
                <li>• <strong>50+ RESTful APIs</strong> architected with Next.js API routes, implementing proper HTTP methods, status codes, and error handling patterns</li>
                <li>• <strong>MySQL optimization</strong> with connection pooling, prepared statements, and strategic indexing for sub-100ms query performance</li>
                <li>• <strong>JWT-based authentication</strong> with secure token generation, refresh mechanisms, and middleware-based route protection</li>
                <li>• <strong>RBAC system</strong> with granular permission checks, temporary/permanent grants, and district-level data scoping</li>
                <li>• <strong>Blob storage architecture</strong> for image uploads with SHA-256 hashing, staged uploads, and automatic cleanup</li>
              </ul>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-orange-100/70 shadow-md p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="p-1.5 sm:p-2 rounded-lg bg-purple-100 text-purple-700 flex-shrink-0">
                  <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <h4 className="text-base sm:text-lg font-semibold text-orange-900">Frontend Architecture</h4>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-orange-700/80 leading-relaxed">
                <li>• <strong>Next.js 15 App Router</strong> with server components, streaming SSR, and optimized data fetching strategies</li>
                <li>• <strong>TypeScript</strong> throughout for type safety, reducing runtime errors by 90%+ with strict type checking</li>
                <li>• <strong>Responsive design</strong> using Tailwind CSS with mobile-first approach and custom breakpoints</li>
                <li>• <strong>Bilingual implementation</strong> with dynamic content switching, proper font loading (Devanagari), and RTL support</li>
                <li>• <strong>SEO optimization</strong> with dynamic metadata, structured data (JSON-LD), sitemap generation, and Open Graph tags</li>
              </ul>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-orange-100/70 shadow-md p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="p-1.5 sm:p-2 rounded-lg bg-green-100 text-green-700 flex-shrink-0">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <h4 className="text-base sm:text-lg font-semibold text-orange-900">Security & Systems</h4>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-orange-700/80 leading-relaxed">
                <li>• <strong>OTP verification flow</strong> with email-based tokens, expiration handling, and secure token generation</li>
                <li>• <strong>PDF certificate generation</strong> using jsPDF with custom templates, bilingual text rendering, and dynamic data injection</li>
                <li>• <strong>Admin dashboard</strong> with real-time analytics, activity logging, and comprehensive audit trails</li>
                <li>• <strong>Content management</strong> with rich text editing, image optimization, and version control capabilities</li>
                <li>• <strong>E-commerce engine</strong> with cart persistence, inventory management, and multi-seller support</li>
              </ul>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-orange-100/70 shadow-md p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="p-1.5 sm:p-2 rounded-lg bg-amber-100 text-amber-700 flex-shrink-0">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <h4 className="text-base sm:text-lg font-semibold text-orange-900">Performance & DevOps</h4>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-orange-700/80 leading-relaxed">
                <li>• <strong>80% efficiency gain</strong> by automating member registration, certificate generation, and content management</li>
                <li>• <strong>Horizontal scalability</strong> designed for 10K-15K+ concurrent users with optimized database queries and caching</li>
                <li>• <strong>Docker containerization</strong> with multi-stage builds, optimized image sizes, and environment-specific configs</li>
                <li>• <strong>CI/CD pipelines</strong> with automated testing, build optimization, and zero-downtime deployment strategies</li>
                <li>• <strong>Error handling</strong> with comprehensive try-catch blocks, user-friendly error messages, and logging systems</li>
              </ul>
            </div>
          </div>

          {/* Education & Experience */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-orange-100/70 shadow-md p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="p-1.5 sm:p-2 rounded-lg bg-orange-100 text-orange-700 flex-shrink-0">
                  <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <h4 className="text-base sm:text-lg font-semibold text-orange-900">Education</h4>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <h5 className="text-sm sm:text-base font-semibold text-orange-900">Masters in Computer Application</h5>
                  <p className="text-xs sm:text-sm text-orange-700/70">SRM IST KTR, Chennai | 2024-2026</p>
                  <p className="text-xs sm:text-sm text-orange-600 font-medium">CGPA: 9.5</p>
                </div>
                <div>
                  <h5 className="text-sm sm:text-base font-semibold text-orange-900">Bachelor's Degree</h5>
                  <p className="text-xs sm:text-sm text-orange-700/70">Bundelkhand University, Jhansi | 2020-2023</p>
                  <p className="text-xs sm:text-sm text-orange-600 font-medium">CGPA: 8.0</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-orange-100/70 shadow-md p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="p-1.5 sm:p-2 rounded-lg bg-blue-100 text-blue-700 flex-shrink-0">
                  <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <h4 className="text-base sm:text-lg font-semibold text-orange-900">Experience</h4>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <h5 className="text-sm sm:text-base font-semibold text-orange-900">Software Developer</h5>
                  <p className="text-xs sm:text-sm text-orange-700/70">The Good Game Theory</p>
                  <p className="text-xs sm:text-sm text-orange-700/80 mt-2">
                    Developed backend services and RESTful APIs using Node.js and Express, powering Next.js and React apps 
                    for 800+ learners. Boosted weekly users by ~38% and improved user scores by 17%.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-orange-100/70 shadow-md p-4 sm:p-6 md:p-8 mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl font-bold text-orange-900 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
              <Rocket className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 flex-shrink-0" />
              <span>Technical Stack & Engineering Approach</span>
            </h3>
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h4 className="font-semibold text-orange-900 mb-2 sm:mb-3 text-base sm:text-lg">Core Technologies</h4>
                <div className="space-y-2 sm:space-y-3">
                  <div>
                    <p className="text-xs sm:text-sm text-orange-700/80 mb-2">
                      <strong className="text-orange-900">Next.js 15 + TypeScript:</strong> Leveraged App Router architecture with server components 
                      for optimal performance, implementing streaming SSR for faster initial page loads. Used TypeScript's strict mode to catch 
                      errors at compile-time, ensuring type safety across 400+ components and API routes.
                    </p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-orange-700/80 mb-2">
                      <strong className="text-orange-900">Node.js + MySQL:</strong> Engineered RESTful APIs with proper async/await patterns, 
                      connection pooling for database efficiency, and prepared statements to prevent SQL injection. Implemented query optimization 
                      with strategic indexing, reducing average query time from 500ms to under 100ms.
                    </p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-orange-700/80 mb-2">
                      <strong className="text-orange-900">Authentication & Security:</strong> Built custom JWT-based authentication system with 
                      secure token generation using Web Crypto API, implemented refresh token mechanisms, and created middleware for route protection. 
                      Designed RBAC system with permission inheritance and district-level data scoping.
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-orange-900 mb-2 sm:mb-3 text-base sm:text-lg">Advanced Features</h4>
                <div className="space-y-2 sm:space-y-3">
                  <div>
                    <p className="text-xs sm:text-sm text-orange-700/80 mb-2">
                      <strong className="text-orange-900">File Management:</strong> Implemented blob storage system with SHA-256 hashing for 
                      deduplication, staged uploads with TTL-based cleanup, and optimized image serving. Created upload validation with file type 
                      checking, size limits, and buffer-based processing.
                    </p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-orange-700/80 mb-2">
                      <strong className="text-orange-900">State Management:</strong> Used React Context API for global admin state, implemented 
                      optimistic UI updates, and created custom hooks for data fetching with caching strategies. Built form state management with 
                      React Hook Form and Zod validation for type-safe form handling.
                    </p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-orange-700/80 mb-2">
                      <strong className="text-orange-900">Performance Optimization:</strong> Implemented code splitting, lazy loading for images, 
                      and dynamic imports for heavy components. Used Next.js Image optimization with proper sizing and format conversion. Created 
                      pagination systems for large datasets to maintain fast load times.
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-orange-900 mb-2 sm:mb-3 text-base sm:text-lg">DevOps & Deployment</h4>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {['Docker', 'CI/CD', 'Git', 'MySQL', 'Nginx', 'VPS Deployment'].map((tool) => (
                    <span key={tool} className="px-2 sm:px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs sm:text-sm font-medium">
                      {tool}
                    </span>
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-orange-700/80 mt-2 sm:mt-3">
                  Containerized the entire application with Docker using multi-stage builds for optimized image sizes. Set up CI/CD pipelines 
                  for automated testing and deployment. Configured production environment with proper environment variables, database migrations, 
                  and monitoring systems.
                </p>
              </div>
            </div>
          </div>

          {/* Accomplishments */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-200/70 shadow-md p-4 sm:p-6 md:p-8 mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl font-bold text-orange-900 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
              <Award className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 flex-shrink-0" />
              <span>Key Accomplishments</span>
            </h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="bg-white/60 rounded-lg p-3 sm:p-4 border border-orange-100">
                <div className="flex items-start gap-2 sm:gap-3">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h5 className="text-sm sm:text-base font-semibold text-orange-900 mb-1">
                      3rd Place Winner - AARUUSH'25 Hackathon SRM
                    </h5>
                    <p className="text-xs sm:text-sm text-orange-700/80">
                      Won among 500+ participants for space innovation project "AstralWeb"
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white/60 rounded-lg p-3 sm:p-4 border border-orange-100">
                <div className="flex items-start gap-2 sm:gap-3">
                  <Award className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h5 className="text-sm sm:text-base font-semibold text-orange-900 mb-1">
                      Winner - SRM Hackathon (StellarVerse)
                    </h5>
                    <p className="text-xs sm:text-sm text-orange-700/80">
                      Built a full-stack space education platform among 500+ participants
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white/60 rounded-lg p-3 sm:p-4 border border-orange-100">
                <div className="flex items-start gap-2 sm:gap-3">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h5 className="text-sm sm:text-base font-semibold text-orange-900 mb-1">
                      O Level Certification - NIELIT Delhi
                    </h5>
                    <p className="text-xs sm:text-sm text-orange-700/80">
                      Led IoT projects and AngularJS applications
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>


          {/* Contact Section */}
          <div className="bg-gradient-to-br from-orange-100/50 to-amber-100/50 rounded-xl border border-orange-200/70 shadow-md p-4 sm:p-6 md:p-8 text-center">
            <h3 className="text-xl sm:text-2xl font-bold text-orange-900 mb-3 sm:mb-4">Let's Connect</h3>
            <p className="text-sm sm:text-base text-orange-700/80 mb-4 sm:mb-6 max-w-2xl mx-auto px-2">
              Interested in collaborating or have a project in mind? Feel free to reach out!
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 md:gap-6">
              <a
                href="mailto:anshul.yadv22@gmail.com"
                className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-white hover:bg-orange-50 text-orange-700 border border-orange-200 shadow-sm transition-all text-sm sm:text-base w-full sm:w-auto justify-center max-w-xs"
              >
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium truncate">anshul.yadv22@gmail.com</span>
              </a>
              <a
                href="tel:+916392992023"
                className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-white hover:bg-orange-50 text-orange-700 border border-orange-200 shadow-sm transition-all text-sm sm:text-base w-full sm:w-auto justify-center max-w-xs"
              >
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium">+91-6392992023</span>
              </a>
            </div>
          </div>

          {/* Back to Home */}
          <div className="text-center mt-6 sm:mt-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-orange-600 hover:bg-orange-700 text-white text-sm sm:text-base font-medium shadow-md hover:shadow-lg transition-all"
            >
              <span>←</span>
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

