import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navigation from '../components/Navigation';
import PreviewNavigation from '../components/PreviewNavigation';
import Footer from '../components/Footer';
import WelcomeSequence from '../components/WelcomeSequence';
import DemoBookingModal from '../components/DemoBookingModal';
import ContactModal from '../components/ContactModal';
import ImageLightbox from '../components/ImageLightbox';

// Screenshot Placeholder Component
const ScreenshotPlaceholder: React.FC<{
  alt: string;
  filename: string;
  className?: string;
  onClick: () => void;
}> = ({ alt, filename, className = '', onClick }) => {
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);

  return (
    <div
      className={`relative aspect-[16/9] rounded-xl overflow-hidden shadow-2xl cursor-pointer hover:shadow-sms-neonBlue/30 transition-all duration-300 hover:scale-105 ${className}`}
      onClick={onClick}
    >
      {/* Placeholder with gradient background */}
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-sms-darkBlue to-sms-deepBlue flex items-center justify-center border border-sms-electricBlue/30">
          <div className="text-center p-8">
            <div className="w-16 h-16 mx-auto mb-4 border-2 border-sms-neonBlue/50 rounded-lg flex items-center justify-center">
              <svg className="w-8 h-8 text-sms-neonBlue/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm text-sms-mediumGray mb-2">Screenshot: {filename}</p>
            <p className="text-xs text-sms-mediumGray/70">{alt}</p>
            <p className="text-xs text-sms-neonBlue/70 mt-2">Click to view fullscreen</p>
          </div>
        </div>
      )}

      {/* Actual image */}
      {!imageError && (
        <img
          src={`/screenshots/${filename}`}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover"
          onError={() => setImageError(true)}
          onLoad={() => setImageLoaded(true)}
        />
      )}
    </div>
  );
};

const HomePage: React.FC = () => {
  const location = useLocation();
  const isPreview = location.pathname === '/preview';

  // Check sessionStorage immediately on mount
  const [showWelcome, setShowWelcome] = useState(() => {
    const welcomeShown = sessionStorage.getItem('sms-welcome-shown');
    return !welcomeShown;
  });

  const [welcomeComplete, setWelcomeComplete] = useState(() => {
    const welcomeShown = sessionStorage.getItem('sms-welcome-shown');
    return !!welcomeShown;
  });

  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string } | null>(null);

  const handleWelcomeComplete = () => {
    sessionStorage.setItem('sms-welcome-shown', 'true');
    setShowWelcome(false);
    setWelcomeComplete(true);
  };

  // Landing page is always rendered - welcome overlays on top and fades away
  return (
    <>
      {/* Welcome overlay - fades out to reveal landing page underneath */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            key="welcome-overlay"
            className="fixed inset-0 z-50"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          >
            <WelcomeSequence onComplete={handleWelcomeComplete} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main landing page - always rendered underneath */}
      <div className="relative min-h-screen">
      {/* Navigation - only show after welcome completes */}
      {welcomeComplete && (
        isPreview ? (
          <PreviewNavigation onContactClick={() => setShowContactModal(true)} />
        ) : (
          <Navigation onContactClick={() => setShowContactModal(true)} />
        )
      )}

      {/* Main Content */}
      <main className="relative z-10">

        {/* SECTION 1: HERO */}
        <section className="min-h-screen flex items-center justify-center px-6 py-20 md:py-32">
          <div className="max-w-5xl mx-auto text-center">
            {/* Logo & Brand */}
            <div className="mb-16">
              <img
                src="/sms-logo.png"
                alt="SMS"
                className="h-28 w-28 md:h-36 md:w-36 mx-auto mb-6"
                style={{ filter: 'drop-shadow(0 0 40px rgba(0, 217, 255, 0.8))' }}
              />
              <p className="text-sms-lightGray text-xl md:text-2xl font-medium">
                The Future of Maintenance Today
              </p>
            </div>

            {/* Headline */}
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Equipment maintenance that works<br />the way <span className="text-sms-neonBlue">you do</span>.
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-sms-lightGray mb-10 max-w-3xl mx-auto leading-relaxed">
              Built by offshore operators who know the difference between a spreadsheet and a system
              that actually survives rotation handovers.
            </p>

            {/* CTA Button */}
            <div className="flex justify-center">
              <button
                onClick={() => setShowDemoModal(true)}
                className="px-10 py-5 bg-gradient-to-r from-sms-electricBlue to-sms-neonBlue text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-sms-neonBlue/50 transition-all duration-300 text-xl"
              >
                Book a Demo
              </button>
            </div>
          </div>
        </section>

        {/* SECTION 1.5: KEY BENEFITS */}
        <section className="py-24 px-6 bg-sms-darkBlue/30">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-12 text-center">
              Why Operations Teams Choose SMS
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                'Weeks to go live, not 12–18 months',
                'Structured equipment documentation with quality checks built in',
                'Real-time team communication across shifts and rotations',
                'Works offline when connectivity drops',
                'Adapts to your department structure and workflows',
                "Built by people who've actually worked offshore"
              ].map((point, idx) => (
                <div key={idx} className="flex items-start gap-3 bg-sms-darkBlue/50 p-6 rounded-lg border border-sms-electricBlue/20 hover:border-sms-neonBlue/40 transition-colors">
                  <svg className="w-6 h-6 text-sms-neonBlue flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-base text-sms-lightGray leading-relaxed">{point}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 2: PROBLEM → HOW SMS FIXES IT */}
        <section className="py-24 px-6 bg-sms-darkBlue/30">
          <div className="max-w-6xl mx-auto">

            {/* The Problem */}
            <div className="mb-20">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-12">The Problem</h2>

              <p className="text-lg text-sms-lightGray mb-8 leading-relaxed">
                Most companies managing equipment maintenance are stuck choosing between three bad options:
              </p>

              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    title: 'Enterprise CMMS',
                    desc: '12–18 month implementations. Consultants billing £150k+. Systems designed for factories, not vessels or remote sites. Your crew needs three days of training just to log a fault.'
                  },
                  {
                    title: 'Spreadsheets',
                    desc: 'Different versions floating around. No one knows which is current. Equipment photos stored... somewhere. Handover notes lost when the outgoing tech forgets to email them.'
                  },
                  {
                    title: 'Generic maintenance apps',
                    desc: 'Built by software companies who\'ve never worked a rotation. No concept of shift handovers. Can\'t handle poor connectivity. Assumes everyone has WiFi and a laptop.'
                  }
                ].map((problem, idx) => (
                  <div key={idx} className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-red-400 mb-3">{problem.title}</h3>
                    <p className="text-sm text-sms-lightGray/80 leading-relaxed">{problem.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* How SMS Fixes It */}
            <div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-12">How SMS Fixes It</h2>

              <p className="text-lg text-sms-lightGray mb-8 leading-relaxed">
                SMS was built by experienced engineers with 20+ years offshore, working rotations, dealing with handovers,
                and watching knowledge walk off with crew changes.
              </p>

              <div className="bg-sms-darkBlue/50 border border-sms-electricBlue/30 rounded-xl p-8 mb-8">
                <h3 className="text-xl font-bold text-sms-neonBlue mb-6">We know:</h3>
                <ul className="space-y-4">
                  {[
                    'Equipment documentation is hard work — so we made it structured, guided, and impossible to half-finish',
                    'Crews hate clunky systems — so we built something modern that people actually want to use',
                    'Connectivity offshore is terrible — so the system works offline and syncs when it can',
                    'Knowledge dies during handovers — so we capture it properly and make it accessible',
                    'Every operation is different — so SMS adapts to your department structure and workflows, not the other way around'
                  ].map((point, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-sms-neonBlue flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sms-lightGray">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-gradient-to-r from-sms-electricBlue/20 to-sms-neonBlue/20 border border-sms-neonBlue/30 rounded-xl p-8">
                <h3 className="text-2xl font-bold text-white mb-4">Result:</h3>
                <p className="text-lg text-sms-lightGray leading-relaxed">
                  Weeks to go live. Equipment folders that are actually complete. Real-time crew communication.
                  Handover workflows that don't rely on someone remembering to send an email.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: HOW IT WORKS (4 STEPS) */}
        <section id="how-it-works" className="py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-16 text-center">How It Works</h2>

            <div className="space-y-16">
              {/* Step 1 */}
              <div className="grid md:grid-cols-2 gap-12 items-start">
                <div>
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-sms-neonBlue/20 border border-sms-neonBlue rounded-lg mb-4">
                    <span className="text-2xl font-bold text-sms-neonBlue">1</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Activation & Setup Assistant (20 minutes)</h3>
                  <p className="text-sms-lightGray mb-4 leading-relaxed">
                    You receive an activation code. Enter it. The system walks you through a short questionnaire:
                  </p>
                  <ul className="space-y-2 text-sms-lightGray">
                    <li className="flex items-start gap-2">
                      <span className="text-sms-neonBlue">•</span>
                      <span>Company details and branding</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-sms-neonBlue">•</span>
                      <span>Choose your industry (maritime, construction, mining, energy, facilities, etc.)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-sms-neonBlue">•</span>
                      <span>Add your locations (vessels, sites, rigs, facilities)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-sms-neonBlue">•</span>
                      <span>Set up your department structure</span>
                    </li>
                  </ul>
                  <p className="text-sms-neonBlue font-semibold mt-4">Done. Your company structure is created.</p>
                </div>
                <div>
                  <ScreenshotPlaceholder
                    filename="setup-assistant.png"
                    alt="Industry selection during setup showing 9 industries: Maritime, Construction, Mining, Energy, Oil & Gas, Healthcare, Manufacturing, Logistics, Transport"
                    onClick={() => setLightboxImage({ src: '/screenshots/setup-assistant.png', alt: 'Industry selection during setup showing 9 industries: Maritime, Construction, Mining, Energy, Oil & Gas, Healthcare, Manufacturing, Logistics, Transport' })}
                  />
                </div>
              </div>

              {/* Step 2 */}
              <div className="grid md:grid-cols-2 gap-12 items-start">
                <div className="order-2 md:order-1">
                  <ScreenshotPlaceholder
                    filename="technician-dashboard.png"
                    alt="SMS Technician Dashboard showing equipment organised by vessel areas (Engine Room, Bridge, Deck Machinery) with completion percentages and quality scores"
                    onClick={() => setLightboxImage({ src: '/screenshots/technician-dashboard.png', alt: 'SMS Technician Dashboard showing equipment organised by vessel areas (Engine Room, Bridge, Deck Machinery) with completion percentages and quality scores' })}
                  />
                </div>
                <div className="order-1 md:order-2">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-sms-neonBlue/20 border border-sms-neonBlue rounded-lg mb-4">
                    <span className="text-2xl font-bold text-sms-neonBlue">2</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Distribute the Work (30 minutes)</h3>
                  <p className="text-sms-lightGray mb-4 leading-relaxed">
                    You're not doing this alone. The system lets you assign sections to your team:
                  </p>
                  <ul className="space-y-2 text-sms-lightGray">
                    <li className="flex items-start gap-2">
                      <span className="text-sms-neonBlue">•</span>
                      <span>Send email invitations to department leads or technicians</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-sms-neonBlue">•</span>
                      <span>Each person completes their assigned section (equipment lists, team structure, operational details)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-sms-neonBlue">•</span>
                      <span>Everyone works in parallel — no waiting for one person to finish</span>
                    </li>
                  </ul>
                  <p className="text-sms-lightGray mt-4 leading-relaxed">
                    Progress tracked in real-time. No spreadsheets bouncing around via email.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-sms-neonBlue/20 border border-sms-neonBlue rounded-lg mb-4">
                    <span className="text-2xl font-bold text-sms-neonBlue">3</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Equipment Documentation (1–2 weeks, parallel work)</h3>
                  <p className="text-sms-lightGray mb-4 leading-relaxed">
                    This is where most systems fail. SMS makes it structured and enforced.
                  </p>
                  <div className="bg-sms-darkBlue/50 border border-sms-electricBlue/30 rounded-lg p-6 mb-4">
                    <p className="text-sms-lightGray mb-3 font-semibold">Technicians document equipment by area:</p>
                    <ul className="space-y-2 text-sm text-sms-lightGray">
                      <li>• Equipment name, manufacturer, model, serial number</li>
                      <li>• Photos (minimum 2, supports 6 types)</li>
                      <li>• Spare parts needed</li>
                      <li>• Critical parts with explanations</li>
                      <li>• Technical documentation uploads</li>
                    </ul>
                  </div>
                  <div className="bg-gradient-to-r from-green-900/30 to-green-800/30 border border-green-500/30 rounded-lg p-6">
                    <p className="text-white font-semibold mb-2">Real-time quality scoring (0–100 points):</p>
                    <p className="text-sm text-sms-lightGray">
                      Green (80–100): Excellent • Yellow (60–79): Good • Red (0–59): Incomplete
                    </p>
                    <p className="text-sm text-sms-lightGray mt-3">
                      <strong>Result:</strong> 90%+ data completeness vs industry average of 40–60%.
                    </p>
                  </div>
                </div>
                <div>
                  <ScreenshotPlaceholder
                    filename="equipment-documentation-form.png"
                    alt="Real-time quality scoring (0-100 points) during equipment documentation with breakdown showing Basic Info 20/20, Photos 15/20, Spare Parts 18/20, Critical Parts 16/20, Documentation 20/20"
                    onClick={() => setLightboxImage({ src: '/screenshots/equipment-documentation-form.png', alt: 'Real-time quality scoring (0-100 points) during equipment documentation with breakdown showing Basic Info 20/20, Photos 15/20, Spare Parts 18/20, Critical Parts 16/20, Documentation 20/20' })}
                  />
                </div>
              </div>

              {/* Step 4 */}
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="order-2 md:order-1">
                  <ScreenshotPlaceholder
                    filename="manager-dashboard.png"
                    alt="Manager dashboard showing active faults (3 critical, 7 minor, 24 resolved), maintenance tasks (5 overdue, 12 due soon), and inventory alerts (8 low stock)"
                    onClick={() => setLightboxImage({ src: '/screenshots/manager-dashboard.png', alt: 'Manager dashboard showing active faults (3 critical, 7 minor, 24 resolved), maintenance tasks (5 overdue, 12 due soon), and inventory alerts (8 low stock)' })}
                  />
                </div>
                <div className="order-1 md:order-2">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-sms-neonBlue/20 border border-sms-neonBlue rounded-lg mb-4">
                    <span className="text-2xl font-bold text-sms-neonBlue">4</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Review & Go Live (2–3 days)</h3>
                  <p className="text-sms-lightGray mb-4 leading-relaxed">
                    Managers review submissions:
                  </p>
                  <ul className="space-y-2 text-sms-lightGray mb-6">
                    <li className="flex items-start gap-2">
                      <span className="text-sms-neonBlue">•</span>
                      <span>Quality score breakdown per equipment</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-sms-neonBlue">•</span>
                      <span>Photo galleries</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-sms-neonBlue">•</span>
                      <span>Spare parts lists</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-sms-neonBlue">•</span>
                      <span>Critical parts explanations</span>
                    </li>
                  </ul>
                  <p className="text-sms-lightGray mb-6 leading-relaxed">
                    Approve or request changes. When approved, system goes live.
                  </p>
                  <div className="bg-sms-neonBlue/10 border border-sms-neonBlue/30 rounded-lg p-6">
                    <p className="text-white font-semibold mb-2">Total timeline: 2–4 weeks from activation to operational.</p>
                    <p className="text-sm text-sms-mediumGray">Compare to: 12–18 months for enterprise CMMS implementations.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: MULTI-DEPARTMENT + CUSTOMISATION */}
        <section id="customization" className="py-24 px-6 bg-gradient-to-br from-sms-darkBlue/50 to-sms-deepBlue">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                Built to Match Your Operation —<br />Not the Other Way Around
              </h2>
              <p className="text-xl text-sms-lightGray max-w-3xl mx-auto leading-relaxed">
                SMS isn't a rigid SaaS product. It's a framework that adapts to how you actually work.
              </p>
            </div>

            {/* Department Tags */}
            <div className="flex flex-wrap justify-center gap-3 mb-16">
              {[
                'Electrical', 'Mechanical', 'Hydraulic', 'Marine / Deck',
                'HSE', 'Stores / Procurement', 'Engineering', '+ Add More'
              ].map((dept, idx) => (
                <span
                  key={idx}
                  className="px-4 py-2 bg-sms-electricBlue/20 border border-sms-electricBlue/40 rounded-full text-sm text-sms-lightGray font-medium"
                >
                  {dept}
                </span>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              {/* Multi-department support */}
              <div className="bg-sms-darkBlue/50 border border-sms-electricBlue/30 rounded-xl p-8">
                <h3 className="text-xl font-bold text-white mb-4">Multi-department support out of the box</h3>
                <p className="text-sms-lightGray mb-4 leading-relaxed">
                  Every department gets its own workflows, dashboards, and equipment folders. Your Electrical team
                  doesn't see Mechanical clutter, and vice versa.
                </p>
                <ul className="space-y-3 text-sms-lightGray">
                  <li className="flex items-start gap-2">
                    <span className="text-sms-neonBlue">•</span>
                    <span><strong>Separate equipment inventories</strong> per department</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-sms-neonBlue">•</span>
                    <span><strong>Department-specific workflows</strong> and approval processes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-sms-neonBlue">•</span>
                    <span><strong>Individual dashboards</strong> showing only relevant data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-sms-neonBlue">•</span>
                    <span><strong>Cross-department visibility</strong> for managers when needed</span>
                  </li>
                </ul>
              </div>

              {/* Custom everything */}
              <div className="bg-sms-darkBlue/50 border border-sms-electricBlue/30 rounded-xl p-8">
                <h3 className="text-xl font-bold text-white mb-4">Custom everything</h3>
                <ul className="space-y-3 text-sms-lightGray">
                  <li className="flex items-start gap-2">
                    <span className="text-sms-neonBlue">•</span>
                    <span><strong>Custom equipment categories:</strong> Define your own equipment types and hierarchies</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-sms-neonBlue">•</span>
                    <span><strong>Custom checklists and forms:</strong> Build inspection routines that match your standards</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-sms-neonBlue">•</span>
                    <span><strong>Custom workflows:</strong> Set up approval processes and handover protocols</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-sms-neonBlue">•</span>
                    <span><strong>Industry-specific terminology:</strong> Vessels, rigs, sites, facilities — SMS speaks your language</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* How it works */}
            <div className="bg-gradient-to-r from-sms-electricBlue/20 to-sms-neonBlue/20 border border-sms-neonBlue/30 rounded-xl p-8 mb-8">
              <h3 className="text-xl font-bold text-white mb-4">How it works:</h3>
              <p className="text-sms-lightGray leading-relaxed">
                We work with your team during onboarding to configure the system to your exact operational reality.
                Nothing feels bolted-on or generic. The system matches your department structure, your equipment
                naming conventions, your maintenance routines.
              </p>
            </div>

            {/* Example */}
            <div className="bg-sms-darkBlue/70 border-l-4 border-sms-neonBlue rounded-lg p-6">
              <p className="text-sm text-sms-mediumGray mb-2">Example:</p>
              <p className="text-sms-lightGray leading-relaxed">
                A drilling rig might have 8 departments (Drilling, Mud, Power Generation, Marine, Cranes, Hydraulics, HSE, Stores),
                each with 50+ equipment items, custom inspection checklists per equipment type, and handover workflows that match
                28-day rotations.
              </p>
              <p className="text-sms-neonBlue font-semibold mt-4">
                SMS handles it. Because it was built by people who know that no two operations are identical.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 5: CORE USPs */}
        <section id="why-sms" className="py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-16 text-center">What Makes SMS Different</h2>

            <div className="space-y-16">
              {/* USP 1: Quality Scoring */}
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="inline-block px-4 py-1 bg-sms-neonBlue/20 border border-sms-neonBlue rounded-full text-sm text-sms-neonBlue font-semibold mb-4">
                    Unique to SMS
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">Quality Scoring System</h3>

                  <div className="mb-6">
                    <p className="text-lg text-red-400 font-semibold mb-2">The problem:</p>
                    <p className="text-sms-lightGray leading-relaxed">
                      Most equipment documentation is 40–60% complete. Missing photos, no spare parts lists, vague descriptions.
                      You discover this months later when you actually need the data.
                    </p>
                  </div>

                  <div className="mb-6">
                    <p className="text-lg text-sms-neonBlue font-semibold mb-2">SMS solution:</p>
                    <p className="text-sms-lightGray leading-relaxed">
                      Real-time quality scoring (0–100 points) during documentation. Score updates as you type.
                    </p>
                  </div>

                  <div className="bg-sms-darkBlue/50 border border-sms-electricBlue/30 rounded-lg p-6 mb-6">
                    <p className="text-white font-semibold mb-3">Five scoring categories:</p>
                    <ul className="space-y-2 text-sm text-sms-lightGray">
                      <li>• Basic info (20 pts)</li>
                      <li>• Photos (20 pts)</li>
                      <li>• Spare parts documentation (20 pts)</li>
                      <li>• Critical parts explanations (20 pts)</li>
                      <li>• Technical documentation uploads (20 pts)</li>
                    </ul>
                  </div>

                  <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4">
                    <p className="text-white font-semibold">Result: 90%+ completeness guaranteed. No half-finished equipment folders.</p>
                  </div>
                </div>
                <div>
                  <div className="bg-sms-darkBlue/50 border border-sms-electricBlue/30 rounded-xl p-8">
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-green-500/20 to-green-600/20 border-4 border-green-500/50 mb-4">
                        <span className="text-5xl font-bold text-green-400">89</span>
                      </div>
                      <p className="text-xl font-bold text-green-400">Excellent Quality</p>
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: 'Basic Info', score: 20, max: 20 },
                        { label: 'Photos', score: 15, max: 20 },
                        { label: 'Spare Parts', score: 18, max: 20 },
                        { label: 'Critical Parts', score: 16, max: 20 },
                        { label: 'Documentation', score: 20, max: 20 }
                      ].map((item, idx) => (
                        <div key={idx}>
                          <div className="flex justify-between text-sm text-sms-lightGray mb-1">
                            <span>{item.label}</span>
                            <span>{item.score}/{item.max}</span>
                          </div>
                          <div className="h-2 bg-sms-deepBlue rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-sms-electricBlue to-sms-neonBlue"
                              style={{ width: `${(item.score / item.max) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* USP 2: Two-Pass Workflow */}
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="order-2 md:order-1">
                  <div className="bg-sms-darkBlue/50 border border-sms-electricBlue/30 rounded-xl p-8">
                    <div className="mb-8">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-sms-neonBlue/20 border border-sms-neonBlue flex items-center justify-center">
                          <span className="text-sm font-bold text-sms-neonBlue">1</span>
                        </div>
                        <h4 className="text-lg font-bold text-white">Pass 1: Technicians</h4>
                      </div>
                      <p className="text-sms-lightGray text-sm leading-relaxed mb-3">
                        What spare parts are <em>needed</em> for this equipment?
                      </p>
                      <div className="bg-sms-deepBlue/50 rounded-lg p-4">
                        <p className="text-sm text-sms-lightGray italic">
                          "Generator requires 5x fuel filters, 2x oil filters, 1x starter motor"
                        </p>
                      </div>
                      <p className="text-xs text-sms-mediumGray mt-2">This captures knowledge, not inventory counts.</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-sms-neonBlue/20 border border-sms-neonBlue flex items-center justify-center">
                          <span className="text-sm font-bold text-sms-neonBlue">2</span>
                        </div>
                        <h4 className="text-lg font-bold text-white">Pass 2: Store Personnel</h4>
                      </div>
                      <p className="text-sms-lightGray text-sm leading-relaxed mb-3">
                        How many do we actually have?
                      </p>
                      <p className="text-sm text-sms-lightGray">
                        Store team counts physical stock and matches against needs list. Identifies gaps automatically.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="order-1 md:order-2">
                  <div className="inline-block px-4 py-1 bg-yellow-500/20 border border-yellow-500 rounded-full text-sm text-yellow-400 font-semibold mb-4">
                    Revolutionary
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">Two-Pass Documentation Workflow</h3>

                  <div className="mb-6">
                    <p className="text-lg text-red-400 font-semibold mb-2">Traditional systems ask technicians:</p>
                    <p className="text-sms-lightGray leading-relaxed">
                      "How many fuel filters do we have in stock?"
                    </p>
                    <p className="text-sm text-sms-mediumGray mt-2">
                      Problem: Technicians are equipment experts, not inventory experts. Results in guessing and errors.
                    </p>
                  </div>

                  <div className="mb-6">
                    <p className="text-lg text-sms-neonBlue font-semibold mb-2">SMS approach:</p>
                    <p className="text-sms-lightGray leading-relaxed">
                      Separate what's <em>needed</em> (technician knowledge) from what's <em>available</em> (store counts).
                    </p>
                  </div>

                  <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4">
                    <p className="text-white font-semibold mb-2">Result:</p>
                    <ul className="space-y-1 text-sm text-sms-lightGray">
                      <li>• 40–60% reduction in documentation errors</li>
                      <li>• Faster completion (experts do what they know)</li>
                      <li>• Better data quality</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* USP 3: Real-Time Collaboration */}
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">Real-Time Crew Collaboration</h3>

                  <div className="mb-6">
                    <p className="text-lg text-red-400 font-semibold mb-2">The problem:</p>
                    <p className="text-sms-lightGray leading-relaxed">
                      Offshore crews work 24/7 rotations. Knowledge needs to flow across shifts. Email doesn't cut it.
                    </p>
                  </div>

                  <div className="mb-6">
                    <p className="text-lg text-sms-neonBlue font-semibold mb-3">SMS includes:</p>
                    <ul className="space-y-2 text-sms-lightGray">
                      <li className="flex items-start gap-2">
                        <span className="text-sms-neonBlue">•</span>
                        <span>Built-in team chat (department channels, direct messaging)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-sms-neonBlue">•</span>
                        <span>Typing indicators and online status</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-sms-neonBlue">•</span>
                        <span>File sharing in conversations</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-sms-neonBlue">•</span>
                        <span>Works across rotations and shifts</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-sms-neonBlue">•</span>
                        <span>Messages sync when connectivity returns</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-sms-darkBlue/50 border border-sms-electricBlue/30 rounded-lg p-6">
                    <p className="text-white font-semibold mb-3">Use cases:</p>
                    <ul className="space-y-2 text-sm text-sms-lightGray">
                      <li>• Night shift reports an issue → day shift sees it immediately</li>
                      <li>• Technician requests parts → manager approves in real-time</li>
                      <li>• HSE posts safety update → crew acknowledges receipt</li>
                      <li>• Outgoing tech briefs incoming tech via chat (no more forgotten handover notes)</li>
                    </ul>
                  </div>
                </div>
                <div>
                  <div className="bg-sms-darkBlue/50 border border-sms-electricBlue/30 rounded-xl p-6">
                    {/* Chat mockup */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-sms-electricBlue/30">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-white font-semibold">#electrical-team</span>
                        </div>
                        <span className="text-xs text-sms-mediumGray">3 online</span>
                      </div>

                      <div className="space-y-3">
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-sms-electricBlue/30 flex-shrink-0"></div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-white">John</span>
                              <span className="text-xs text-sms-mediumGray">10:42</span>
                            </div>
                            <div className="bg-sms-deepBlue rounded-lg p-3">
                              <p className="text-sm text-sms-lightGray">Generator 2 making unusual noise. Checking now.</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-sms-neonBlue/30 flex-shrink-0"></div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-white">Sarah</span>
                              <span className="text-xs text-sms-mediumGray">10:43</span>
                            </div>
                            <div className="bg-sms-deepBlue rounded-lg p-3">
                              <p className="text-sm text-sms-lightGray">Could be the coupling. Check alignment first.</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-sms-mediumGray">
                          <div className="w-1.5 h-1.5 bg-sms-neonBlue rounded-full animate-pulse"></div>
                          <span>Mike is typing...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* USP 4: Offline-First */}
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="order-2 md:order-1">
                  <div className="bg-sms-darkBlue/50 border border-sms-electricBlue/30 rounded-xl p-8">
                    <div className="mb-6">
                      <h4 className="text-lg font-bold text-white mb-4">Works offline:</h4>
                      <ul className="space-y-2 text-sm text-sms-lightGray">
                        <li className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>View all equipment records (cached locally)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>Read maintenance history</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>Access stored handover notes</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>Review fault reports</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>Continue shift countdown timers</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>Read team chat history (cached)</span>
                        </li>
                      </ul>
                    </div>

                    <div className="border-t border-sms-electricBlue/30 pt-6">
                      <h4 className="text-lg font-bold text-white mb-3">When connectivity returns:</h4>
                      <p className="text-sm text-sms-lightGray">
                        Data syncs automatically. New messages appear. Notifications update.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="order-1 md:order-2">
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">Offline-First Architecture</h3>

                  <div className="mb-6">
                    <p className="text-lg text-red-400 font-semibold mb-2">The reality:</p>
                    <p className="text-sms-lightGray leading-relaxed">
                      Offshore connectivity is terrible. Satellite links drop. Weather kills 4G. Construction sites have no WiFi.
                      Remote mining operations run on intermittent connections.
                    </p>
                  </div>

                  <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-lg p-6 mb-6">
                    <div className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <p className="text-white font-semibold mb-2">Can't wait for internet to do maintenance</p>
                        <p className="text-sm text-sms-lightGray">
                          SMS was designed by someone who's worked offshore for 20+ years and knows connectivity can't be relied on.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 6: TRUST SECTION */}
        <section className="py-24 px-6 bg-sms-darkBlue/30">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
              {/* Built by operators */}
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Built by People Who've Done the Work</h2>
                <p className="text-lg text-sms-lightGray mb-8 leading-relaxed">
                  <strong className="text-white">20+ years offshore experience</strong> embedded in every workflow:
                </p>

                <ul className="space-y-4 mb-8">
                  {[
                    'Rotation management with countdown timers',
                    'Shift handover workflows (not "hope they remember to email notes")',
                    'Equipment documentation that survives crew changes',
                    'Offline capability (because connectivity fails)',
                    'Multi-department structure (because operations are complex)',
                    'Real-time chat (because email is too slow for 24/7 ops)'
                  ].map((point, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-sms-neonBlue flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sms-lightGray">{point}</span>
                    </li>
                  ))}
                </ul>

                <div className="bg-gradient-to-r from-sms-electricBlue/20 to-sms-neonBlue/20 border border-sms-neonBlue/30 rounded-lg p-6">
                  <p className="text-white font-semibold">
                    Not designed by a software company. Designed by operators who lived the problems and built the solutions.
                  </p>
                </div>
              </div>

              {/* Government backing */}
              <div>
                <div className="bg-sms-darkBlue/50 border-2 border-sms-electricBlue/30 rounded-xl p-8 relative">
                  {/* Innovate UK Logo - Top Right */}
                  <div className="absolute top-6 right-6">
                    <img
                      src="/innovate-uk-logo.png"
                      alt="Innovate UK"
                      className="h-12 opacity-90"
                    />
                  </div>

                  <div className="flex items-center gap-4 mb-6 pr-24">
                    <div className="w-16 h-16 bg-sms-neonBlue/20 rounded-lg flex items-center justify-center">
                      <svg className="w-10 h-10 text-sms-neonBlue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Backed by UK Government</h3>
                      <p className="text-sm text-sms-mediumGray">Innovation Funding</p>
                    </div>
                  </div>

                  <p className="text-sms-lightGray mb-6 leading-relaxed">
                    SMS is a recipient of <strong className="text-white">Innovate UK grant funding</strong> — the UK government's
                    innovation agency that backs technologies solving real industry challenges.
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-sms-neonBlue flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm text-sms-lightGray">Independent validation of the technology and market need</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-sms-neonBlue flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm text-sms-lightGray">Rigorous application process (competitive funding)</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-sms-neonBlue flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm text-sms-lightGray">Government confidence in the solution</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 7: CTA */}
        <section id="contact" className="py-16 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Ready to See How It Works?</h2>
            <p className="text-lg text-sms-lightGray mb-12 max-w-2xl mx-auto">
              Book a demo with someone who's actually worked offshore.
            </p>

            {/* Book a Demo */}
            <div className="max-w-md mx-auto">
              <div className="bg-sms-darkBlue/50 border border-sms-electricBlue/30 rounded-xl p-8 text-center">
                <div className="w-12 h-12 bg-sms-neonBlue/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <svg className="w-6 h-6 text-sms-neonBlue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Book a Demo</h3>
                <p className="text-sm text-sms-lightGray mb-6 leading-relaxed">
                  30-minute walkthrough with someone who knows offshore operations. We'll show you the system,
                  answer questions, and discuss your specific setup.
                </p>
                <button
                  onClick={() => setShowDemoModal(true)}
                  className="w-full px-6 py-3 bg-gradient-to-r from-sms-electricBlue to-sms-neonBlue text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-sms-neonBlue/50 transition-all duration-300"
                >
                  Book a Demo
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />

      {/* Demo Booking Modal */}
      <DemoBookingModal isOpen={showDemoModal} onClose={() => setShowDemoModal(false)} />

      {/* Contact Modal */}
      <ContactModal isOpen={showContactModal} onClose={() => setShowContactModal(false)} />

      {/* Image Lightbox */}
      {lightboxImage && (
        <ImageLightbox
          isOpen={!!lightboxImage}
          onClose={() => setLightboxImage(null)}
          imageSrc={lightboxImage.src}
          imageAlt={lightboxImage.alt}
        />
      )}
      </div>
    </>
  );
};

export default HomePage;
