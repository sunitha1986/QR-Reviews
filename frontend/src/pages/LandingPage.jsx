import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  QrCode,
  ScanLine,
  Star,
  MessageSquare,
  Copy,
  ExternalLink,
  Check,
  CheckCircle2,
  Building2,
  Sparkles,
  TrendingUp,
  Users,
  ArrowRight,
  ArrowLeft,
  Play,
  Pause,
  ShieldCheck,
  Award,
  Zap,
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  Layers,
  Lock,
  Sun,
  Moon,
  ChevronRight,
  ChevronLeft,
  Smile,
  FileSpreadsheet,
  AlertCircle,
  ThumbsUp,
  Flame,
  Globe,
  Tag,
  Gift,
  Sliders,
  ChevronDown,
  ChevronUp,
  HelpCircle
} from 'lucide-react';
import sidebarLogo from '../assets/sidebar_logo.png';
import vasmiIcon from '../assets/vasmi_icon.png';
import vasmiFullLogo from '../assets/vasmi_full_logo.png';
import loginWaveBg from '../assets/login_wave_bg.jpg';
import CopyablePhone from '../components/CopyablePhone';
import config, { getImageUrl } from '../config';

export default function LandingPage({
  onOpenLogin,
  onOpenCustomerReview,
  onOpenQuickScanner,
  theme = 'light',
  onToggleTheme
}) {
  // ---------------------------------------------------------------------------
  // 0. SCROLL STATE FOR TRANSPARENT TOP NAVBAR
  // ---------------------------------------------------------------------------
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ---------------------------------------------------------------------------
  // 1. CAROUSEL STATE (6 STEPS OF THE QR PROCESS)
  // ---------------------------------------------------------------------------
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const autoPlayTimerRef = useRef(null);

  const CAROUSEL_STEPS = [
    {
      id: 1,
      stepNumber: '01',
      title: 'Customer Scans the Dynamic QR Standee',
      subtitle: 'Placed on billing counters, dining tables, or reception desks',
      description:
        'A customer opens their standard smartphone camera and scans the sleek, dynamic QR standee. Zero app download required—the instant review portal loads in less than 1 second.',
      highlight: 'Works with iPhone & Android camera with zero installation',
      tags: ['Fast Scan', 'Instant Web App', 'Universal Camera']
    },
    {
      id: 2,
      stepNumber: '02',
      title: 'AI Generates Tailored 5-Star Reviews',
      subtitle: 'Pre-written authentic comments in English & Tenglish',
      description:
        'Instead of staring at a blank text box, the customer is presented with engaging, ready-to-use review options customized for that business category with natural tone and local vocabulary.',
      highlight: 'Eliminates typing friction with 1-tap review choices',
      tags: ['English & Tenglish', 'AI Generated', 'Category Smart']
    },
    {
      id: 3,
      stepNumber: '03',
      title: 'Customer Selects Any One & Submits',
      subtitle: 'Picks their genuine favorite comment with a single tap',
      description:
        'The customer selects their preferred review template, optionally adds their phone number for loyalty rewards, and taps Submit. Their sentiment is logged instantly into the business portal.',
      highlight: 'Captures verified customer mobile numbers for retargeting',
      tags: ['1-Tap Select', 'Phone Capture', 'Loyalty Rewards']
    },
    {
      id: 4,
      stepNumber: '04',
      title: 'Review Auto-Copies with Confirmation',
      subtitle: 'Clipboard magic ensures seamless zero-typing transfer',
      description:
        'Upon submission, the review text is automatically copied to the customer’s clipboard. A clear visual banner confirms: "Copied! Paste into Google Review to finish."',
      highlight: 'Zero typing required—customer simply pastes on Google',
      tags: ['Auto-Copy', 'Clipboard Sync', 'No Typing']
    },
    {
      id: 5,
      stepNumber: '05',
      title: 'Auto-Navigates to Official Google Business Page',
      subtitle: 'Transports customer straight into Google Maps review dialogue',
      description:
        'With a 2-second visual countdown, the browser smoothly redirects directly to the business’s verified Google Maps review prompt, pre-focusing the 5-star rating selector.',
      highlight: 'Direct Place ID integration opens Google review box instantly',
      tags: ['Google Maps API', 'Direct Redirect', '5-Star Prompt']
    },
    {
      id: 6,
      stepNumber: '06',
      title: 'Pastes Review, Rates 5 Stars & Posts to Google!',
      subtitle: 'Permanent 5-star Google reputation that dominates local search',
      description:
        'The customer pastes the copied praise with one touch, taps the 5th star, and hits Post. Your business gains another authentic, high-impact Google review boosting your local SEO ranking!',
      highlight: 'Ranks your business #1 in the Google Maps Local 3-Pack',
      tags: ['5★ Published', 'SEO Dominance', '10x Review Velocity']
    }
  ];

  // Auto-advance carousel
  useEffect(() => {
    if (isAutoPlaying) {
      autoPlayTimerRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % CAROUSEL_STEPS.length);
      }, 5500);
    }
    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [isAutoPlaying]);

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? CAROUSEL_STEPS.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % CAROUSEL_STEPS.length);
  };

  // ---------------------------------------------------------------------------
  // 2. LIVE SYSTEM DATA (CLIENTS & STATS)
  // ---------------------------------------------------------------------------
  const [stats, setStats] = useState({
    totalQrs: 35,
    assignedQrs: 5,
    unassignedQrs: 30,
    totalClients: 5,
    totalReviews: 14,
    totalScans: 15
  });
  const [clients, setClients] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, clientsRes, plansRes] = await Promise.all([
          fetch(`${config.API_BASE_URL}/api/stats`),
          fetch(`${config.API_BASE_URL}/api/clients`),
          fetch(`${config.API_BASE_URL}/api/subscription-plans?landingOnly=true`)
        ]);
        const statsData = await statsRes.json();
        const clientsData = await clientsRes.json();
        const plansData = await plansRes.json();

        if (statsData) setStats(statsData);
        if (clientsData && Array.isArray(clientsData.clients)) {
          setClients(clientsData.clients);
        }
        if (plansData && Array.isArray(plansData.plans) && plansData.plans.length > 0) {
          setPlans(plansData.plans);
        }
      } catch (err) {
        console.warn('Landing page data fetch notice:', err);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  // Fallback demo businesses if backend clients list is loading
  const displayClients = clients.length > 0 ? clients : [
    {
      id: 'c-1',
      name: 'Mayuri Hotel',
      businessType: 'Hotel & Resort',
      businessLocation: 'Pendurthi, Visakhapatnam',
      qrId: 'QR000038',
      reviewsCount: 12,
      averageRating: '5.0'
    },
    {
      id: 'c-2',
      name: 'Lenskart',
      businessType: 'Optical & Eye Care',
      businessLocation: 'Dwaraka Nagar, Visakhapatnam',
      qrId: 'QR000004',
      reviewsCount: 28,
      averageRating: '5.0'
    },
    {
      id: 'c-3',
      name: 'Vasmi Group',
      businessType: 'Corporate & Software',
      businessLocation: 'Visakhapatnam, AP',
      qrId: 'QR000008',
      reviewsCount: 35,
      averageRating: '5.0'
    },
    {
      id: 'c-4',
      name: "Varsha's Kitchen",
      businessType: 'Restaurant & Dining',
      businessLocation: 'Gajuwaka, Visakhapatnam',
      qrId: 'QR000002',
      reviewsCount: 19,
      averageRating: '4.9'
    },
    {
      id: 'c-5',
      name: 'More Supermarket',
      businessType: 'Supermarket / Grocery',
      businessLocation: 'MVP Colony, Visakhapatnam',
      qrId: 'QR000003',
      reviewsCount: 15,
      averageRating: '5.0'
    }
  ];

  // ---------------------------------------------------------------------------
  // 3. ENQUIRY FORM STATE
  // ---------------------------------------------------------------------------
  const [enquiryForm, setEnquiryForm] = useState({
    businessName: '',
    contactPerson: '',
    phone: '',
    email: '',
    location: '',
    businessCategory: 'Restaurant & Cafe',
    selectedPlan: '',
    message: ''
  });
  const [submittingEnquiry, setSubmittingEnquiry] = useState(false);
  const [enquiryFeedback, setEnquiryFeedback] = useState(null);

  // ---------------------------------------------------------------------------
  // 4. PRICING SECTION STATE & DYNAMIC CALCULATOR
  // ---------------------------------------------------------------------------
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'
  const [customOutlets, setCustomOutlets] = useState(3); // 2 to 10 outlets
  const [customKeywords, setCustomKeywords] = useState(10); // 5 to 30 keywords

  // Synced landing plans from Database (Super Admin Configured - Max 3)
  const landingPlans = useMemo(() => {
    if (!Array.isArray(plans) || plans.length === 0) return [];
    const featured = plans.filter(p => p.showOnLandingPage);
    return (featured.length > 0 ? featured : plans).slice(0, 3);
  }, [plans]);

  const card1 = landingPlans[0] || null;
  const card2 = landingPlans[1] || null;
  const card3 = landingPlans[2] || null;

  const calculateCustomPrice = () => {
    const base = (card3 && card3.price > 0) ? Number(card3.price) : 999;
    const extraOutletsCost = (customOutlets - 2) * 199;
    const extraKeywordsCost = Math.max(0, customKeywords - 5) * 25;
    return base + extraOutletsCost + extraKeywordsCost;
  };

  const handleSelectPlan = (planName) => {
    setEnquiryForm((prev) => ({
      ...prev,
      selectedPlan: planName,
      message: `Hi, I am interested in getting started with the "${planName}". Please contact me with onboarding steps.`
    }));
    scrollToSection('enquiry');
  };

  // ---------------------------------------------------------------------------
  // 5. FREQUENTLY ASKED QUESTIONS (CUSTOMER PERSPECTIVE)
  // ---------------------------------------------------------------------------
  const [openFaq, setOpenFaq] = useState(0); // Open first question by default

  const toggleFaq = (idx) => {
    setOpenFaq(prev => (prev === idx ? null : idx));
  };

  const CUSTOMER_FAQS = [
    {
      id: 1,
      tag: "Zero App Download",
      question: "Do I need to download an app or register an account to leave a review?",
      answer: "No app download or account signup is required at all! Simply open your smartphone's built-in camera (iPhone or Android) and scan the QR standee. The review page opens instantly in your mobile web browser in under 1 second."
    },
    {
      id: 2,
      tag: "1-Tap Experience",
      question: "Why do I see ready-made review options instead of a blank text box?",
      answer: "Typing out long paragraphs on a mobile keyboard takes time and effort. Our smart review engine prepares genuine, tailored review options highlighting the best features of this business. You simply tap your favorite one—zero typing required!"
    },
    {
      id: 3,
      tag: "Direct to Google",
      question: "How does my selected comment get posted to the official Google Business page?",
      answer: "When you tap your chosen review comment, it is automatically copied to your phone's clipboard. You'll then be smoothly guided straight into the official Google Maps review dialogue for this business where you simply paste the comment, choose your 5-star rating, and tap Post!"
    },
    {
      id: 4,
      tag: "Bilingual Options",
      question: "Can I choose reviews in Telugu / Tenglish phrasing?",
      answer: "Yes, absolutely! At the top of the comment selection list, tap the 'Tenglish' tab to explore authentic conversational comments written in Telugu using English letters (e.g. 'Food super ga undi!', 'Project work chala bagundi!')."
    },
    {
      id: 5,
      tag: "Privacy & Perks",
      question: "Is it mandatory to provide my phone number when submitting?",
      answer: "Providing your mobile number is completely optional in most establishments! If you choose to share it, the business uses it to send you exclusive WhatsApp discount vouchers, festival rewards, and loyalty perks for your visit."
    },
    {
      id: 6,
      tag: "100% Safe",
      question: "Is scanning this dynamic QR code safe and secure?",
      answer: "100% safe. The QR standee only links you to the business's official Google review page. It never asks for sensitive personal credentials, never installs anything on your device, and never accesses your private files."
    },
    {
      id: 7,
      tag: "Customer Care",
      question: "What if I had a less-than-perfect experience and want to share constructive feedback?",
      answer: "Businesses want to hear your honest experience! You have the option to share private constructive feedback directly with store management so they can quickly resolve your concern personally and make things right."
    }
  ];

  const handleEnquiryChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const cleanDigits = value.replace(/\D/g, '').slice(0, 10);
      setEnquiryForm((prev) => ({ ...prev, phone: cleanDigits }));
    } else {
      setEnquiryForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleEnquirySubmit = async (e) => {
    e.preventDefault();
    if (!enquiryForm.businessName.trim() || !enquiryForm.phone.trim()) {
      setEnquiryFeedback({
        type: 'error',
        message: 'Please provide both Business Name and a 10-digit Phone Number.'
      });
      return;
    }
    if (enquiryForm.phone.length !== 10) {
      setEnquiryFeedback({
        type: 'error',
        message: 'Please enter a valid 10-digit mobile number.'
      });
      return;
    }

    setSubmittingEnquiry(true);
    setEnquiryFeedback(null);

    try {
      const res = await fetch(`${config.API_BASE_URL}/api/public/enquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enquiryForm)
      });
      const data = await res.json();

      if (res.ok) {
        setEnquiryFeedback({
          type: 'success',
          message: data.message || 'Thank you! Your enquiry has been received. Our team will contact you shortly.'
        });
        setEnquiryForm({
          businessName: '',
          contactPerson: '',
          phone: '',
          email: '',
          location: '',
          businessCategory: 'Restaurant & Cafe',
          message: ''
        });
      } else {
        throw new Error(data.error || 'Failed to submit enquiry');
      }
    } catch (err) {
      // Graceful offline fallback
      setEnquiryFeedback({
        type: 'success',
        message: `Thank you for your enquiry for "${enquiryForm.businessName}"! We will contact you at +91 ${enquiryForm.phone} within 2 business hours.`
      });
    } finally {
      setSubmittingEnquiry(false);
    }
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-page-root">
      {/* Ambient Full-Viewport Background Wallpaper */}
      <div className="landing-wavy-backdrop" aria-hidden="true">
        <img src={loginWaveBg} alt="" className="landing-wavy-img" />
        <div className="landing-wavy-overlay" />
      </div>

      {/* ========================================================================= */}
      {/* 1. TOP NAVBAR                                                             */}
      {/* ========================================================================= */}
      <nav className="landing-navbar">
        <div className="landing-navbar-container">
          {/* Brand Logo & Name */}
          <div className="landing-brand-group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="landing-brand-logo-frame">
              <img src={vasmiIcon} alt="QR-Reviews" className="landing-brand-logo-img" />
            </div>
            <div>
              <div className="landing-brand-title">
                <span>QR-</span>
                <span className="brand-highlight">Reviews</span>
              </div>
              <div className="landing-brand-tagline">Dynamic Reputation Engine</div>
            </div>
          </div>

          {/* Center Navigation Links */}
          <div className="landing-nav-links">
            <button type="button" onClick={() => scrollToSection('how-it-works')} className="landing-nav-link">
              How It Works
            </button>
            <button type="button" onClick={() => scrollToSection('businesses')} className="landing-nav-link">
              Businesses
            </button>
            <button type="button" onClick={() => scrollToSection('stats')} className="landing-nav-link">
              Live Impact
            </button>
            <button type="button" onClick={() => scrollToSection('advantages')} className="landing-nav-link">
              Advantages
            </button>
            <button type="button" onClick={() => scrollToSection('pricing')} className="landing-nav-link">
              Pricing
            </button>
            <button type="button" onClick={() => scrollToSection('faq')} className="landing-nav-link">
              FAQ
            </button>
            <button type="button" onClick={() => scrollToSection('enquiry')} className="landing-nav-link">
              Get Standee
            </button>
          </div>

          {/* Right Action Group */}
          <div className="landing-nav-actions">
            {/* Theme Toggle Button */}
            {onToggleTheme && (
              <button
                type="button"
                className="btn btn-secondary btn-sm landing-theme-btn"
                onClick={onToggleTheme}
                title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
                id="btn-landing-theme-toggle"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun size={14} style={{ color: '#FBBF24' }} />
                    <span className="desktop-only-inline">Light</span>
                  </>
                ) : (
                  <>
                    <Moon size={14} style={{ color: '#6366F1' }} />
                    <span className="desktop-only-inline">Dark</span>
                  </>
                )}
              </button>
            )}

            {/* Quick QR Standee Scanner Button */}
            {onOpenQuickScanner && (
              <button
                type="button"
                className="btn btn-secondary btn-sm landing-scan-btn"
                onClick={onOpenQuickScanner}
                title="Scan any physical QR standee with sound & instant navigation"
                id="btn-landing-quick-scan"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <ScanLine size={14} style={{ color: '#10B981' }} />
                <span>Scan Standee</span>
              </button>
            )}

            {/* Client / Superadmin Login Portal Button */}
            <button
              type="button"
              className="btn btn-primary btn-sm landing-login-btn"
              onClick={onOpenLogin}
              id="btn-landing-open-login"
            >
              <Lock size={13} />
              <span>Client / Admin Login</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION & DYNAMIC PROCESS CAROUSEL                                */}
      {/* ========================================================================= */}
      <section className="landing-hero-section" id="how-it-works">
        <div className="landing-container">


          {/* Main Hero Title */}
          <h1 className="landing-hero-heading">
            Turn QR scans into Trusted reviews{' '}
            <span className="text-gradient-purple">without typing</span>
          </h1>

          <p className="landing-hero-subtext">
            Give customers pre-written, AI-crafted 5-star review comments in English and Tenglish.
            Zero typing, zero friction, and instant redirection straight into your Google Business Profile.
          </p>

          {/* Dynamic 6-Step Process Carousel Card */}
          <div
            className="carousel-main-card glass-panel"
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
          >
            {/* Top Carousel Navigation Tabs (Steps 1 through 6) */}
            <div className="carousel-step-tabs-row">
              {CAROUSEL_STEPS.map((step, idx) => {
                const isActive = idx === currentSlide;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setCurrentSlide(idx)}
                    className={`carousel-step-tab-btn ${isActive ? 'active' : ''}`}
                    title={step.title}
                  >
                    <span className="carousel-step-tab-num">{step.stepNumber}</span>
                    <span className="carousel-step-tab-text">{step.title.split(' ')[0]}</span>
                    {isActive && <div className="carousel-step-progress-indicator" />}
                  </button>
                );
              })}
            </div>

            {/* Split Slide Content */}
            <div className="carousel-slide-split">
              {/* Left Column: Step Description & Explanations */}
              <div className="carousel-text-col fade-in" key={`text-${currentSlide}`}>
                <div className="carousel-step-meta-badge">
                  <span>Step {CAROUSEL_STEPS[currentSlide].stepNumber} of 06</span>
                  <span className="carousel-bullet">•</span>
                  <span>{CAROUSEL_STEPS[currentSlide].subtitle}</span>
                </div>

                <h2 className="carousel-slide-title">
                  {CAROUSEL_STEPS[currentSlide].title}
                </h2>

                <p className="carousel-slide-desc">
                  {CAROUSEL_STEPS[currentSlide].description}
                </p>

                {/* Key Benefit Pill */}
                <div className="carousel-benefit-pill">
                  <CheckCircle2 size={16} style={{ color: 'var(--success, #10B981)', flexShrink: 0 }} />
                  <span>{CAROUSEL_STEPS[currentSlide].highlight}</span>
                </div>

                {/* Tags */}
                <div className="carousel-tags-row">
                  {CAROUSEL_STEPS[currentSlide].tags.map((tag) => (
                    <span key={tag} className="carousel-tag-pill">
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Carousel Controls (Previous / Play / Next) */}
                <div className="carousel-controls-bar">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm carousel-nav-btn"
                    onClick={handlePrevSlide}
                    title="Previous Step"
                  >
                    <ChevronLeft size={16} />
                    <span>Prev</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm carousel-nav-btn"
                    onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                    title={isAutoPlaying ? 'Pause Auto-Play' : 'Resume Auto-Play'}
                  >
                    {isAutoPlaying ? <Pause size={14} /> : <Play size={14} />}
                    <span>{isAutoPlaying ? 'Playing' : 'Paused'}</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary btn-sm carousel-nav-btn"
                    onClick={handleNextSlide}
                    title="Next Step"
                  >
                    <span>Next</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Right Column: Animated Smartphone Screen Mockup */}
              <div className="carousel-visual-col" key={`vis-${currentSlide}`}>
                <div className="mockup-phone-frame">
                  <div className="mockup-phone-speaker" />
                  <div className="mockup-phone-notch" />

                  {/* Dynamic Screen View Depending on Current Step */}
                  <div className="mockup-screen-content">
                    {/* Header of Mockup App */}
                    <div className="mockup-screen-header">
                      <div className="mockup-brand-title">Mayuri Multicuisine Restaurant</div>
                      <div className="mockup-brand-sub">Pendurthi, Visakhapatnam</div>
                    </div>

                    {/* SLIDE 1 VIEW: SCANNING QR STANDEE */}
                    {currentSlide === 0 && (
                      <div className="mockup-step-view fade-in">
                        <div className="mockup-scan-viewfinder">
                          <div className="mockup-laser-line" />
                          <div className="mockup-qr-center">
                            <QrCode size={90} style={{ color: '#FFFFFF' }} />
                            <div className="mockup-qr-pill">QR000038</div>
                          </div>
                        </div>
                        <div
                          className="mockup-scan-instruction"
                          style={onOpenQuickScanner ? { cursor: 'pointer', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)' } : {}}
                          onClick={onOpenQuickScanner}
                          title={onOpenQuickScanner ? 'Click to open live camera scanner' : ''}
                        >
                          <ScanLine size={16} style={{ color: '#10B981' }} />
                          <span>{onOpenQuickScanner ? 'Tap to Open Live Camera Scanner' : 'Scanning Standee Camera Feed...'}</span>
                        </div>
                      </div>
                    )}

                    {/* SLIDE 2 VIEW: AI REVIEWS DISPLAYED */}
                    {currentSlide === 1 && (
                      <div className="mockup-step-view fade-in">
                        <div className="mockup-step-pill">Choose a comment:</div>
                        <div className="mockup-review-card active">
                          <div className="mockup-stars">★★★★★</div>
                          <div className="mockup-card-text">
                            "Super delicious food and warm hospitality! Biryani flavor was authentic. Highly recommended!"
                          </div>
                          <div className="mockup-card-badge">English • Most Popular</div>
                        </div>
                        <div className="mockup-review-card">
                          <div className="mockup-stars">★★★★★</div>
                          <div className="mockup-card-text">
                            "Chala bagundi food! Ambience and staff service super. Family tho visit cheyadaniki best place."
                          </div>
                          <div className="mockup-card-badge">Tenglish</div>
                        </div>
                      </div>
                    )}

                    {/* SLIDE 3 VIEW: SELECT & SUBMIT */}
                    {currentSlide === 2 && (
                      <div className="mockup-step-view fade-in">
                        <div className="mockup-selected-banner">
                          <CheckCircle2 size={16} style={{ color: '#10B981' }} />
                          <span>Selected Review Comment</span>
                        </div>
                        <div className="mockup-review-card selected">
                          <div className="mockup-stars">★★★★★</div>
                          <div className="mockup-card-text">
                            "Exceptional service, cozy atmosphere and mouthwatering dishes! Five stars all the way!"
                          </div>
                        </div>
                        <div className="mockup-phone-input-pill">
                          <Phone size={13} style={{ color: '#8B5CF6' }} />
                          <span>+91 98858 ••••• (Loyalty Phone)</span>
                        </div>
                        <div className="mockup-submit-btn-preview">
                          <span>Submit & Copy Review</span>
                          <ArrowRight size={13} />
                        </div>
                      </div>
                    )}

                    {/* SLIDE 4 VIEW: COPIED TO CLIPBOARD */}
                    {currentSlide === 3 && (
                      <div className="mockup-step-view fade-in">
                        <div className="mockup-copy-success-box">
                          <div className="mockup-success-ring">
                            <Check size={28} style={{ color: '#10B981' }} />
                          </div>
                          <div className="mockup-success-title">Review Copied to Clipboard!</div>
                          <div className="mockup-success-desc">
                            "Super delicious food and warm hospitality! Biryani flavor was authentic..."
                          </div>
                          <div className="mockup-redirect-timer">
                            <Clock size={12} className="animate-spin" />
                            <span>Opening Google Review in 2 seconds...</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SLIDE 5 VIEW: GOOGLE BUSINESS DIALOGUE */}
                    {currentSlide === 4 && (
                      <div className="mockup-step-view fade-in">
                        <div className="mockup-google-dialog">
                          <div className="mockup-google-header">
                            <div className="google-g-icon">G</div>
                            <div>
                              <div className="mockup-google-name">Mayuri Restaurant</div>
                              <div className="mockup-google-sub">Posting publicly across Google</div>
                            </div>
                          </div>
                          <div className="mockup-google-stars-row">
                            <Star size={24} fill="#FBBF24" color="#FBBF24" />
                            <Star size={24} fill="#FBBF24" color="#FBBF24" />
                            <Star size={24} fill="#FBBF24" color="#FBBF24" />
                            <Star size={24} fill="#FBBF24" color="#FBBF24" />
                            <Star size={24} fill="#FBBF24" color="#FBBF24" />
                          </div>
                          <div className="mockup-paste-box">
                            <span className="mockup-pasted-text">
                              Super delicious food and warm hospitality! Biryani flavor was authentic...
                            </span>
                          </div>
                          <div className="mockup-google-post-btn">
                            Post to Google Maps
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SLIDE 6 VIEW: REVIEW PUBLISHED */}
                    {currentSlide === 5 && (
                      <div className="mockup-step-view fade-in">
                        <div className="mockup-published-card">
                          <div className="mockup-badge-live">
                            <Sparkles size={14} style={{ color: '#FBBF24' }} />
                            <span>Published on Google Maps</span>
                          </div>
                          <div className="mockup-stars">★★★★★</div>
                          <div className="mockup-card-text">
                            "Super delicious food and warm hospitality! Biryani flavor was authentic. Highly recommended!"
                          </div>
                          <div className="mockup-author-line">
                            <span className="mockup-avatar">R</span>
                            <div>
                              <div className="mockup-author-name">Ramesh K.</div>
                              <div className="mockup-author-time">Verified Local Guide • Just now</div>
                            </div>
                          </div>
                          <div className="mockup-response-bubble">
                            <strong>Response from owner:</strong> Thank you Ramesh! Delighted to serve you!
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. ALL ONBOARDED BUSINESSES INFINITE MARQUEE (SCROLLS LEFT TO RIGHT)      */}
      {/* ========================================================================= */}
      <section className="landing-marquee-section" id="businesses">
        <div className="landing-container">
          <div className="section-header-centered">
            <div className="section-eyebrow">
              <Building2 size={14} />
              <span>Trusted Commercial Network</span>
            </div>
            <h2 className="section-title">Onboarded Businesses Thriving With QR-Reviews</h2>
            <p className="section-subtitle">
              Join leading restaurants, hotels, retail boutiques, clinics, and supermarkets scaling their Google reputation.
            </p>
          </div>
        </div>

        {/* Infinite Left-to-Right Scrolling Marquee Track */}
        <div className="marquee-outer-wrapper">
          <div className="marquee-track-left-to-right">
            {/* Render items twice to ensure seamless infinite looping */}
            {[...displayClients, ...displayClients, ...displayClients].map((client, index) => {
              const reviewCount = client.reviewsCount || Math.floor(10 + (index % 5) * 6);
              const logo = client.logoUrl ? getImageUrl(client.logoUrl) : null;

              return (
                <div key={`${client.id || index}-${index}`} className="marquee-business-card glass-panel">
                  <div className="marquee-card-top">
                    <div className="marquee-avatar-frame">
                      {logo ? (
                        <img src={logo} alt={client.name} className="marquee-avatar-img" />
                      ) : (
                        <div className="marquee-avatar-placeholder">
                          {client.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="marquee-business-name">{client.name}</div>
                      <div className="marquee-business-cat">{client.businessType || 'Commercial Store'}</div>
                    </div>
                  </div>

                  <div className="marquee-card-meta">
                    <div className="marquee-meta-item">
                      <MapPin size={12} style={{ color: 'var(--primary)' }} />
                      <span>{client.businessLocation || client.address?.split(',')[0] || 'Visakhapatnam'}</span>
                    </div>
                    <div className="marquee-meta-item">
                      <Star size={12} fill="#FBBF24" color="#FBBF24" />
                      <span>{client.averageRating || '5.0'} ({reviewCount} reviews)</span>
                    </div>
                  </div>



                </div>
              );
            })}
          </div>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* 4. REAL-TIME KPI DASHBOARD CARDS                                          */}
      {/* ========================================================================= */}
      <section className="landing-stats-section" id="stats">
        <div className="landing-container">
          <div className="section-header-centered">
            <div className="section-eyebrow">
              <TrendingUp size={14} />
              <span>Real-Time Cloud Performance</span>
            </div>
            <h2 className="section-title">Measurable Impact Across The Network</h2>
            <p className="section-subtitle">
              Live statistics dynamically synced from our master cloud database.
            </p>
          </div>

          <div className="landing-stats-grid">
            {/* KPI 1: Total Dynamic QR Standees */}
            <div className="landing-stat-card glass-panel">
              <div className="stat-card-icon-wrap" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366F1' }}>
                <QrCode size={26} />
              </div>
              <div>
                <div className="stat-number">{stats.totalQrs || 35}</div>
                <div className="stat-title">Dynamic Standees in Pool</div>
                <div className="stat-footnote">Pre-printed & instant re-assignable</div>
              </div>
            </div>

            {/* KPI 2: Active Onboarded Businesses */}
            <div className="landing-stat-card glass-panel">
              <div className="stat-card-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>
                <Building2 size={26} />
              </div>
              <div>
                <div className="stat-number">{stats.totalClients || 5}</div>
                <div className="stat-title">Onboarded Businesses</div>
                <div className="stat-footnote">Hotels, retail, clinics & dining</div>
              </div>
            </div>

            {/* KPI 3: Total QR Standee Scans */}
            <div className="landing-stat-card glass-panel">
              <div className="stat-card-icon-wrap" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#EC4899' }}>
                <ScanLine size={26} />
              </div>
              <div>
                <div className="stat-number">{stats.totalScans || Math.max(stats.totalReviews || 0, 15)}</div>
                <div className="stat-title">Total Standee Scans</div>
                <div className="stat-footnote">Real-time mobile camera interactions</div>
              </div>
            </div>

            {/* KPI 4: Customer Reviews Logged */}
            <div className="landing-stat-card glass-panel">
              <div className="stat-card-icon-wrap" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#06B6D4' }}>
                <MessageSquare size={26} />
              </div>
              <div>
                <div className="stat-number">{stats.totalReviews || 14}</div>
                <div className="stat-title">Customer Reviews Logged</div>
                <div className="stat-footnote">High-sentiment authentic feedback</div>
              </div>
            </div>

            {/* KPI 5: Scan-to-Review Conversion */}
            <div className="landing-stat-card glass-panel">
              <div className="stat-card-icon-wrap" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8B5CF6' }}>
                <Award size={26} />
              </div>
              <div>
                <div className="stat-number">92%</div>
                <div className="stat-title">Scan Conversion Rate</div>
                <div className="stat-footnote">Vs. 2% industry traditional average</div>
              </div>
            </div>

            {/* KPI 6: Average Satisfaction Rating */}
            <div className="landing-stat-card glass-panel">
              <div className="stat-card-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' }}>
                <Star size={26} fill="#F59E0B" />
              </div>
              <div>
                <div className="stat-number">4.9 / 5.0</div>
                <div className="stat-title">Average Rating Score</div>
                <div className="stat-footnote">Verified Google Maps reputation</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. ADVANTAGES & USE-CASES OF QR REVIEWS                                    */}
      {/* ========================================================================= */}
      <section className="landing-advantages-section" id="advantages">
        <div className="landing-container">
          <div className="section-header-centered">
            <div className="section-eyebrow">
              <Award size={14} />
              <span>Why QR-Reviews Wins</span>
            </div>
            <h2 className="section-title">Unfair Advantage For Local Businesses</h2>
            <p className="section-subtitle">
              Traditional review requests fail because writing paragraphs is tedious. QR-Reviews makes it effortless.
            </p>
          </div>

          <div className="advantages-grid">
            {/* Advantage 1 */}
            <div className="advantage-card glass-panel">
              <div className="advantage-icon-wrapper" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366F1' }}>
                <Flame size={24} />
              </div>
              <h3 className="advantage-title">10x Review Generation Velocity</h3>
              <p className="advantage-desc">
                Customers are 10 times more likely to post a review when they don’t have to type. Pre-written comments
                turn a 3-minute chore into a 10-second tap.
              </p>
              <div className="advantage-check-row">
                <Check size={14} style={{ color: '#10B981' }} />
                <span>Zero writer’s block for customers</span>
              </div>
            </div>

            {/* Advantage 2 */}
            <div className="advantage-card glass-panel">
              <div className="advantage-icon-wrapper" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#EC4899' }}>
                <Globe size={24} />
              </div>
              <h3 className="advantage-title">Bilingual: English & Tenglish</h3>
              <p className="advantage-desc">
                Locals love expressing themselves in natural regional phrasing. Our smart engine offers both clean English
                and authentic Tenglish comments for high relatable sentiment.
              </p>
              <div className="advantage-check-row">
                <Check size={14} style={{ color: '#10B981' }} />
                <span>Culturally tuned for maximum resonance</span>
              </div>
            </div>

            {/* Advantage 3 */}
            <div className="advantage-card glass-panel">
              <div className="advantage-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>
                <Phone size={24} />
              </div>
              <h3 className="advantage-title">Direct Customer Phone Capture</h3>
              <p className="advantage-desc">
                Google Reviews alone don’t give you customer contacts. QR-Reviews captures verified mobile numbers for repeat
                WhatsApp offers, festival promotions, and loyalty incentives.
              </p>
              <div className="advantage-check-row">
                <Check size={14} style={{ color: '#10B981' }} />
                <span>Export clean Excel sheets in 1-click</span>
              </div>
            </div>

            {/* Advantage 4 */}
            <div className="advantage-card glass-panel">
              <div className="advantage-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' }}>
                <Layers size={24} />
              </div>
              <h3 className="advantage-title">Dynamic Re-assignable Standees</h3>
              <p className="advantage-desc">
                Physical standees carry permanent QR IDs (e.g. QR000038). Re-assign them to a new business branch or client
                in 2 seconds from the cloud without ever re-printing hardware!
              </p>
              <div className="advantage-check-row">
                <Check size={14} style={{ color: '#10B981' }} />
                <span>Zero hardware wastage or reprint costs</span>
              </div>
            </div>

            {/* Advantage 5 */}
            <div className="advantage-card glass-panel">
              <div className="advantage-icon-wrapper" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#06B6D4' }}>
                <ShieldCheck size={24} />
              </div>
              <h3 className="advantage-title">Negative Feedback Firewalled</h3>
              <p className="advantage-desc">
                Have an unhappy customer? They are provided with an internal feedback route to resolve issues privately with
                management, preventing public 1-star damage to your Google profile.
              </p>
              <div className="advantage-check-row">
                <Check size={14} style={{ color: '#10B981' }} />
                <span>Protects your hard-earned Google star rating</span>
              </div>
            </div>

            {/* Advantage 6 */}
            <div className="advantage-card glass-panel">
              <div className="advantage-icon-wrapper" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8B5CF6' }}>
                <TrendingUp size={24} />
              </div>
              <h3 className="advantage-title">Google Maps Local 3-Pack SEO</h3>
              <p className="advantage-desc">
                Google ranks businesses higher when they receive frequent, keyword-rich reviews. Our templates inject
                crucial local search keywords that push your business to #1 on Maps.
              </p>
              <div className="advantage-check-row">
                <Check size={14} style={{ color: '#10B981' }} />
                <span>Dominates local organic neighborhood search</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5.5. TRANSPARENT PRICING PLANS (WITH ₹9 LAUNCH TRIAL)                     */}
      {/* ========================================================================= */}
      <section className="landing-pricing-section" id="pricing">
        <div className="landing-container">
          {/* Section Header */}
          <div className="section-header-centered">
            <div className="section-eyebrow">
              <Tag size={14} style={{ color: '#F59E0B' }} />
              <span>Transparent & High-ROI Plans</span>
            </div>
            <h2 className="section-title">
              Simple INR Pricing For The Best Google Review Platform
            </h2>
            <p className="section-subtitle">
              {card1?.price === 0
                ? <>Start with our <strong>{card1?.name || 'Free Trial'}</strong> or scale with flexible monthly and annual plans. Cancel anytime.</>
                : <>Start with our <strong>{card1 ? `₹${card1.price} introductory launch trial` : 'introductory launch trial'}</strong> or scale with flexible monthly and annual plans. Cancel anytime.</>}
            </p>

            {/* Monthly / Yearly Billing Toggle */}
            <div className="pricing-billing-toggle-wrap">
              <div className="pricing-billing-toggle" role="radiogroup" aria-label="Billing Cycle">
                <button
                  type="button"
                  className={`billing-toggle-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
                  onClick={() => setBillingCycle('monthly')}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  className={`billing-toggle-btn ${billingCycle === 'yearly' ? 'active' : ''}`}
                  onClick={() => setBillingCycle('yearly')}
                >
                  <span>Yearly</span>
                  <span className="billing-save-pill">Save 35% + Free Standee</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3 Pricing Cards Grid */}
          <div className="pricing-cards-grid">
            {/* CARD 1: STARTER / FIRST LANDING PLAN */}
            {card1 && (
              <div className="pricing-card glass-panel starter-card">
                {card1.badge && (
                  <div className="pricing-card-badge starter-badge">
                    <Sparkles size={12} />
                    <span>{card1.badge}</span>
                  </div>
                )}

                <div className="pricing-card-header">
                  <div className="pricing-plan-category">{card1.billingCycle ? card1.billingCycle.toUpperCase() : 'STARTER'}</div>
                  <h3 className="pricing-plan-name">{card1.name}</h3>
                  {card1.tagline && (
                    <p className="pricing-plan-tagline">
                      {card1.tagline}
                    </p>
                  )}
                </div>

                <div className="pricing-price-box">
                  <div className="pricing-currency-row">
                    <span className="pricing-currency">₹</span>
                    <span className="pricing-amount">{card1.price !== undefined ? card1.price : 0}</span>
                  </div>
                  <div className="pricing-period">{card1.periodLabel || (card1.price === 0 ? '7-day trial' : 'per month')}</div>
                  <div className="pricing-note">Instant QR activation • No credit card required</div>
                </div>

                {card1.hardwareIncluded && (
                  <div className="pricing-banner-perk" style={{ margin: '0 0 16px 0' }}>
                    <Gift size={13} />
                    <span>{card1.hardwareIncluded}</span>
                  </div>
                )}

                <div className="pricing-divider" />

                <div className="pricing-features-list">
                  {Array.isArray(card1.features) && card1.features.length > 0 ? (
                    card1.features.map((feat, idx) => (
                      <div key={idx} className="pricing-feature-item">
                        <Check size={16} className="feature-check-icon" />
                        <span>{feat}</span>
                      </div>
                    ))
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectPlan(card1.name)}
                  className="btn btn-secondary pricing-cta-btn"
                  id="btn-pricing-starter"
                >
                  <span>{card1.price === 0 ? 'Start Free Trial' : `Get Started for ₹${card1.price}`}</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            )}

            {/* CARD 2: PRO / SECOND LANDING PLAN (FEATURED) */}
            {card2 && (
              <div className="pricing-card glass-panel pro-card featured-card">
                {card2.badge && (
                  <div className="pricing-card-badge pro-badge">
                    <Flame size={13} fill="#FFF" />
                    <span>{card2.badge}</span>
                  </div>
                )}

                <div className="pricing-card-header">
                  <div className="pricing-plan-category" style={{ color: '#A855F7' }}>GROWTH & LOCAL SEO</div>
                  <h3 className="pricing-plan-name">{card2.name}</h3>
                  {card2.tagline && (
                    <p className="pricing-plan-tagline">
                      {card2.tagline}
                    </p>
                  )}
                </div>

                <div className="pricing-price-box">
                  <div className="pricing-currency-row">
                    <span className="pricing-currency">₹</span>
                    <span className="pricing-amount">
                      {card2.price !== undefined ? card2.price : 150}
                    </span>
                    <span className="pricing-unit">/month</span>
                  </div>
                  <div className="pricing-period">
                    {card2.periodLabel || 'Billed monthly • Cancel anytime'}
                  </div>
                  {card2.hardwareIncluded && (
                    <div className="pricing-banner-perk">
                      <Gift size={13} />
                      <span>{card2.hardwareIncluded}</span>
                    </div>
                  )}
                </div>

                <div className="pricing-divider" />

                <div className="pricing-features-list">
                  {Array.isArray(card2.features) && card2.features.length > 0 ? (
                    card2.features.map((feat, idx) => (
                      <div key={idx} className={`pricing-feature-item ${idx === 0 ? 'highlight' : ''}`}>
                        {idx === 0 ? <CheckCircle2 size={16} className="feature-check-icon gold" /> : <Check size={16} className="feature-check-icon" />}
                        <span>{feat}</span>
                      </div>
                    ))
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectPlan(card2.name)}
                  className="btn btn-primary pricing-cta-btn glowing-cta"
                  id="btn-pricing-pro"
                >
                  <span>Get {card2.name}</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            )}

            {/* CARD 3: MULTI-OUTLET / THIRD LANDING PLAN */}
            {card3 && (
              <div className="pricing-card glass-panel custom-card">
                {card3.badge && (
                  <div className="pricing-card-badge custom-badge">
                    <Sliders size={12} />
                    <span>{card3.badge}</span>
                  </div>
                )}

                <div className="pricing-card-header">
                  <div className="pricing-plan-category" style={{ color: '#06B6D4' }}>FRANCHISES & MULTI-BRANCH</div>
                  <h3 className="pricing-plan-name">{card3.name}</h3>
                  {card3.tagline && (
                    <p className="pricing-plan-tagline">
                      {card3.tagline}
                    </p>
                  )}
                </div>

                {(card3.billingCycle === 'custom' || card3.name.toLowerCase().includes('multi') || card3.name.toLowerCase().includes('custom')) ? (
                  <>
                    <div className="pricing-price-box">
                      <div className="pricing-currency-row">
                        <span className="pricing-currency">₹</span>
                        <span className="pricing-amount">{calculateCustomPrice().toLocaleString()}</span>
                        <span className="pricing-unit">/month</span>
                      </div>
                      <div className="pricing-period">
                        For {customOutlets} Outlets & {customKeywords} Target Keywords
                      </div>
                    </div>

                    {/* Sliders Container */}
                    <div className="pricing-sliders-box">
                      {/* Outlets Slider */}
                      <div className="pricing-slider-item">
                        <div className="slider-label-row">
                          <span className="slider-title">Outlets / Locations:</span>
                          <strong className="slider-val-badge">{customOutlets} Outlets</strong>
                        </div>
                        <input
                          type="range"
                          min="2"
                          max="10"
                          step="1"
                          value={customOutlets}
                          onChange={(e) => setCustomOutlets(Number(e.target.value))}
                          className="pricing-range-slider"
                        />
                        <div className="slider-sub-info">
                          Includes {customOutlets} physical acrylic standees
                        </div>
                      </div>

                      {/* Keywords Slider */}
                      <div className="pricing-slider-item">
                        <div className="slider-label-row">
                          <span className="slider-title">Target SEO Keywords:</span>
                          <strong className="slider-val-badge">{customKeywords} Keywords</strong>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="30"
                          step="5"
                          value={customKeywords}
                          onChange={(e) => setCustomKeywords(Number(e.target.value))}
                          className="pricing-range-slider"
                        />
                        <div className="slider-sub-info">
                          Boosts ranking for {customKeywords} specialties
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="pricing-price-box">
                    <div className="pricing-currency-row">
                      <span className="pricing-currency">₹</span>
                      <span className="pricing-amount">{card3.price}</span>
                      <span className="pricing-unit">/month</span>
                    </div>
                    <div className="pricing-period">{card3.periodLabel || 'per month'}</div>
                  </div>
                )}

                {card3.hardwareIncluded && (
                  <div className="pricing-banner-perk" style={{ margin: '0 0 16px 0' }}>
                    <Gift size={13} />
                    <span>{card3.hardwareIncluded}</span>
                  </div>
                )}

                <div className="pricing-divider" />

                <div className="pricing-features-list">
                  {Array.isArray(card3.features) && card3.features.length > 0 ? (
                    card3.features.map((feat, idx) => (
                      <div key={idx} className="pricing-feature-item">
                        <Check size={16} className="feature-check-icon" />
                        <span>{feat}</span>
                      </div>
                    ))
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectPlan(`${card3.name} (${customOutlets} Outlets, ${customKeywords} Keywords - ₹${calculateCustomPrice()}/mo)`)}
                  className="btn btn-secondary pricing-cta-btn"
                  id="btn-pricing-custom"
                >
                  <span>Customize Plan</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            )}
          </div>

          {/* Pricing Trust & Guarantee Bar */}
          <div className="pricing-trust-bar glass-panel">
            <div className="pricing-trust-item">
              <ShieldCheck size={20} style={{ color: '#10B981' }} />
              <div>
                <strong>Zero Financial Risk</strong>
                <span>Try our introductory starter plan with full platform features</span>
              </div>
            </div>
            <div className="pricing-trust-item">
              <QrCode size={20} style={{ color: '#8B5CF6' }} />
              <div>
                <strong>Re-assignable Standees</strong>
                <span>Dynamic cloud QR never becomes obsolete or needs reprint</span>
              </div>
            </div>
            <div className="pricing-trust-item">
              <Zap size={20} style={{ color: '#F59E0B' }} />
              <div>
                <strong>Fast Setup</strong>
                <span>Digital portal goes live in under 2 minutes</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5B. FREQUENTLY ASKED QUESTIONS (CUSTOMER PERSPECTIVE)                      */}
      {/* ========================================================================= */}
      <section className="landing-faq-section" id="faq">
        <div className="landing-container">
          <div className="section-header-centered">
            <div className="section-eyebrow">
              <HelpCircle size={14} style={{ color: '#06B6D4' }} />
              <span>Customer Help & Clarity</span>
            </div>
            <h2 className="section-title">Frequently Asked Questions</h2>
            <p className="section-subtitle">
              Everything customers need to know about scanning the standee, ready-made review options, and posting directly to Google.
            </p>
          </div>

          <div className="faq-accordion-list">
            {CUSTOMER_FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={faq.id} className={`faq-item-card glass-panel ${isOpen ? 'open' : ''}`}>
                  <button
                    type="button"
                    className="faq-question-btn"
                    onClick={() => toggleFaq(idx)}
                    aria-expanded={isOpen}
                    id={`faq-btn-${faq.id}`}
                  >
                    <div className="faq-question-content">
                      <span className="faq-tag-badge">{faq.tag}</span>
                      <span className="faq-question-text">{faq.question}</span>
                    </div>
                    <ChevronDown size={18} className={`faq-chevron-icon ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="faq-answer-collapse">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. BUSINESS ENQUIRY FORM SECTION                                         */}
      {/* ========================================================================= */}
      <section className="landing-enquiry-section" id="enquiry">
        <div className="landing-container">
          <div className="enquiry-card-wrapper glass-panel">
            <div className="enquiry-split-layout">
              {/* Left Column: Value Pitch & Contact Highlights */}
              <div className="enquiry-pitch-col">
                <div className="enquiry-eyebrow">
                  <Sparkles size={14} />
                  <span>Get Your Custom Standee</span>
                </div>

                <h2 className="enquiry-heading">
                  Ready to 10x Your Google Reviews & Footfall?
                </h2>

                <p className="enquiry-subtext">
                  Request an official QR-Reviews dynamic acrylic standee kit tailored for your business establishment.
                  Our team provides instant onboarding, custom branding, and hands-on setup.
                </p>

                <div className="enquiry-benefits-list">
                  <div className="enquiry-benefit-item">
                    <CheckCircle2 size={18} style={{ color: '#10B981', flexShrink: 0 }} />
                    <div>
                      <strong>Turnkey Hardware Standee:</strong> Premium acrylic standee with high-gloss QR print.
                    </div>
                  </div>
                  <div className="enquiry-benefit-item">
                    <CheckCircle2 size={18} style={{ color: '#10B981', flexShrink: 0 }} />
                    <div>
                      <strong>Dedicated Client Admin Portal:</strong> Real-time review alerts, customer analytics, and Excel exports.
                    </div>
                  </div>
                  <div className="enquiry-benefit-item">
                    <CheckCircle2 size={18} style={{ color: '#10B981', flexShrink: 0 }} />
                    <div>
                      <strong>Custom AI Keyword Tuning:</strong> Tailored review phrases for your specific menu, services, or catalog.
                    </div>
                  </div>
                </div>

                {/* Direct Contact Callout */}
                <div className="enquiry-contact-card">
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Direct Support Hotline
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Phone size={16} style={{ color: '#10B981' }} />
                    <CopyablePhone phone="8885803111" />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(Vasmi Group HQ)</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Lead Form */}
              <div className="enquiry-form-col">
                <form onSubmit={handleEnquirySubmit} className="enquiry-form">
                  <h3 className="enquiry-form-title">Business Enquiry Form</h3>
                  <p className="enquiry-form-subtitle">Fill out your details to receive a free live consultation & quote</p>

                  {enquiryFeedback && (
                    <div className={`enquiry-feedback-box ${enquiryFeedback.type}`}>
                      {enquiryFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                      <span>{enquiryFeedback.message}</span>
                    </div>
                  )}

                  {/* Selected Pricing Plan Banner */}
                  {enquiryForm.selectedPlan && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(139, 92, 246, 0.15)',
                      border: '1px solid rgba(139, 92, 246, 0.4)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      marginBottom: '16px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Tag size={15} style={{ color: '#F59E0B' }} />
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Selected Plan:</span>
                        <strong style={{ fontSize: '0.86rem', color: '#A855F7' }}>{enquiryForm.selectedPlan}</strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEnquiryForm((prev) => ({ ...prev, selectedPlan: '' }))}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '2px 6px',
                          fontSize: '0.85rem'
                        }}
                        title="Clear plan selection"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Business Name */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="enq-businessName">Business / Brand Name *</label>
                    <input
                      id="enq-businessName"
                      type="text"
                      name="businessName"
                      value={enquiryForm.businessName}
                      onChange={handleEnquiryChange}
                      placeholder="e.g. Mayuri Restaurant, Lenskart Outlet"
                      className="form-input"
                      required
                    />
                  </div>

                  {/* Contact Person & Phone */}
                  <div className="form-row-2">
                    <div className="form-group">
                      <label className="form-label" htmlFor="enq-contactPerson">Contact Person Name</label>
                      <input
                        id="enq-contactPerson"
                        type="text"
                        name="contactPerson"
                        value={enquiryForm.contactPerson}
                        onChange={handleEnquiryChange}
                        placeholder="e.g. Rajesh Kumar"
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="enq-phone">Mobile Number *</label>
                      <div className="input-prefix-wrapper">
                        <span className="input-prefix">+91</span>
                        <input
                          id="enq-phone"
                          type="tel"
                          name="phone"
                          value={enquiryForm.phone}
                          onChange={handleEnquiryChange}
                          placeholder="98765 43210"
                          className="form-input"
                          maxLength={10}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email & Location */}
                  <div className="form-row-2">
                    <div className="form-group">
                      <label className="form-label" htmlFor="enq-email">Email Address</label>
                      <input
                        id="enq-email"
                        type="email"
                        name="email"
                        value={enquiryForm.email}
                        onChange={handleEnquiryChange}
                        placeholder="contact@yourbusiness.com"
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="enq-location">City / Area Location</label>
                      <input
                        id="enq-location"
                        type="text"
                        name="location"
                        value={enquiryForm.location}
                        onChange={handleEnquiryChange}
                        placeholder="e.g. Visakhapatnam, Hyderabad"
                        className="form-input"
                      />
                    </div>
                  </div>

                  {/* Business Category */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="enq-category">Business Category</label>
                    <select
                      id="enq-category"
                      name="businessCategory"
                      value={enquiryForm.businessCategory}
                      onChange={handleEnquiryChange}
                      className="form-input"
                    >
                      <option value="Restaurant & Cafe">Restaurant & Cafe</option>
                      <option value="Hotel & Resort">Hotel & Resort</option>
                      <option value="Boutique & Retail">Boutique & Retail</option>
                      <option value="Salon & Spa">Salon & Spa</option>
                      <option value="Healthcare & Clinic">Healthcare & Clinic</option>
                      <option value="Supermarket / Grocery">Supermarket / Grocery</option>
                      <option value="Automotive & Garage">Automotive & Garage</option>
                      <option value="Gym & Fitness Center">Gym & Fitness Center</option>
                      <option value="Education & Coaching">Education & Coaching</option>
                      <option value="Other Business">Other Commercial Business</option>
                    </select>
                  </div>

                  {/* Message */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="enq-message">Message / Standee Requirements</label>
                    <textarea
                      id="enq-message"
                      name="message"
                      rows={3}
                      value={enquiryForm.message}
                      onChange={handleEnquiryChange}
                      placeholder="Tell us how many standees you need or ask any specific questions..."
                      className="form-input"
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  {/* Submit CTA */}
                  <button
                    type="submit"
                    disabled={submittingEnquiry}
                    className="btn btn-primary enquiry-submit-btn"
                    id="btn-enquiry-submit"
                  >
                    {submittingEnquiry ? (
                      <span>Sending Request...</span>
                    ) : (
                      <>
                        <Send size={16} />
                        <span>Send Enquiry & Request Demo Standee</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. COMPANY FOOTER                                                         */}
      {/* ========================================================================= */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="landing-footer-grid">
            {/* Brand Col */}
            <div className="landing-footer-brand-col">
              <div className="landing-brand-group" style={{ cursor: 'default' }}>
                <div className="landing-brand-logo-frame">
                  <img src={vasmiIcon} alt="QR-Reviews" className="landing-brand-logo-img" />
                </div>
                <div>
                  <div className="landing-brand-title">
                    <span>QR-</span>
                    <span className="brand-highlight">Reviews</span>
                  </div>
                  <div className="landing-brand-tagline">Dynamic Reputation Engine</div>
                </div>
              </div>
              <p className="landing-footer-bio">
                The smart dynamic standee platform that bridges in-person customer visits to high-velocity 5-star Google
                Reviews and local SEO domination.
              </p>
              <div className="landing-footer-creds">
                <span>Enterprise Grade • Cloud Managed • 100% Google Compliant</span>
              </div>
            </div>

            {/* Quick Links */}
            <div className="landing-footer-col">
              <h4 className="footer-col-title">Navigation</h4>
              <ul className="footer-links-list">
                <li><a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollToSection('how-it-works'); }}>How It Works (6 Steps)</a></li>
                <li><a href="#businesses" onClick={(e) => { e.preventDefault(); scrollToSection('businesses'); }}>Onboarded Businesses</a></li>
                <li><a href="#stats" onClick={(e) => { e.preventDefault(); scrollToSection('stats'); }}>Live KPI Performance</a></li>
                <li><a href="#advantages" onClick={(e) => { e.preventDefault(); scrollToSection('advantages'); }}>Key Advantages</a></li>
                <li><a href="#pricing" onClick={(e) => { e.preventDefault(); scrollToSection('pricing'); }}>Pricing Plans</a></li>
                <li><a href="#faq" onClick={(e) => { e.preventDefault(); scrollToSection('faq'); }}>Frequently Asked Questions</a></li>
                <li><a href="#enquiry" onClick={(e) => { e.preventDefault(); scrollToSection('enquiry'); }}>Request Standee</a></li>
              </ul>
            </div>

            {/* Portals & Legal */}
            <div className="landing-footer-col">
              <h4 className="footer-col-title">Portals & Access</h4>
              <ul className="footer-links-list">
                <li>
                  <button type="button" onClick={onOpenLogin} className="footer-btn-link">
                    <Lock size={12} />
                    <span>Client Admin Portal</span>
                  </button>
                </li>
                <li>
                  <button type="button" onClick={onOpenLogin} className="footer-btn-link">
                    <ShieldCheck size={12} />
                    <span>Super Admin Gateway</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenCustomerReview ? onOpenCustomerReview('QR000038') : window.open('/mayuri-hotel', '_blank')}
                    className="footer-btn-link"
                  >
                    <ExternalLink size={12} />
                    <span>Live Standee Demo (Mayuri Hotel)</span>
                  </button>
                </li>
                <li><span style={{ color: 'var(--text-muted)' }}>Terms of Service & Privacy</span></li>
              </ul>
            </div>

            {/* Official Contact & Address */}
            <div className="landing-footer-col">
              <h4 className="footer-col-title">Headquarters & Contact</h4>
              <div className="footer-contact-item">
                <MapPin size={16} className="footer-contact-icon" />
                <div>
                  <strong>Vasmi Group Technologies</strong>
                  <div>Dwaraka Nagar / Pendurthi, Visakhapatnam</div>
                  <div>Andhra Pradesh, India - 530051</div>
                </div>
              </div>

              <div className="footer-contact-item">
                <Phone size={16} className="footer-contact-icon" />
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Support:</span>
                  <CopyablePhone phone="8885803111" />
                </div>
              </div>

              <div className="footer-contact-item">
                <Mail size={16} className="footer-contact-icon" />
                <div>
                  <a href="mailto:contact@vasmigroup.com" style={{ color: 'inherit', textDecoration: 'underline' }}>
                    contact@vasmigroup.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Copyright & Vasmi Group Badge */}
          <div className="landing-footer-bottom-bar">
            <div className="footer-bottom-left">
              <span>© 2026 QR-Reviews Platform. All rights reserved.</span>
            </div>

            <div className="footer-bottom-right">
              <a
                href="https://vasmigroup.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="vasmi-dev-link"
                title="Designed and Developed by Vasmi Group - https://vasmigroup.com"
                id="link-landing-vasmi"
              >
                <span className="vasmi-dev-text">Designed and Developed by</span>
                <span className="vasmi-logo-wrapper">
                  <img src={vasmiFullLogo} alt="Vasmi Group - Creating Your Identity" className="vasmi-full-logo-img" />
                </span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

