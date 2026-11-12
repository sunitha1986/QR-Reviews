import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Building2,
  MapPin,
  Phone,
  Send,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  ArrowLeft,
  AlertCircle,
  MessageSquare,
  MessageSquareText,
  QrCode,
  UserPlus,
  Sun,
  Moon,
  Shuffle,
  Wand2,
  Check,
  Utensils,
  Hotel,
  ShoppingBag,
  Car,
  Dumbbell,
  GraduationCap,
  Activity,
  Lock,
  RefreshCw,
  ExternalLink,
  Copy,
  WifiOff,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  resolveCategory,
  CATEGORY_DATA
} from '../../data/aiSuggestions';
import { generateSlug } from '../../utils/slug';
import { extractPlaceId, buildGoogleReviewUrl } from '../../utils/placeId';
import { cleanPhoneNumber } from '../../utils/phone';
import Footer from '../../components/Footer';
import headerWaveBanner from '../../assets/header_wave_banner.jpg';
import config, { getImageUrl } from '../../config';
import { CustomerReviewShimmer, ReviewSuggestionsShimmer } from '../../components/Shimmer';

// Helper to detect fetch / network connection errors
function isNetworkFetchError(err) {
  if (!err) return false;
  const msg = (typeof err === 'string' ? err : (err?.message || '')).toLowerCase();
  return (
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('network error') ||
    msg.includes('network request failed') ||
    msg.includes('load failed') ||
    msg.includes('unable to reach') ||
    msg.includes('connection refused') ||
    msg.includes('connection problem') ||
    msg.includes('server temporarily unavailable') ||
    msg.includes('offline') ||
    msg.includes('timeout')
  );
}

// Helper to normalize review strings for deduplication comparison
function normalizeReviewText(str) {
  return (str || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Check if a review suggestion matches or is a duplicate of any already submitted review
function isReviewUsed(candidate, usedList) {
  if (!candidate || !usedList || !usedList.length) return false;
  const normCand = normalizeReviewText(candidate);
  if (!normCand || normCand.length < 5) return false;

  for (const used of usedList) {
    const normUsed = normalizeReviewText(used);
    if (!normUsed) continue;
    if (normCand === normUsed) return true;
    if (normCand.includes(normUsed) || normUsed.includes(normCand)) {
      if (Math.min(normCand.length, normUsed.length) > 16) return true;
    }
  }
  return false;
}

// Helper to pick category icon
function getCategoryIcon(catKey) {
  switch (catKey) {
    case 'Restaurant & Cafe':
      return <Utensils size={30} />;
    case 'Healthcare & Clinic':
      return <Activity size={30} />;
    case 'Hotel & Resort':
      return <Hotel size={30} />;
    case 'Retail & Shopping':
      return <ShoppingBag size={30} />;
    case 'Salon & Spa':
      return <Sparkles size={30} />;
    case 'Automotive & Garage':
      return <Car size={30} />;
    case 'Gym & Fitness Center':
      return <Dumbbell size={30} />;
    case 'Education & Coaching':
      return <GraduationCap size={30} />;
    default:
      return <Building2 size={30} />;
  }
}



export default function CustomerReviewForm({
  qrId = 'QR000001',
  onBackToApp,
  onGoToOnboard,
  theme = 'light',
  onToggleTheme
}) {
  const [qrInfo, setQrInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(true);

  // Theme support (default: light)
  const [localTheme, setLocalTheme] = useState(() => {
    const saved = localStorage.getItem('qr_theme');
    const migrated = localStorage.getItem('qr_theme_default_light_v1');
    if (!migrated) {
      return 'light';
    }
    return saved || theme || 'light';
  });

  const activeTheme = onToggleTheme ? theme : localTheme;

  const handleToggleTheme = () => {
    if (onToggleTheme) {
      onToggleTheme();
    } else {
      const next = localTheme === 'dark' ? 'light' : 'dark';
      setLocalTheme(next);
      document.documentElement.setAttribute('data-theme', next);
      if (next === 'light') {
        document.body.classList.add('light-theme');
        document.body.classList.remove('dark-theme');
      } else {
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
      }
      localStorage.setItem('qr_theme', next);
    }
  };

  // Form fields
  const [phone, setPhone] = useState('');
  const [comments, setComments] = useState('');

  // Deduplication & Used Reviews Tracking (Ensures once a review is given, it is NEVER repeated to future customers)
  const [usedReviews, setUsedReviews] = useState(() => {
    try {
      const saved = localStorage.getItem(`used_reviews_${qrId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 2-Option Review Language state ('english' | 'tenglish'). Default: 'english'
  const [reviewLang, setReviewLang] = useState('english');
  const [isSwitchingTab, setIsSwitchingTab] = useState(false);

  // AI Suggestions & Google Gemini states
  const [suggestionOffset, setSuggestionOffset] = useState(0);
  const [selectedChip, setSelectedChip] = useState('');
  const [selectedSuggestion, setSelectedSuggestion] = useState('');
  const [isPolishing, setIsPolishing] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [geminiSuggestions, setGeminiSuggestions] = useState(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [showAiIdeas, setShowAiIdeas] = useState(false);
  const [aiSource, setAiSource] = useState('smart'); // 'gemini' | 'smart'
  const [aiNotice, setAiNotice] = useState('');

  // Client-side memoization cache: preserves fetched suggestions across language tabs
  const geminiMemoRef = useRef({});

  // Submission states
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [showNetworkPopup, setShowNetworkPopup] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
  const [submittedAtTime, setSubmittedAtTime] = useState('');
  const [googleTargetUrl, setGoogleTargetUrl] = useState('');
  const [reviewCopied, setReviewCopied] = useState(false);
  const [copied, setCopied] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(null);
  const [redirectCancelled, setRedirectCancelled] = useState(false);

  // Floating Toaster state: "Copied , Paste in Google Review"
  const [copyToast, setCopyToast] = useState({ show: false, message: '' });
  const copyToastTimeoutRef = useRef(null);

  const showCopyToast = (msg = 'Copied , Paste in Google Review') => {
    if (copyToastTimeoutRef.current) {
      clearTimeout(copyToastTimeoutRef.current);
    }
    setCopyToast({ show: true, message: msg });
    copyToastTimeoutRef.current = setTimeout(() => {
      setCopyToast({ show: false, message: '' });
    }, 2800);
  };

  useEffect(() => {
    return () => {
      if (copyToastTimeoutRef.current) {
        clearTimeout(copyToastTimeoutRef.current);
      }
    };
  }, []);

  // Smooth Redirection Countdown to Google Reviews
  useEffect(() => {
    if (!submitted || redirectCancelled || redirectCountdown === null) return;

    if (redirectCountdown <= 0) {
      if (googleTargetUrl) {
        window.location.href = googleTargetUrl;
      }
      return;
    }

    const timer = setTimeout(() => {
      setRedirectCountdown((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearTimeout(timer);
  }, [submitted, redirectCountdown, redirectCancelled, googleTargetUrl]);

  const handleCopyComment = async () => {
    if (!comments.trim()) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(comments.trim());
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = comments.trim();
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setReviewCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Copy to clipboard failed:', err);
    }
  };

  // Fetch business info linked to scanned QR
  const fetchTarget = async () => {
    setLoadingInfo(true);
    try {
      const res = await fetch(`${config.API_BASE_URL}/api/public/qr-info/${encodeURIComponent(qrId)}`);
      const data = await res.json();
      setQrInfo(data);

      // Non-blocking scan hit registration to guarantee count tracking
      try {
        const activeId = data.qrId || qrId;
        if (activeId) {
          fetch(`${config.API_BASE_URL}/api/public/scan-hit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ qrId: activeId, clientId: data.client?.id })
          }).catch(() => { });
        }
      } catch { }

      // Load used reviews to prevent any previously submitted review from repeating
      if (data.valid && data.isAssigned) {
        const serverUsed = Array.isArray(data.usedReviews) ? data.usedReviews : [];
        setUsedReviews((prev) => {
          const combined = [...new Set([...prev, ...serverUsed])];
          try {
            if (data.client?.id) {
              localStorage.setItem(`used_reviews_${data.client.id}`, JSON.stringify(combined));
            }
            localStorage.setItem(`used_reviews_${qrId}`, JSON.stringify(combined));
          } catch { }
          return combined;
        });
      }

      // Once the QR code is assigned, update the address bar URL to clean slug:
      // e.g. http://localhost:5173/varshas-kitchen
      if (data.valid && data.isAssigned && data.client) {
        const clientSlug = data.slug || data.client.slug || generateSlug(data.client.name);
        if (clientSlug && window.location.pathname !== `/${clientSlug}`) {
          window.history.replaceState(null, '', `/${clientSlug}`);
        }
      }
    } catch (err) {
      console.error('Error fetching QR target:', err);
      setQrInfo({
        valid: false,
        isAssigned: false,
        qrId,
        message: 'Unable to reach backend server',
        isNetworkError: true
      });
    } finally {
      setLoadingInfo(false);
    }
  };

  useEffect(() => {
    fetchTarget();
  }, [qrId]);

  // Proactively notify customer if mobile device goes completely offline
  useEffect(() => {
    const handleOffline = () => {
      setShowNetworkPopup(true);
    };
    window.addEventListener('offline', handleOffline);
    return () => window.removeEventListener('offline', handleOffline);
  }, []);

  const handlePhoneChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(digits);
  };

  const handlePhoneKeyDown = (e) => {
    if (
      ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key) ||
      ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x', 'z', 'A', 'C', 'V', 'X', 'Z'].includes(e.key))
    ) {
      return;
    }
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handlePhonePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    const digits = cleanPhoneNumber(pasted).slice(0, 10);
    setPhone(digits);
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const isMandatory = Boolean(qrInfo?.client?.isPhoneMandatory);
    const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
    if (isMandatory) {
      if (!cleanPhone) {
        setError('Please enter your 10-digit mobile number to proceed.');
        return;
      }
      if (cleanPhone.length !== 10) {
        setError('Please enter a valid 10-digit mobile number.');
        return;
      }
    } else {
      if (cleanPhone.length > 0 && cleanPhone.length !== 10) {
        setError('If providing a mobile number, it must be exactly 10 digits.');
        return;
      }
    }
    if (!comments.trim()) {
      setError('Please choose a review option to continue.');
      return;
    }

    setSubmitting(true);
    setError('');

    // Universal common logic: resolve Place ID and review destination
    const targetClient = qrInfo?.client || null;
    const resolvedPid = targetClient?.placeId || extractPlaceId(targetClient?.googleReviewUrl);
    let defaultGoogleUrl = '';

    if (resolvedPid) {
      defaultGoogleUrl = buildGoogleReviewUrl(resolvedPid);
    } else if (targetClient?.googleReviewUrl && targetClient.googleReviewUrl.trim()) {
      defaultGoogleUrl = targetClient.googleReviewUrl.trim();
      if (!/^https?:\/\//i.test(defaultGoogleUrl)) {
        defaultGoogleUrl = 'https://' + defaultGoogleUrl;
      }
    } else {
      const targetName = targetClient?.name || clientName || 'Business Partner';
      const targetAddress = targetClient?.businessLocation || targetClient?.address || clientLocation || clientAddress || '';
      defaultGoogleUrl = buildGoogleReviewUrl('', `${targetName} ${targetAddress}`.trim());
    }

    // 2. Copy comments to clipboard immediately in user click event
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(comments.trim());
        setReviewCopied(true);
        setCopied(true);
      }
    } catch (clipErr) {
      console.log('Clipboard copy notice:', clipErr);
    }

    try {
      const res = await fetch(`${config.API_BASE_URL}/api/public/submit-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrId: qrInfo?.qrId || qrId,
          phone: cleanPhone,
          comments: comments.trim()
        })
      });

      if (!res.ok) {
        let errData = {};
        try {
          errData = await res.json();
        } catch (_) { }
        if (res.status >= 500) {
          throw new Error('Server temporarily unavailable. Please retry or continue directly to Google.');
        }
        throw new Error(errData.error || 'Failed to submit review');
      }

      const data = await res.json();

      let finalGoogleUrl = data.googleReviewUrl || defaultGoogleUrl;
      if (finalGoogleUrl && !/^https?:\/\//i.test(finalGoogleUrl.trim())) {
        finalGoogleUrl = 'https://' + finalGoogleUrl.trim();
      }

      setGoogleTargetUrl(finalGoogleUrl);
      setSubmittedData(data.review);
      setSubmitted(true);
      setSubmittedAtTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

      // Record this review comment into usedReviews immediately so it is NEVER repeated
      const finalComment = comments.trim();
      setUsedReviews((prev) => {
        const next = [...new Set([...prev, finalComment])];
        try {
          const clientId = targetClient?.id || qrInfo?.client?.id || qrId;
          localStorage.setItem(`used_reviews_${clientId}`, JSON.stringify(next));
          localStorage.setItem(`used_reviews_${qrId}`, JSON.stringify(next));
        } catch { }
        return next;
      });

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (cErr) {
        // Confetti fallback
      }

      // 3. Initiate smooth redirection countdown to inform customer
      setRedirectCountdown(2);
      setRedirectCancelled(false);
    } catch (err) {
      console.error('Submit review error:', err);
      if (isNetworkFetchError(err)) {
        setShowNetworkPopup(true);
        setError(''); // Prevent showing ugly raw 'Failed to fetch.' inline
      } else {
        setError(err.message || 'Error recording review to store management');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Assigned client metadata & category resolution
  const client = qrInfo?.client || null;
  const isPhoneMandatory = Boolean(client?.isPhoneMandatory);
  const clientName = client?.name || 'Valued Business Partner';
  const clientLocation = client?.businessLocation || client?.address || '';
  const clientAddress = client?.address || clientLocation || 'Partner Location';
  const clientKeywords = client?.keywords || '';
  const rawCategory = client?.businessType || '';
  const activeCategoryKey = resolveCategory(rawCategory, clientName);
  const activeCategoryMeta = CATEGORY_DATA[activeCategoryKey] || CATEGORY_DATA['General Business'];

  // Robust fallback Google Review URL for this client
  const resolvedGoogleUrl = (() => {
    const targetClient = qrInfo?.client || null;
    const resolvedPid = targetClient?.placeId || extractPlaceId(targetClient?.googleReviewUrl);
    if (resolvedPid) {
      return buildGoogleReviewUrl(resolvedPid);
    }
    if (targetClient?.googleReviewUrl && targetClient.googleReviewUrl.trim()) {
      let u = targetClient.googleReviewUrl.trim();
      if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
      return u;
    }
    const targetName = targetClient?.name || clientName || 'Business Partner';
    const targetAddress = targetClient?.businessLocation || targetClient?.address || clientLocation || clientAddress || '';
    return buildGoogleReviewUrl('', `${targetName} ${targetAddress}`.trim());
  })();
  // Helper to randomly jumble/shuffle review suggestions
  const shuffleSuggestions = (arr) => {
    if (!Array.isArray(arr)) return [];
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  // 1. TENGLISH Fallbacks (Telugu words written in English letters, e.g. "Super ga undi!", "Project work super ga chesaru!")
  const getRawCategoryFallbacksTenglish = (categoryKey, name) => {
    switch (categoryKey) {
      case 'Healthcare & Clinic':
        return [
          `Doctors chala caring ga unnaru, clinic super ga undi!`,
          `Minimal waiting time and staff chala supportive ga matladaru.`,
          `Doctor garu chala patient ga explain chesaru. Best clinic at ${name}!`,
          `Treatment super ga undi, prompt medical service!`,
          `Very clean facility, nursing team chala polite ga unnaru.`,
          `Diagnostic service chala fast ga andindi. Highly recommended!`,
          `Transparent consultation fees and great care at ${name}!`,
          `Staff response super ga undi, felt very comfortable!`,
          `Spotless clinic, doctor advice chala helpful ga undi.`,
          `Very polite reception and doctors chala gentle ga chusaru.`,
          `Emergency service chala prompt ga icharu. Best hospital!`,
          `Treatment and care super ga undi, reasonable charges!`,
          `Doctors treatment super ga undi, family care ki best clinic!`,
          `Supportive nursing staff and hygienic wards. Super ga undi!`,
          `Consultation and medicine guidance chala clear ga icharu.`,
          `Great experience at ${name}. Doctors and staff super ga unnaru!`
        ];
      case 'Restaurant & Cafe':
        return [
          `Food super ga undi, ambiance kuda chala bagundi!`,
          `Quick service and dishes chala tasty ga unnayi at ${name}!`,
          `Hospitality super ga undi, staff chala courteous ga unnaru.`,
          `Delicious flavors and hygienic kitchen, quality super ga undi!`,
          `Family dinner ki perfect spot, seating chala comfortable ga undi.`,
          `Superb taste and reasonable prices, food super ga undi!`,
          `Starters and main course super ga unnayi at ${name}!`,
          `Quick order turnaround and dining experience chala bagundi!`,
          `Food presentation super ga undi, mocktails chala refreshing!`,
          `Clean tables and great service, highly recommend ${name}!`,
          `Every bite super ga undi, delicious recipes and polite staff!`,
          `Taste and quality super ga unnayi, weekend visit ki best restaurant!`,
          `Service speed and dining hospitality super ga undi at ${name}!`,
          `Biryani and special dishes super ga unnayi! Definitely worth it.`,
          `Cozy vibe, lovely music and food super ga undi!`,
          `Staff polite ga attend chesaru, food quality super ga undi!`
        ];
      case 'Hotel & Resort':
        return [
          `Rooms super ga unnayi, hospitality chala bagundi at ${name}!`,
          `Smooth check-in, staff chala helpful ga assist chesaru.`,
          `Peaceful stay and delicious breakfast, service super ga undi!`,
          `Comfortable beds and clean ambiance, stay chala bagundi!`,
          `Front desk team chala polite ga matladaru. Super ga undi!`,
          `Great location and maintenance super ga undi at ${name}!`,
          `Room service super ga undi, spotless bathrooms!`,
          `Very safe and relaxing stay, hospitality chala bagundi!`,
          `Housekeeping super ga undi, clean linens and peaceful sleep!`,
          `Check-in was hassle-free and amenities super ga unnayi!`,
          `Family vacation ki perfect hotel, experience super ga undi!`,
          `Prompt room service and delicious food, stay super ga undi!`
        ];
      case 'Retail & Shopping':
        return [
          `Collection super ga undi, staff chala helpful ga unnaru at ${name}!`,
          `Wide variety and reasonable prices, quality super ga undi!`,
          `Fast billing and store layout chala neat ga undi!`,
          `Trending collections super ga unnayi, best shopping experience!`,
          `Staff product details chala patient ga explain chesaru.`,
          `Great offers and discounts, shopping experience super ga undi!`,
          `Affordable prices and premium quality. Collection super ga undi!`,
          `Store ambiance super ga undi, ample variety of products!`,
          `Billing fast ga jarigindi, customer service super ga undi!`,
          `Authentic products and courteous staff at ${name}. Super ga undi!`,
          `Exchange and support policy chala smooth ga undi.`,
          `Best retail shopping destination, collection super ga undi!`
        ];
      case 'Salon & Spa':
        return [
          `Service super ga undi, stylist chala skilled ga unnaru!`,
          `Hair styling super ga undi, calming ambiance at ${name}!`,
          `Very hygienic tools, staff chala polite ga treat chesaru.`,
          `Skin treatment super ga undi, felt totally refreshed!`,
          `Relaxing massage and punctual service, super ga undi!`,
          `Top notch products and hospitality chala bagundi!`,
          `Pedicure and facial super ga chesaru, felt pampered!`,
          `Stylist recommendations chala helpful ga unnayi. Super ga undi!`,
          `Clean grooming stations and friendly staff at ${name}!`,
          `Punctual appointment and service super ga undi!`
        ];
      case 'Automotive & Garage':
        return [
          `Service super ga undi, mechanics chala skilled ga unnaru!`,
          `Honest diagnosis and timely delivery at ${name}. Super ga undi!`,
          `Vehicle performance super ga undi after servicing!`,
          `Transparent estimate, billing chala clear ga undi.`,
          `Car wash and interior vacuuming super ga chesaru!`,
          `Engine tuning super ga undi, vehicle runs like brand new!`,
          `Skilled technicians and reasonable charges. Super ga undi!`,
          `Electrical fault fast ga solve chesaru, prompt service!`,
          `Fair pricing and genuine spare parts. Service super ga undi!`,
          `Customer lounge clean ga undi, vehicle handover on time!`
        ];
      case 'Gym & Fitness Center':
        return [
          `Equipment super ga undi, trainers chala motivating ga unnaru!`,
          `Spacious workout floor and clean atmosphere, workout super ga undi!`,
          `Certified trainers posture chala patient ga guide chesaru.`,
          `Locker rooms clean ga unnayi, fitness energy super ga undi!`,
          `Best gym in the area, management super ga undi!`,
          `Cardio and strength machines super ga unnayi at ${name}!`,
          `Personal training guidance chala helpful ga undi. Super ga undi!`,
          `Hygienic workout floor and energetic music, super ga undi!`
        ];
      case 'Education & Coaching':
        return [
          `Teaching super ga undi, faculty chala dedicated ga unnaru!`,
          `Concept clarity and study material super ga undi at ${name}!`,
          `Mentors doubts chala patient ga clarify chesaru.`,
          `Regular tests and personal attention super ga unnayi!`,
          `Best coaching academy, guidance super ga undi!`,
          `Faculty explanations chala simple ga arthamayyayi. Super ga undi!`,
          `Classroom environment and academic focus super ga undi!`,
          `Mock exams boost confidence, teaching quality super ga undi!`
        ];
      default:
        return [
          `Project work super ga chesaru, staff response kuda chala bagundi!`,
          `Service super ga undi, staff chala polite ga unnaru!`,
          `Prompt response and timely work, experience super ga undi!`,
          `Customer support chala supportive ga matladaru at ${name}.`,
          `Hassle-free experience, quality super ga undi!`,
          `Very dependable team, work super ga chesaru!`,
          `Clear communication and fair pricing. Super ga undi!`,
          `Customer satisfaction ki top priority icharu. Super ga undi!`,
          `Prompt delivery and friendly team at ${name}!`
        ];
    }
  };

  // 2. TELUGU Fallbacks (All Telugu script comments including blended English words in Telugu script)
  const getRawCategoryFallbacksTelugu = (categoryKey, name) => {
    switch (categoryKey) {
      case 'Healthcare & Clinic':
        return [
          `Doctors చాలా caring గా ఉన్నారు, clinic super గా ఉంది!`,
          `Minimal waiting time and staff చాలా supportive గా మాట్లాడారు.`,
          `Doctor garu చాలా patient గా explain చేసారు. Best clinic at ${name}!`,
          `Treatment super గా ఉంది, prompt medical service!`,
          `Very clean facility, nursing team చాలా polite గా ఉన్నారు.`,
          `Diagnostic service చాలా fast గా అందింది. Highly recommended!`,
          `Transparent consultation fees and great care at ${name}!`,
          `వైద్యులు ఎంతో ఓపికగా మాట్లాడారు, క్లినిక్ చాలా బాగుంది!`,
          `శుభ్రమైన క్లినిక్ మరియు సిబ్బంది ఎంతో మర్యాదగా ఉన్నారు.`,
          `సకాలంలో చికిత్స అందించారు, ఫీజులు కూడా చాలా సరసమైనవి.`,
          `వైద్యుల సంరక్షణ మరియు అనుభవం చాలా బాగుంది. ధన్యవాదాలు ${name}!`,
          `అత్యుత్తమ వైద్య సేవలు, సిబ్బంది సహాయం ఎంతో బాగుంది.`,
          `పరీక్షల నివేదికలు త్వరగా ఇచ్చారు, శ్రద్ధగా పరిశీలించారు.`
        ];
      case 'Restaurant & Cafe':
        return [
          `Food super గా ఉంది, ambiance కూడా చాలా బాగుంది!`,
          `Quick service and dishes చాలా tasty గా ఉన్నాయి at ${name}!`,
          `Hospitality super గా ఉంది, staff చాలా courteous గా ఉన్నారు.`,
          `Delicious flavors and hygienic kitchen, quality super గా ఉంది!`,
          `Family dinner కి perfect spot, seating చాలా comfortable గా ఉంది.`,
          `Superb taste and reasonable prices, food super గా ఉంది!`,
          `Starters and main course super గా ఉన్నాయి at ${name}!`,
          `Quick order turnaround and dining experience చాలా బాగుంది!`,
          `భోజనం చాలా రుచిగా ఉంది, వాతావరణం ఎంతో ఆహ్లాదకరంగా ఉంది!`,
          `త్వరిత సేవలు మరియు ప్రతి వంటకం ఎంతో తాజా రుచితో ఉంది.`,
          `సిబ్బంది మర్యాద మరియు ఆతిథ్యం చాలా బాగుంది at ${name}!`,
          `కుటుంబంతో కలిసి రావడానికి ఎంతో అనుకూలమైన ప్రదేశం.`,
          `అద్భుతమైన రుచి మరియు సరసమైన ధరలు, తప్పక సందర్శించండి!`,
          `శుభ్రమైన వంటశాల మరియు నాణ్యమైన ఆహారం. 5 నక్షత్రాల అనుభవం!`
        ];
      case 'Hotel & Resort':
        return [
          `Rooms super గా ఉన్నాయి, hospitality చాలా బాగుంది at ${name}!`,
          `Smooth check-in, staff చాలా helpful గా assist చేసారు.`,
          `Peaceful stay and delicious breakfast, service super గా ఉంది!`,
          `Comfortable beds and clean ambiance, stay చాలా బాగుంది!`,
          `Front desk team చాలా polite గా మాట్లాడారు. Super గా ఉంది!`,
          `Great location and maintenance super గా ఉంది at ${name}!`,
          `Room service super గా ఉంది, spotless bathrooms!`,
          `గదులు చాలా శుభ్రంగా ఉన్నాయి, ఆతిథ్యం ఎంతో నచ్చింది!`,
          `ప్రశాంతమైన బస మరియు సిబ్బంది చాలా వేగంగా స్పందించారు.`,
          `రుచికరమైన అల్పాహారం మరియు సౌకర్యవంతమైన గదులు at ${name}.`,
          `చెక్-ఇన్ చాలా వేగంగా జరిగింది, అన్ని సౌకర్యాలు బాగున్నాయి.`
        ];
      case 'Retail & Shopping':
        return [
          `Collection super గా ఉంది, staff చాలా helpful గా ఉన్నారు at ${name}!`,
          `Wide variety and reasonable prices, quality super గా ఉంది!`,
          `Fast billing and store layout చాలా neat గా ఉంది!`,
          `Trending collections super గా ఉన్నాయి, best shopping experience!`,
          `Staff product details చాలా patient గా explain చేసారు.`,
          `Great offers and discounts, shopping experience super గా ఉంది!`,
          `మంచి కలెక్షన్ మరియు సిబ్బంది సహాయం ఎంతో బాగుంది!`,
          `నాణ్యమైన వస్తువులు మరియు సరసమైన ధరలు at ${name}.`,
          `వేగవంతమైన బిల్లింగ్ మరియు విస్తృతమైన ఎంపికలు ఉన్నాయి.`
        ];
      case 'Salon & Spa':
        return [
          `Service super గా ఉంది, stylist చాలా skilled గా ఉన్నారు!`,
          `Hair styling super గా ఉంది, calming ambiance at ${name}!`,
          `Very hygienic tools, staff చాలా polite గా treat చేసారు.`,
          `Skin treatment super గా ఉంది, felt totally refreshed!`,
          `Relaxing massage and punctual service, super గా ఉంది!`,
          `అనుభవజ్ఞులైన నిపుణులు మరియు ప్రశాంతమైన సేవలు!`,
          `హెయిర్ స్టైలింగ్ చాలా బాగుంది, శుభ్రతకు ప్రాధాన్యత ఇచ్చారు.`,
          `చాలా రిలాక్సింగ్ అనుభవం, సిబ్బంది ఎంతో మర్యాదగా ఉన్నారు.`
        ];
      case 'Automotive & Garage':
        return [
          `Service super గా ఉంది, mechanics చాలా skilled గా ఉన్నారు!`,
          `Honest diagnosis and timely delivery at ${name}. Super గా ఉంది!`,
          `Vehicle performance super గా ఉంది after servicing!`,
          `Transparent estimate, billing చాలా clear గా ఉంది.`,
          `Car wash and interior vacuuming super గా చేసారు!`,
          `సరైన నిర్ధారణ మరియు సమయానికి సర్వీస్ అందించారు!`,
          `నిపుణులైన మెకానిక్స్, నాణ్యమైన విడిభాగాలు ఉపయోగించారు.`
        ];
      case 'Gym & Fitness Center':
        return [
          `Equipment super గా ఉంది, trainers చాలా motivating గా ఉన్నారు!`,
          `Spacious workout floor and clean atmosphere, workout super గా ఉంది!`,
          `Certified trainers posture చాలా patient గా guide చేసారు.`,
          `Locker rooms clean గా ఉన్నాయి, fitness energy super గా ఉంది!`,
          `ఆధునిక పరికరాలు మరియు ప్రేరణనిచ్చే శిక్షకులు!`,
          `చాలా శుభ్రమైన వ్యాయామశాల, అనుభవజ్ఞులైన ట్రైనర్స్.`
        ];
      case 'Education & Coaching':
        return [
          `Teaching super గా ఉంది, faculty చాలా dedicated గా ఉన్నారు!`,
          `Concept clarity and study material super గా ఉంది at ${name}!`,
          `Mentors doubts చాలా patient గా clarify చేసారు.`,
          `Regular tests and personal attention super గా ఉన్నాయి!`,
          `అంకితభావం గల అధ్యాపకులు మరియు స్పష్టమైన బోధన!`,
          `విద్యార్థులపై ప్రత్యేక శ్రద్ధ, పరీక్షలకు అద్భుతమైన శిక్షణ.`
        ];
      default:
        return [
          `Project work super గా చేశారు, staff response కూడా చాలా బాగుంది!`,
          `Service super గా ఉంది, staff చాలా polite గా ఉన్నారు!`,
          `Prompt response and timely work, experience super గా ఉంది!`,
          `Customer support చాలా supportive గా మాట్లాడారు at ${name}.`,
          `Hassle-free experience, quality super గా ఉంది!`,
          `Very dependable team, work super గా చేసారు!`,
          `చాలా మంచి అనుభవం, సిబ్బంది ఎంతో మర్యాదగా ఉన్నారు!`,
          `సమయానికి పని పూర్తి చేశారు, నాణ్యత ఎంతో బాగుంది.`,
          `నమ్మకమైన సేవలు మరియు నిజాయితీతో కూడిన వ్యవహారాలు at ${name}.`,
          `సందేహాలు అన్నింటినీ ఓపికగా నివృత్తి చేశారు. చాలా సంతోషం!`
        ];
    }
  };

  // 3. PURE ENGLISH Fallbacks
  const getRawCategoryFallbacksEnglish = (categoryKey, name) => {
    switch (categoryKey) {
      case 'Healthcare & Clinic':
        return [
          `Great care and gentle doctors at ${name}, very polite staff!`,
          `Very clean clinic with minimal waiting time. The doctors explain everything with patience and care.`,
          `Truly thankful for the exceptional medical care at ${name}. Spotless facility and appointments run smoothly.`,
          `The doctors and staff are very supportive and listened patiently to all my health concerns.`,
          `Excellent diagnostic service and prompt reports. Highly recommend ${name} for family care!`,
          `Warm reception and very compassionate nursing team. Truly an outstanding clinic!`,
          `Modern medical equipment, sterile environment, and very transparent consultation fees.`,
          `Felt completely safe and well cared for. Best healthcare experience in the area!`,
          `Very reassuring consultation and quick appointment scheduling at ${name}.`,
          `Hygienic waiting lounge and the staff prioritizes patient comfort at every step.`,
          `The specialists here are knowledgeable, attentive, and very thorough in their diagnosis.`,
          `Minimal paperwork and very prompt attention from the nursing team at ${name}.`,
          `Doctors provide clear guidance and avoid unnecessary medical tests. Very honest practice.`,
          `Extremely organized clinic with spotless treatment rooms. Top notch medical care!`,
          `Compassionate staff who go above and beyond to make patients feel at ease.`,
          `Great follow-up care and clear explanation of all medications. Thank you ${name}!`,
          `Wonderful clinic with caring doctors and very helpful front desk staff.`,
          `Clean, calm environment and very gentle treatment. Highly recommended for children and seniors!`,
          `Emergency consultation handled with utmost speed and precision. Lifesaver!`,
          `Courteous reception, polite paramedical staff, and experienced doctors throughout.`,
          `One of the best clinics in the neighborhood with reasonable consultation charges.`,
          `Doctor listened to every symptom with genuine empathy. Feeling much better!`,
          `Transparent treatment plan and spotless hygiene maintained across all rooms.`,
          `Quick token system, minimal waiting time, and excellent bedside manners.`
        ];
      case 'Restaurant & Cafe':
        return [
          `Delicious food and cozy atmosphere at ${name}!`,
          `Quick service and fresh dishes every single time. The staff is courteous and attentive.`,
          `Had a wonderful dining experience at ${name}. Generous portions and lovely hospitality!`,
          `Loved the flavors and presentation of every dish. Will definitely be ordering again!`,
          `Great ambiance for dining with friends and family. The staff made us feel so welcome.`,
          `Superb taste, hygienic kitchen, and reasonable prices. Easily one of my favorite spots!`,
          `Every bite was flavorful and served piping hot. Excellent customer care from start to finish!`,
          `Amazing food options, delicious drinks, and comfortable seating. Highly recommend ${name}!`,
          `Authentic flavors and lovely presentation! Everything tasted exceptionally fresh.`,
          `The mocktails and appetizers at ${name} are truly unmatched. Great vibe overall!`,
          `Prompt service even during busy peak hours. Staff was courteous and always smiling.`,
          `Comfortable seating, pleasant background music, and delightful desserts!`,
          `Loved the hospitality and culinary excellence at ${name}. Perfect weekend dinner spot!`,
          `Clean dining tables, sanitized cutlery, and mouth-watering dishes. 5 stars!`,
          `Generous portion sizes and great value for money. Can't wait to visit again!`,
          `Staff was very accommodating with custom dietary preferences. Excellent hospitality!`,
          `The chef's special dishes here are outstanding. Highly recommended for food lovers!`,
          `Warm welcome at the door and quick order turnaround. Outstanding food quality!`,
          `Cosy aesthetic lighting and top-tier culinary flavors. Loved every minute at ${name}!`,
          `Piping hot food, delicious aromatic spices, and friendly service throughout.`,
          `Great place for family dinners and private celebrations. Very polite servers!`,
          `Exceptional culinary taste with fresh ingredients in every single bite.`,
          `Fast billing, reasonable prices, and fantastic hospitality at ${name}.`,
          `A hidden gem with flavorful recipes and a welcoming dining atmosphere!`
        ];
      case 'Hotel & Resort':
        return [
          `Spotless rooms and wonderful hospitality at ${name}!`,
          `Smooth check-in and peaceful stay throughout our visit. The staff was always helpful and accommodating.`,
          `Had an unforgettable stay at ${name}. The rooms were immaculate and the breakfast was delicious.`,
          `Comfortable beds, fast Wi-Fi, and courteous housekeeping. Perfect for a restful getaway!`,
          `Excellent location and peaceful atmosphere. Front desk team was polite and accommodating.`,
          `Peaceful atmosphere with clean amenities and great room service. Highly recommended!`,
          `Great value for money with pristine amenities and very well-maintained premises.`,
          `From warm welcome to hassle-free checkout, our stay at ${name} was wonderful!`,
          `Spacious rooms with modern interior fittings and scenic views. Loved our time here!`,
          `Buffet breakfast spread was lavish and delicious. Attentive dining staff as well.`,
          `Housekeeping staff ensured everything remained spotless and replenished daily.`,
          `Very safe and secure premises with 24/7 polite front desk assistance.`,
          `Convenient parking and central location close to key city attractions.`,
          `Crisp bed linens, quiet air conditioning, and top quality room amenities.`,
          `Check-in was completed in under two minutes with a refreshing welcome drink!`,
          `Peaceful resort vibe with well-manicured gardens and relaxing pool area.`,
          `Courteous bellhop and concierge who gave great local sightseeing recommendations.`,
          `Ideal hotel for both business travelers and relaxing family vacations.`,
          `Very accommodating management who assisted with our late checkout request.`,
          `Spotless bathrooms with hot water and premium toiletries at ${name}.`,
          `Calm and luxurious ambiance throughout the property. Exceeded our expectations!`,
          `Loved the prompt room service and delicious late-night snacks.`,
          `Top-notch hospitality standards and immaculate cleanliness everywhere!`,
          `A truly memorable stay with warm staff and luxurious comforts at ${name}.`
        ];
      case 'Retail & Shopping':
        return [
          `Great collection and very helpful staff at ${name}!`,
          `Wide variety of quality products with transparent pricing. Fast billing and polite customer support.`,
          `Always a pleasure shopping at ${name}. Trendy collections and a very neat store layout!`,
          `Found exactly what I was looking for at great prices. The store associates were so helpful.`,
          `Well-organized aisles and fresh inventory. Seamless shopping experience every visit!`,
          `High quality merchandise and prompt billing counter service. Loved shopping here!`,
          `Courteous staff who guide you without any pushiness. Best retail store in town!`,
          `Fantastic discount offers and premium quality items. Definitely coming back for more!`,
          `Neat displays and wide selection across all price ranges at ${name}.`,
          `Store associates helped me pick the right size with a lot of patience.`,
          `Speedy checkout counter with multiple payment options. No long queues!`,
          `Authentic branded products with clear return and exchange policies.`,
          `Fresh arrivals every season with great variety in designs and colors.`,
          `Air-conditioned store with spacious trial rooms and courteous attendants.`,
          `Great festive discounts and genuine quality assurance on all merchandise.`,
          `Staff greeted us warmly and answered all product queries patiently.`,
          `Found premium quality products at very reasonable and competitive prices.`,
          `Clean, well-lit store floor that makes browsing products a pleasure.`,
          `Convenient store location with ample parking and polite security staff.`,
          `Very helpful manager who resolved an exchange query in seconds.`,
          `Outstanding customer service and wide selection of latest designs at ${name}.`,
          `Best shopping destination in town for quality and affordability!`,
          `Neat packaging and pleasant shopping atmosphere from start to finish.`,
          `Consistent high quality and polite staff every time I visit ${name}!`
        ];
      case 'Salon & Spa':
        return [
          `Skilled professionals and relaxing service at ${name}!`,
          `Punctual appointments with top-grade hygiene standards. The stylists listen attentively to what you want.`,
          `Left ${name} feeling refreshed and rejuvenated. Calming ambiance and high-end products!`,
          `Expert hair styling and very attentive personal care. Absolutely love my new look!`,
          `Soothing vibe, spotless stations, and very polite therapists. Worth every penny!`,
          `Top-notch skincare treatment and relaxing massage. Felt completely pampered!`,
          `Friendly team who take time to understand your style preferences before starting.`,
          `Consistently five-star service and warm hospitality. Highly recommend visiting ${name}!`,
          `Sanitized tools and disposable towels used for every service. Very hygienic!`,
          `Relaxing aroma and peaceful ambiance that immediately melts away stress.`,
          `The stylist gave wonderful hair care tips tailored to my hair type.`,
          `Painless waxing and precision facial treatment by experienced estheticians.`,
          `Appointments run on time with no unnecessary waiting in the lounge.`,
          `High-end branded hair and skin products used with transparent pricing.`,
          `Loved the foot massage and pedicure at ${name}. Pure relaxation!`,
          `Stylists are creative and really know the latest hair color trends.`,
          `Warm herbal tea and polite reception staff. Truly luxury salon experience!`,
          `Gentle scalp massage and refreshing hair spa. Hair feels so soft and healthy!`,
          `Spotless mirrors, clean styling chairs, and friendly staff throughout.`,
          `Very reasonable grooming packages with top notch finishing touches.`,
          `The facial treatment gave my skin an amazing natural glow. Thank you ${name}!`,
          `Polite therapists who check on your comfort level throughout the session.`,
          `Exceeded all expectations with flawless hair styling and manicure!`,
          `My go-to salon for all grooming needs. Professional and courteous team!`
        ];
      case 'Automotive & Garage':
        return [
          `Honest diagnosis and timely service at ${name}!`,
          `Skilled mechanics with fair estimates and transparent billing. Delivered my vehicle right on schedule.`,
          `Extremely dependable service center at ${name}. Used genuine parts and car runs like new!`,
          `Clear explanation of necessary repairs without any hidden charges. Truly trustworthy team.`,
          `Prompt turnaround time and courteous customer care. Vehicle feels completely refreshed.`,
          `Professional diagnostic tools, clean workshop, and polite service advisors.`,
          `Great attention to detail during routine maintenance and oil service. Highly satisfied!`,
          `Best garage experience I've had. Fair rates, genuine advice, and top quality workmanship.`,
          `Fixed a persistent suspension issue that other garages could not solve. Brilliant mechanics!`,
          `Clean customer lounge with Wi-Fi while waiting for periodic car service.`,
          `Itemized service bill with old replaced parts shown transparently.`,
          `Car was delivered thoroughly washed, vacuumed, and polished. Looks brand new!`,
          `Engine runs smoother and fuel economy improved noticeably after servicing at ${name}.`,
          `Fast puncture and wheel alignment service with modern computer calibration.`,
          `Honest mechanics who didn't push unnecessary part replacements. Very ethical!`,
          `Quick brake inspection and safe test drive before vehicle handover.`,
          `Towing and emergency breakdown assistance was fast and reassuring.`,
          `Dependable electrical fault diagnosis and prompt wiring fix.`,
          `Fair quotation shared upfront before starting any major repair work.`,
          `Experienced mechanics who treat your vehicle with utmost care and respect.`,
          `AC cooling repaired efficiently with genuine refrigerant gas refilled.`,
          `Service advisor kept me updated via WhatsApp throughout the maintenance process.`,
          `Highly trustworthy automobile service workshop in the area. 5 stars!`,
          `Smooth vehicle handover with spotless cleaning and timely delivery.`
        ];
      case 'Gym & Fitness Center':
        return [
          `Modern equipment and motivating environment at ${name}!`,
          `Spacious workout floor with attentive certified trainers. Clean locker rooms and great workout energy.`,
          `Best fitness facility in the area at ${name}. Modern machines and supportive community vibe!`,
          `Trainers provide personalized guidance on form and workouts. Seeing great results!`,
          `Very hygienic workout area with well-maintained free weights and cardio equipment.`,
          `Inspiring playlist, positive fitness crowd, and encouraging trainers every single day.`,
          `Great variety of workout zones and classes. Always look forward to my sessions here!`,
          `Exceptional gym management, clean showers, and excellent personal coaching staff!`,
          `Spacious crossfit area and high quality branded dumbells and barbells.`,
          `Trainers correct your posture patiently to prevent workout injuries.`,
          `Sanitized benches and wiping stations readily available across the gym floor.`,
          `Airy ventilation and cool temperature maintained even during peak morning hours.`,
          `Diet and nutritional guidance provided alongside structured workout charts.`,
          `Very polite front desk and convenient operational hours from early morning to night.`,
          `Great energetic group workout batches including Zumba and HIIT sessions.`,
          `Machines are oiled and maintained regularly with zero squeaks or downtime.`,
          `Clean water dispensers and safe lockers with biometric access control.`,
          `Supportive gym members and motivating community vibe for beginners!`,
          `Personal training sessions are goal-oriented and have helped me transform my fitness.`,
          `Plenty of cardio treadmills and ellipticals so there is never any waiting queue.`,
          `Best investment for fitness and health. Highly recommend joining ${name}!`,
          `Knowledgeable trainers who motivate you to push your limits safely.`,
          `Clean changing rooms, hot showers, and hygienic steam bath facilities.`,
          `Energetic atmosphere that makes working out an enjoyable daily habit!`
        ];
      case 'Education & Coaching':
        return [
          `Dedicated teachers and personal attention at ${name}!`,
          `Structured curriculum with clear concept clarity. The mentors are encouraging and clarify doubts patiently.`,
          `Outstanding learning academy at ${name}. Excellent faculty and well-planned study materials.`,
          `Student-friendly environment where teachers go the extra mile to build confidence.`,
          `Interactive classes with regular progress assessments that keep students on track.`,
          `Very professional faculty and focused guidance for exam preparations. Highly recommended!`,
          `Doubt clearing sessions are thorough and motivating. Great improvement in test scores!`,
          `Inspiring teachers who make complex topics easy and fun to learn. Excellent institute!`,
          `Well-researched study modules and periodic mock tests that boost exam confidence.`,
          `Small batch sizes ensure every student gets individual attention and feedback.`,
          `Parents are kept informed about academic progress and attendance regularly.`,
          `Air-conditioned classrooms with smart projectors and comfortable seating.`,
          `Teachers simplify difficult mathematical and scientific concepts effortlessly.`,
          `Encouraging mentors who focus on conceptual depth rather than rote memorization.`,
          `Great library facility and quiet reading room for focused self-study.`,
          `Career counseling and interview preparation workshops were immensely helpful.`,
          `Polite administrative team who assist with study schedules and test series.`,
          `Significant improvement in marks and subject confidence within a few months!`,
          `Regular doubt-solving desks available after regular lectures. Very helpful!`,
          `Motivational atmosphere that inspires students to achieve their academic goals.`,
          `Experienced teaching faculty with proven track records of top rankers.`,
          `Very disciplined yet caring educational environment at ${name}.`,
          `Affordable fee structure with high quality academic mentoring.`,
          `The best coaching academy for competitive exam preparation in the city!`
        ];
      default:
        return [
          `Great experience at ${name}, very polite and helpful staff!`,
          `Prompt response and high-quality service from start to finish. The team is professional and reliable.`,
          `Thoroughly impressed by the dedication and professionalism at ${name}. Outstanding results!`,
          `Smooth communication, transparent pricing, and timely delivery of service. Highly recommend!`,
          `The team goes above and beyond to ensure customer satisfaction. Very pleased!`,
          `Courteous, knowledgeable staff and top-tier professionalism throughout.`,
          `Hassle-free experience with quick turnaround. Will definitely be a returning customer!`,
          `Consistently reliable and friendly customer care. Exceeded all my expectations!`,
          `Very trustworthy business with transparent dealings and honest communication.`,
          `Prompt customer support that addressed all my questions with utmost patience.`,
          `Clean, well-maintained premises and polite greeting right at the entrance.`,
          `High standards of professionalism and very organized service delivery at ${name}.`,
          `Delivered on their promises with zero delays or hidden fees. Very impressed!`,
          `Helpful team who explained every detail clearly before proceeding.`,
          `Extremely satisfied with the overall experience and quality of assistance.`,
          `Smooth, professional, and efficient service. Highly recommend to everyone!`,
          `Always a pleasure dealing with ${name}. Reliable, prompt, and courteous.`,
          `Very accommodating management who made our requirements their top priority.`,
          `Exceptional attention to customer needs and flawless execution throughout.`,
          `Fair pricing, top quality results, and friendly staff every single time.`,
          `Quick turnaround time without compromising on quality or craftsmanship.`,
          `The staff treats customers with great respect and genuine warmth.`,
          `One of the most dependable businesses in town. Will definitely visit again!`,
          `Professionalism at its finest. Thank you ${name} for a great experience!`
        ];
    }
  };

  // Curated 4-liner review generator (guarantees the 2nd suggestion is strictly a detailed 4-liner review)
  const getCuratedFourLiner = (categoryKey, name, lang = 'english') => {
    if (lang === 'telugu') {
      switch (categoryKey) {
        case 'Restaurant & Cafe':
          return `${name} లో భోజనం చాలా అద్భుతంగా ఉంది. ప్రతి వంటకం ఎంతో తాజా రుచితో మరియు పరిశుభ్రంగా వడ్డించారు. సిబ్బంది ఆతిథ్యం మరియు వాతావరణం ఎంతో ఆహ్లాదకరంగా అనిపించాయి. కుటుంబంతో కలిసి రావడానికి ఇది అత్యుత్తమ రెస్టారెంట్!`;
        case 'Healthcare & Clinic':
          return `${name} లో వైద్య సేవలు ఎంతో సంతృప్తికరంగా ఉన్నాయి. వైద్యులు సమస్యను శ్రద్ధగా విని ఎంతో ఓపికగా పరిష్కారం వివరించారు. క్లినిక్ చాలా శుభ్రంగా ఉంది మరియు సిబ్బంది ఎంతో సహాయకారిగా ఉన్నారు. ఉత్తమ వైద్య సంరక్షణ కోసం తప్పక సిఫార్సు చేస్తున్నాను!`;
        case 'Hotel & Resort':
          return `${name} లో మా బస ఎంతో ప్రశాంతంగా మరియు ఆహ్లాదకరంగా గడిచింది. గదులు చాలా విశాలంగా, శుభ్రంగా మరియు అన్ని సౌకర్యాలతో ఉన్నాయి. సిబ్బంది ఎంతో మర్యాదగా మాట్లాడి ప్రతి విషయంలో వేగంగా స్పందించారు. తప్పకుండా మళ్లీ ఇక్కడే బస చేస్తాము!`;
        case 'Retail & Shopping':
          return `${name} లో షాపింగ్ అనుభవం చాలా బాగుంది. ఇక్కడ ఎన్నో రకాల తాజా కలెక్షన్స్ మరియు నాణ్యమైన వస్తువులు అందుబాటులో ఉన్నాయి. సిబ్బంది ప్రతి వస్తువు గురించి ఎంతో ఓపికగా వివరించారు. ధరలు కూడా చాలా సరసమైనవిగా ఉన్నాయి!`;
        case 'Salon & Spa':
          return `${name} లో సర్వీస్ ఎంతో అద్భుతంగా ఉంది. నిపుణులైన స్టైలిస్ట్స్ మన అభిరుచికి తగినట్లుగా చాలా శ్రద్ధగా పనిచేశారు. ఇక్కడి పరిశుభ్రత మరియు ప్రశాంతమైన వాతావరణం ఎంతో నచ్చాయి. సరికొత్త లుక్ తో చాలా సంతోషంగా అనిపిస్తోంది!`;
        case 'Automotive & Garage':
          return `${name} లో వాహనం సర్వీస్ చాలా నమ్మకంగా చేశారు. మెకానిక్స్ సమస్యను త్వరగా గుర్తించి పారదర్శకమైన బిల్లింగ్ అందించారు. సమయానికి వాహనాన్ని వాష్ చేసి కొత్తదానిలా డెలివరీ చేశారు. నిజాయితీ గల సర్వీస్ సెంటర్!`;
        case 'Gym & Fitness Center':
          return `${name} లో వ్యాయామం చేయడం ఎంతో ఉత్సాహాన్ని ఇస్తుంది. ఆధునిక పరికరాలు మరియు సర్టిఫైడ్ ట్రైనర్స్ ఎంతో మంచి గైడెన్స్ ఇస్తున్నారు. పరిశుభ్రత మరియు సౌకర్యాలు చాలా ఉన్నతంగా ఉన్నాయి. ఫిట్‌నెస్ లక్ష్యాలు సాధించడానికి ఇది సరైన ప్రదేశం!`;
        case 'Education & Coaching':
          return `${name} లో విద్యా బోధన ఎంతో ప్రమాణాలతో కూడుకుని ఉంది. అధ్యాపకులు ప్రతి విషయాన్ని ఎంతో స్పష్టంగా అర్థమయ్యేలా బోధిస్తున్నారు. క్రమం తప్పకుండా పరీక్షలు నిర్వహిస్తూ విద్యార్థుల్లో విశ్వాసాన్ని పెంచుతున్నారు. అత్యుత్తమ కోచింగ్ అకాడమీ!`;
        default:
          return `Project work super గా చేశారు, staff response కూడా చాలా బాగుంది. ఇచ్చిన మాట ప్రకారం సమయానికి పని పూర్తి చేశారు. నాణ్యత మరియు సహకారం రెండూ ఎంతో సంతృప్తికరంగా ఉన్నాయి. మంచి సర్వీస్ కోరుకునే ప్రతి ఒక్కరికీ ${name} ని తప్పక సిఫార్సు చేస్తున్నాను!`;
      }
    }

    if (lang === 'tenglish') {
      switch (categoryKey) {
        case 'Restaurant & Cafe':
          return `Food super ga undi, ambiance kuda chala bagundi at ${name}. Starters and main course rendu fresh ga, delicious taste tho icharu. Staff hospitality chala courteous ga undi, order fast ga vachindi. Family dinner ki perfect spot, definitely recommend chestanu!`;
        case 'Healthcare & Clinic':
          return `${name} lo consultation experience chala bagundi. Doctor garu problem chala patient ga vini clear ga explain chesaru. Clinic premises spotless ga maintain chesaru with minimal waiting time. Best medical care in the area, highly recommended!`;
        case 'Hotel & Resort':
          return `Our stay at ${name} was peaceful and very comfortable. Rooms chala clean ga, spacious ga modern amenities tho unnayi. Front desk staff chala polite ga receive chesukuni fast check-in chesaru. Great hospitality and definitely will visit again!`;
        case 'Retail & Shopping':
          return `${name} lo shopping experience chala bagundi. Latest trending collections and genuine quality products available ga unnayi. Staff associates product details chala patient ga explain chesaru. Billing fast ga jarigindi with very reasonable prices!`;
        case 'Salon & Spa':
          return `${name} lo styling and grooming session super ga undi. Stylists chala skilled ga unnaru and exactly manam korukunnate chesaru. High-grade hygienic tools and top products use chesaru. Very relaxing experience, felt totally refreshed!`;
        case 'Automotive & Garage':
          return `${name} lo vehicle servicing chala professional ga chesaru. Mechanics accurate diagnosis chesi upfront estimate icharu. Car performance super ga undi and right on time deliver chesaru. Highly dependable garage with fair charges!`;
        case 'Gym & Fitness Center':
          return `Best gym in the area with modern machines and great workout vibe. Trainers personal attention tho exercise posture chala patient ga guide chestaru. Locker rooms clean ga unnayi and fitness atmosphere super ga undi. Highly recommend joining ${name}!`;
        case 'Education & Coaching':
          return `${name} lo coaching and guidance super ga undi. Faculty concepts chala simple ga explain chesi doubts patient ga clarify chestaru. Study material and regular tests exams ki full confidence istayi. Best academy for academic success!`;
        default:
          return `Project work super ga chesaru, staff response kuda chala bagundi. Timely delivery chesi clear communication maintain chesaru. Quality and service standards rendu top-notch ga unnayi. Anyone looking for reliable work, definitely recommend ${name}!`;
      }
    }

    // Default: 'english'
    switch (categoryKey) {
      case 'Restaurant & Cafe':
        return `Had an unforgettable dining experience at ${name}. The dishes were freshly prepared with authentic flavors and generous portion sizes. The staff was incredibly attentive and the ambiance was warm and inviting. Highly recommend visiting with friends and family!`;
      case 'Healthcare & Clinic':
        return `Visited ${name} for consultation and had an exceptional experience. The doctors listened patiently, explained everything clearly, and made me feel completely at ease. The clinic premises are spotless with minimal waiting time. Truly grateful for the wonderful medical care!`;
      case 'Hotel & Resort':
        return `Our stay at ${name} was comfortable and thoroughly relaxing. The rooms were spacious, spotless, and equipped with all modern amenities. The front desk staff was polite, welcoming, and assisted with every request promptly. Will definitely choose to stay here again!`;
      case 'Retail & Shopping':
        return `Always a pleasure shopping at ${name}. They have an incredible variety of trendy collections and authentic quality products. The store associates were courteous and helped me find exactly what I needed. Checkout was fast with very transparent pricing!`;
      case 'Salon & Spa':
        return `Had a wonderful grooming session at ${name} today. The stylists are highly skilled, patient, and understand your preferences perfectly. Top-grade hygienic tools and premium products were used throughout. Left feeling completely refreshed and rejuvenated!`;
      case 'Automotive & Garage':
        return `Exceptional vehicle service and maintenance at ${name}. The mechanics diagnosed the issue accurately and shared a transparent cost estimate upfront. My vehicle was delivered right on schedule and runs like brand new. Highly dependable garage with fair rates!`;
      case 'Gym & Fitness Center':
        return `Best fitness facility in the area with modern equipment and great energy. The certified trainers guide you with personal attention and ensure proper workout form. Locker rooms and workout floors are cleaned constantly. Seeing great results and highly recommend joining ${name}!`;
      case 'Education & Coaching':
        return `Outstanding learning academy with dedicated and knowledgeable faculty at ${name}. Concepts are taught with great clarity and doubt-clearing sessions are very thorough. The study materials and regular mock assessments keep students confident. Truly the best coaching institute!`;
      default:
        return `Had a truly wonderful experience dealing with ${name}. The entire team was professional, courteous, and prompt in addressing all queries. The quality of work delivered was flawless and right on schedule. Highly recommended to anyone looking for reliable and trustworthy service!`;
    }
  };

  const getRawCategoryFallbacks = (categoryKey, name, lang = 'english') => {
    if (lang === 'english') return getRawCategoryFallbacksEnglish(categoryKey, name);
    if (lang === 'telugu') return getRawCategoryFallbacksTelugu(categoryKey, name);
    return getRawCategoryFallbacksTenglish(categoryKey, name);
  };

  const getCategoryFallbacks = (categoryKey, name, keywords = '', lang = 'english') => {
    const base = getRawCategoryFallbacks(categoryKey, name, lang);
    const kwList = (keywords || '').split(',').map(k => k.trim()).filter(Boolean);
    const copy = [...base];
    if (kwList.length > 0) {
      if (lang === 'english') {
        copy.unshift(`Great experience at ${name}, especially loved the ${kwList[0]}! Wonderful service and courteous team.`);
      } else {
        copy.unshift(`${name} lo ${kwList[0]} super ga undi! Service chala bagundi.`);
      }
    }
    if (kwList.length > 1) {
      if (lang === 'english') {
        copy.unshift(`Highly impressed by the ${kwList[1]} and warm hospitality at ${name}. Will definitely be returning!`);
      } else {
        copy.unshift(`${kwList[1]} quality super ga undi at ${name}. Definitely recommend chestanu!`);
      }
    }
    return copy;
  };

  const [shuffledFallbacks, setShuffledFallbacks] = useState(() => {
    return shuffleSuggestions(getCategoryFallbacks(activeCategoryKey, clientName, clientKeywords, 'english'));
  });

  useEffect(() => {
    setShuffledFallbacks(shuffleSuggestions(getCategoryFallbacks(activeCategoryKey, clientName, clientKeywords, reviewLang)));
  }, [activeCategoryKey, clientName, clientKeywords, reviewLang]);

  // Compute strictly un-used review suggestions (prevents any submitted review from repeating)
  const freshGemini = (geminiSuggestions || []).filter(item => !isReviewUsed(item, usedReviews));
  const freshFallbacks = (shuffledFallbacks || []).filter(item => !isReviewUsed(item, usedReviews));

  const candidatePool = [];
  const seenNorm = new Set();

  for (const item of [...freshGemini, ...freshFallbacks]) {
    const norm = normalizeReviewText(item);
    if (!norm || seenNorm.has(norm) || isReviewUsed(item, usedReviews)) continue;
    seenNorm.add(norm);
    candidatePool.push(item);
    if (candidatePool.length >= 8) break;
  }

  // Fallback safety: If many options were already used, generate fresh dynamic variants in current language
  if (candidatePool.length < 8) {
    let dynamicFillers = [];
    if (reviewLang === 'english') {
      dynamicFillers = [
        `Delighted with the service and attention to detail at ${clientName}. Truly wonderful!`,
        `Very polite staff and prompt assistance at ${clientName}. Exceeded my expectations!`,
        `Had a fantastic experience at ${clientName}. Will definitely recommend to everyone!`,
        `Consistent quality and wonderful customer hospitality at ${clientName}. 5 stars!`,
        `Smooth, hassle-free and very dependable service at ${clientName}!`,
        `Loved how courteous and attentive the entire team was at ${clientName}.`,
        `Top-notch standards and very pleasant atmosphere at ${clientName}!`,
        `Super clean premises and highly skilled team at ${clientName}. Highly recommended!`
      ];
    } else {
      dynamicFillers = [
        `${clientName} lo service super ga undi! Very polite staff.`,
        `Project work super ga chesaru, staff response kuda chala bagundi!`,
        `Quality and hospitality super ga unnayi at ${clientName}!`,
        `${clientName} experience chala bagundi, definitely recommend chestanu!`,
        `Quick response and staff chala helpful ga unnaru. Super ga undi!`,
        `Very clean premises and timely work. Service super ga undi!`,
        `Loved the customer care at ${clientName}. 5 stars!`,
        `Reasonable prices and great quality. Super ga undi!`
      ];
    }

    for (const extra of dynamicFillers) {
      const norm = normalizeReviewText(extra);
      if (!seenNorm.has(norm) && !isReviewUsed(extra, usedReviews)) {
        seenNorm.add(norm);
        candidatePool.push(extra);
        if (candidatePool.length >= 8) break;
      }
    }
  }

  // Strictly guarantee that the 2nd suggestion option (index 1) is a comprehensive 4-liner review
  const curatedFourLiner = getCuratedFourLiner(activeCategoryKey, clientName, reviewLang);
  if (candidatePool.length >= 2) {
    candidatePool[1] = curatedFourLiner;
  } else if (candidatePool.length === 1) {
    candidatePool.push(curatedFourLiner);
  }

  const displayedSuggestions = candidatePool.slice(0, 8);
  const copyTextToClipboard = async (text) => {
    if (!text || !text.trim()) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text.trim());
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text.trim();
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setReviewCopied(true);
    } catch (err) {
      console.warn('Clipboard write notice:', err);
    }
  };

  const handleSelectSuggestion = async (item) => {
    setSelectedSuggestion(item);
    setSelectedChip(item);
    setComments(item);
    setError('');
    await copyTextToClipboard(item);
    showCopyToast('Copied , Paste in Google Review');
  };

  const handleGenerateGeminiSuggestions = async (targetLang = reviewLang) => {
    // 1. Client-Side Memoization Check:
    // If we already fetched suggestions for this language in this session, re-use instantly!
    const memoized = geminiMemoRef.current[targetLang];
    if (Array.isArray(memoized) && memoized.length > 0) {
      const freshUnused = memoized.filter(item => !isReviewUsed(item, usedReviews));
      if (freshUnused.length >= 4) {
        setGeminiSuggestions(freshUnused);
        setAiSource('gemini');
        return; // Zero network latency, instant tab switch!
      }
    }

    setIsGeneratingAi(true);
    setAiNotice(
      targetLang === 'english'
        ? 'Generating English review options...'
        : 'Generating Tenglish review options...'
    );
    try {
      const res = await fetch(`${config.API_BASE_URL}/api/public/ai/suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: clientName,
          businessType: activeCategoryMeta.categoryLabel || rawCategory,
          keywords: clientKeywords,
          clientId: client?.id,
          qrId: qrInfo?.qrId || qrId,
          excludeReviews: usedReviews,
          language: targetLang
        })
      });
      const data = await res.json();
      if (data?.suggestions && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
        const freshUnused = data.suggestions.filter(item => !isReviewUsed(item, usedReviews));
        // Save to client-side memoization cache
        geminiMemoRef.current[targetLang] = data.suggestions;
        setGeminiSuggestions(freshUnused);
        setAiSource('gemini');
        setAiNotice('✨ Fresh review suggestions ready');
      } else {
        setGeminiSuggestions([]);
      }
    } catch (err) {
      console.warn('Gemini AI suggestions error:', err);
      setGeminiSuggestions([]);
    } finally {
      setIsGeneratingAi(false);
      setTimeout(() => setAiNotice(''), 3000);
    }
  };

  const handleLanguageSelect = (newLang) => {
    if (newLang === reviewLang) return;
    setReviewLang(newLang);
    setComments('');
    setSelectedSuggestion('');
    setSelectedChip('');
    setIsSwitchingTab(true);

    // Provide crisp shimmer transition during tab change
    setTimeout(() => {
      setShuffledFallbacks(shuffleSuggestions(getCategoryFallbacks(activeCategoryKey, clientName, clientKeywords, newLang)));
      setIsSwitchingTab(false);
    }, 380);

    handleGenerateGeminiSuggestions(newLang);
  };

  // Auto-generate Google Gemini AI suggestions when client info is ready
  useEffect(() => {
    if (qrInfo?.valid && qrInfo?.isAssigned && clientName) {
      handleGenerateGeminiSuggestions(reviewLang);
    }
  }, [qrInfo?.isAssigned, clientName]);

  const handleShuffle = () => {
    setIsShuffling(true);
    setShuffledFallbacks(shuffleSuggestions(getCategoryFallbacks(activeCategoryKey, clientName, clientKeywords)));
    handleGenerateGeminiSuggestions();
    setTimeout(() => setIsShuffling(false), 300);
  };

  const handlePolishWithGemini = async () => {
    if (!comments.trim()) return;
    setIsPolishing(true);
    setAiNotice('Polishing your thoughts with Google Gemini AI...');
    try {
      const res = await fetch(`${config.API_BASE_URL}/api/public/ai/polish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: comments.trim(),
          businessName: clientName,
          businessType: activeCategoryMeta.categoryLabel || rawCategory,
          language: reviewLang
        })
      });
      const data = await res.json();
      if (data?.polished) {
        setComments(data.polished);
        setAiSource('gemini');
        setAiNotice('✨ Polished into fluent review by Google Gemini AI!');
      } else {
        setAiNotice('Could not polish with Gemini AI. Please try again.');
      }
    } catch (err) {
      console.warn('Gemini polish error:', err);
      setAiNotice('AI polish request timed out. Please try again.');
    } finally {
      setIsPolishing(false);
      setTimeout(() => setAiNotice(''), 3500);
    }
  };

  // Mask phone for receipt
  const formatMaskedPhone = (num) => {
    if (!num || num.length < 10) return num;
    return `+91 ${num.slice(0, 2)}••••••${num.slice(8)}`;
  };

  // Loading skeleton screen
  if (loadingInfo) {
    return (
      <div className="customer-page-wrapper">
        <CustomerReviewShimmer />
        <Footer />
      </div>
    );
  }

  // =========================================================================
  // NETWORK ERROR SCREEN: When connection to server fails on initial load
  // =========================================================================
  if (qrInfo?.isNetworkError) {
    return (
      <div className="customer-page-wrapper">
        <div className="customer-card fade-in">
          <div className="customer-top-bar">
            <div className="customer-form-title-group">
              <WifiOff size={15} style={{ color: '#EF4444' }} />
              <span className="customer-form-heading">Connection Interrupted</span>
            </div>

            <button
              type="button"
              className="btn-mode-corner"
              onClick={handleToggleTheme}
              title={activeTheme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              id="btn-customer-offline-theme"
              aria-label="Toggle Theme"
            >
              {activeTheme === 'dark' ? <Sun size={15} style={{ color: '#FBBF24' }} /> : <Moon size={15} style={{ color: '#8B5CF6' }} />}
            </button>
          </div>

          <div className="unassigned-card-box" style={{ textAlign: 'center', padding: '38px 20px' }}>
            <div className="network-offline-icon-pulse">
              <WifiOff size={38} style={{ color: '#EF4444' }} />
            </div>

            <div className="badge badge-danger" style={{ marginBottom: '12px' }}>
              Connection Issue
            </div>

            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Unable to Reach Server
            </h2>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '380px', margin: '0 auto 24px auto', lineHeight: 1.6 }}>
              We could not connect to the review server. Please check your internet connection and try again.
            </p>

            <button
              type="button"
              className="customer-submit-btn"
              onClick={fetchTarget}
              id="btn-retry-network-target"
              style={{ width: '100%', maxWidth: '320px', margin: '0 auto' }}
            >
              <RefreshCw size={17} />
              <span>Retry Connection</span>
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // =========================================================================
  // UNASSIGNED QR CODE: Generic Dynamic Standee Ready for Setup
  // =========================================================================
  if (!qrInfo || !qrInfo.isAssigned) {
    return (
      <div className="customer-page-wrapper">
        <div className="customer-card fade-in">
          {/* Top Bar */}
          <div className="customer-top-bar">
            <div className="customer-form-title-group">
              <QrCode size={15} style={{ color: 'var(--primary, #7C3AED)' }} />
              <span className="customer-form-heading">Review Standee Setup</span>
            </div>

            <button
              type="button"
              className="btn-mode-corner"
              onClick={handleToggleTheme}
              title={activeTheme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              id="btn-customer-unassigned-theme"
              aria-label="Toggle Theme"
            >
              {activeTheme === 'dark' ? <Sun size={15} style={{ color: '#FBBF24' }} /> : <Moon size={15} style={{ color: '#8B5CF6' }} />}
            </button>
          </div>

          {/* Unassigned Body */}
          <div className="unassigned-card-box">
            <div className="unassigned-radar">
              <QrCode size={38} />
            </div>

            <div className="badge badge-warning" style={{ marginBottom: '12px' }}>
              Generic Dynamic Standee • Ready
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
              QR Code Ready for Activation
            </h2>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '380px', margin: '0 auto 18px auto', lineHeight: 1.6 }}>
              This dynamic QR code (<code style={{ color: 'var(--primary)', fontWeight: 700 }}>{qrId}</code>) is generic and empty. Assign it to any business client to activate instant customer reviews.
            </p>

            {/* Step-by-step activation guide */}
            <div style={{ maxWidth: '420px', margin: '0 auto 24px auto' }}>
              <div className="onboard-step-card">
                <div className="onboard-step-num">1</div>
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>Onboard Business</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Enter business name and phone to set up client login.</div>
                </div>
              </div>
              <div className="onboard-step-card">
                <div className="onboard-step-num">2</div>
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>Instant QR Linking</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>This standee links permanently with their dedicated portal.</div>
                </div>
              </div>
              <div className="onboard-step-card">
                <div className="onboard-step-num">3</div>
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>Real-time Reviews</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Customers scan standee to leave feedback & phone numbers.</div>
                </div>
              </div>
            </div>

            {onGoToOnboard ? (
              <button
                className="customer-submit-btn"
                onClick={() => onGoToOnboard(qrId)}
                id="btn-activate-onboard-qr"
                style={{ width: '100%', maxWidth: '380px', margin: '0 auto' }}
              >
                <UserPlus size={18} />
                <span>Onboard Client with this Standee</span>
              </button>
            ) : (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Please open the administration portal to onboard a business to this standee.
              </div>
            )}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // =========================================================================
  // ASSIGNED QR CODE: Show Active Customer Review Experience
  // =========================================================================
  const TOTAL_REDIRECT_SECONDS = 2;
  const progressPercent = redirectCountdown !== null
    ? Math.min(100, Math.max(12, Math.round(((TOTAL_REDIRECT_SECONDS - redirectCountdown) / TOTAL_REDIRECT_SECONDS) * 100)))
    : 0;

  return (
    <div className="customer-page-wrapper">
      <div className="customer-card fade-in">

        {/* Compact Official Business Header Banner with Centered Company & In-Line Mode */}
        <div className="customer-header-compact">
          {/* Background Banner Graphic */}
          <img
            src={headerWaveBanner}
            alt=""
            aria-hidden="true"
            className="customer-header-wave-banner"
          />

          <div className="customer-header-main-row">
            {/* Left Balance Spacer to keep company section mathematically centered */}
            <div className="customer-header-side-spacer" aria-hidden="true" />

            {/* Center: Company Name Section */}
            <div className="customer-company-center-section">
              {client?.logoUrl ? (
                <div className="customer-avatar-compact">
                  <img
                    src={getImageUrl(client.logoUrl)}
                    alt={clientName}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>
              ) : (
                <div className="customer-avatar-compact" title={activeCategoryMeta.categoryLabel}>
                  {getCategoryIcon(activeCategoryKey)}
                </div>
              )}

              <div className="customer-header-details">
                <h1 className="customer-business-name-compact" title={clientName}>
                  {clientName}
                </h1>

                {clientLocation && (
                  <div className="customer-meta-compact">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={11} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                      <span>{clientLocation}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Theme Mode Toggle */}
            <button
              type="button"
              className="customer-banner-mode-btn"
              onClick={handleToggleTheme}
              title={activeTheme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              id="btn-customer-theme-toggle"
              aria-label="Toggle Theme"
            >
              {activeTheme === 'dark' ? <Sun size={14} style={{ color: '#FBBF24' }} /> : <Moon size={14} style={{ color: '#8B5CF6' }} />}
            </button>
          </div>
        </div>

        {/* Form Body or Celebration View */}
        <div className="customer-form-body">
          {submitted ? (
            /* ============================================================
               Thank You / Confirmation Receipt Screen
               ============================================================ */
            <div className="celebration-view-simplified">
              {/* Clean Success Icon */}
              <div className="celebration-icon-bubble">
                <CheckCircle2 size={38} />
              </div>

              {/* Minimal Heading: Thank You (only) */}
              <h2 className="celebration-title">
                Thank You!
              </h2>
              <p className="celebration-subtitle">
                Redirecting to Google Reviews...
              </p>

              {/* Paint-Animated "Paste it in Google Review" Callout (Only) */}
              <div className="paste-paint-wrapper">
                <div className="paste-paint-callout">
                  <span className="paste-paint-text">Paste it in Google Review</span>
                </div>
              </div>

              {/* Progress Bar (only) */}
              <div className="redirect-deep-card" style={{ marginBottom: '14px' }}>
                <div className="redirect-countdown-block">
                  <div className="redirect-countdown-header-line">
                    <div className="redirect-countdown-label">
                      {!redirectCancelled ? (
                        <>
                          <RefreshCw size={12} className="spin" style={{ color: '#8B5CF6' }} />
                          <span>
                            {redirectCountdown > 0
                              ? `Opening Google Reviews in ${redirectCountdown}s...`
                              : 'Opening Google Reviews now...'}
                          </span>
                        </>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Redirection paused</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (redirectCancelled) {
                          setRedirectCancelled(false);
                          if (redirectCountdown === null || redirectCountdown <= 0) {
                            setRedirectCountdown(2);
                          }
                        } else {
                          setRedirectCancelled(true);
                        }
                      }}
                      className="redirect-pause-btn"
                      title={redirectCancelled ? 'Resume redirect' : 'Pause redirect'}
                    >
                      {redirectCancelled ? 'Resume' : 'Stay on page'}
                    </button>
                  </div>

                  {/* Deep Progress Bar Track */}
                  <div
                    className="redirect-deep-track"
                    role="progressbar"
                    aria-valuenow={progressPercent}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  >
                    <div
                      className={`redirect-deep-bar ${redirectCancelled ? 'paused' : ''}`}
                      style={{
                        width: `${progressPercent}%`
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Primary Direct CTA: Go to Review Page Now */}
              <a
                href={googleTargetUrl || (client?.placeId ? buildGoogleReviewUrl(client.placeId) : buildGoogleReviewUrl('', `${clientName} ${clientLocation || clientAddress || ''}`))}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setRedirectCancelled(true)}
                id="btn-goto-google-review"
                className="btn-google-primary"
              >
                <span>Continue to Review Page</span>
                <ExternalLink size={15} />
              </a>

              {/* Minimal Secondary Action: Submit another response */}
              <div style={{ marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn-submit-another-link"
                  onClick={() => {
                    setSubmitted(false);
                    setComments('');
                    setSelectedSuggestion('');
                    setPhone('');
                    setSelectedChip('');
                    setRedirectCancelled(false);
                    setRedirectCountdown(null);
                    handleShuffle();
                  }}
                  id="btn-customer-submit-another"
                >
                  <RefreshCw size={13} />
                  <span>Submit another response</span>
                </button>
              </div>
            </div>
          ) : (
            /* ============================================================
               Interactive Customer Review Form (Compact & Official)
               ============================================================ */
            <form onSubmit={handleSubmit}>
              {error && !isNetworkFetchError(error) && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: 'var(--danger)',
                  fontSize: '0.82rem',
                  marginBottom: '14px'
                }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              {/* 1. Choose from 8 AI-Crafted Review Options with Internal Scrollbar */}
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <div className="suggestions-section-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MessageSquareText size={15} style={{ color: 'var(--primary, #8B5CF6)' }} />
                    <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Choose a comment <span style={{ color: 'var(--danger)' }}>*</span>
                    </span>
                  </div>
                  {/* 2-Option Review Language Toggle (Sequence: English, Tenglish) */}
                  <div className="review-lang-toggle" role="radiogroup" aria-label="Review Language">
                    <button
                      type="button"
                      className={`lang-pill-btn ${reviewLang === 'english' ? 'active' : ''}`}
                      onClick={() => handleLanguageSelect('english')}
                      id="btn-lang-english"
                      title="English reviews"
                    >
                      English
                    </button>
                    <button
                      type="button"
                      className={`lang-pill-btn ${reviewLang === 'tenglish' ? 'active' : ''}`}
                      onClick={() => handleLanguageSelect('tenglish')}
                      id="btn-lang-tenglish"
                      title="Tenglish (Telugu words in English letters, e.g. Super ga undi!)"
                    >
                      Tenglish
                    </button>
                  </div>
                </div>

                {/* 8 Selectable Review Suggestions with Internal Scrollbar & Tab Shimmer */}
                {isSwitchingTab ? (
                  <ReviewSuggestionsShimmer />
                ) : (
                  <div className="review-suggestions-list">
                    {displayedSuggestions.map((item, idx) => {
                      const isSelected = selectedSuggestion === item || selectedChip === item;
                      return (
                        <div
                          key={idx}
                          className={`review-suggestion-card pill-tier-${idx + 1} ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleSelectSuggestion(item)}
                          role="button"
                          tabIndex={0}
                          id={`review-option-pill-${idx + 1}`}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                            <div className="review-suggestion-text" style={{ flex: 1, paddingRight: '4px' }}>
                              "{item}"
                            </div>
                            <div style={{ flexShrink: 0 }}>
                              {isSelected ? (
                                <span className="review-copied-badge" title="Copied to clipboard">
                                  <Check size={11} style={{ strokeWidth: 3 }} />
                                  <span>Copied ✓</span>
                                </span>
                              ) : (
                                <span className="review-tap-copy-badge" title="Tap to copy">
                                  <Copy size={10} />
                                  <span>Tap to Copy</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Customer Phone Number Input */}
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <label className="form-label" htmlFor="customer-phone" style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600 }}>
                    Mobile Number{' '}
                    {isPhoneMandatory ? (
                      <>
                        <span style={{ color: '#EF4444', fontWeight: 700 }}>*</span>{' '}
                        <span style={{ fontSize: '0.74rem', color: '#EF4444', fontWeight: 600 }}>(Required)</span>
                      </>
                    ) : (
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 400 }}></span>
                    )}
                  </label>
                  {phone.length === 10 && (
                    <span style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <CheckCircle2 size={12} />
                      <span>Valid 10 digits</span>
                    </span>
                  )}
                </div>

                <div className="phone-input-compact">
                  <div className="phone-country-compact">
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <input
                    id="customer-phone"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="tel"
                    className="phone-input-field"
                    placeholder={isPhoneMandatory ? "Enter 10-digit mobile number *" : "Enter 10-digit number (Optional)"}
                    maxLength={10}
                    required={isPhoneMandatory}
                    value={phone}
                    onChange={handlePhoneChange}
                    onKeyDown={handlePhoneKeyDown}
                    onPaste={handlePhonePaste}
                  />
                  {phone.length === 10 ? (
                    <div style={{ paddingRight: '10px', display: 'flex', alignItems: 'center' }}>
                      <CheckCircle2 size={16} style={{ color: '#10B981' }} />
                    </div>
                  ) : null}
                </div>
              </div>

              {/* 3. Submit Review Button */}
              <button
                type="submit"
                className="btn-google-submit"
                disabled={submitting}
                id="btn-customer-submit-review"
              >
                {submitting ? (
                  <>
                    <RefreshCw size={16} className="spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Review</span>
                    <Send size={15} style={{ marginLeft: '6px', opacity: 0.9 }} />
                  </>
                )}
              </button>


            </form>
          )}
        </div>
      </div>

      {/* CUSTOM RELEVANT NETWORK / FAILED TO FETCH POPUP */}
      {showNetworkPopup && (
        <div
          className="network-error-modal-overlay"
          onClick={() => setShowNetworkPopup(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="network-error-modal-title"
        >
          <div
            className="network-error-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="network-error-close-btn"
              onClick={() => setShowNetworkPopup(false)}
              aria-label="Close"
              id="btn-close-network-modal"
            >
              <X size={18} />
            </button>

            <div className="network-error-icon-box">
              <WifiOff size={28} />
            </div>

            <h3 id="network-error-modal-title" className="network-error-title">
              Connection Interrupted
            </h3>

            <p className="network-error-desc">
              We couldn't reach the review server due to a temporary network issue. Don't worry — your feedback is safely preserved!
            </p>

            {comments.trim() && (
              <div className="network-error-preview-box">
                <div className="network-error-preview-badge">
                  <CheckCircle2 size={13} style={{ color: '#10B981', flexShrink: 0 }} />
                  <span>Review Copied to Clipboard</span>
                </div>
                <div className="network-error-preview-text">
                  "{comments.trim()}"
                </div>
              </div>
            )}

            <div className="network-error-actions">
              <button
                type="button"
                className="network-error-btn-retry"
                onClick={async () => {
                  setShowNetworkPopup(false);
                  await handleSubmit();
                }}
                disabled={submitting}
                id="btn-network-popup-retry"
              >
                <RefreshCw size={16} className={submitting ? 'spin' : ''} />
                <span>{submitting ? 'Retrying...' : 'Retry Submission'}</span>
              </button>

              {(googleTargetUrl || resolvedGoogleUrl) && (
                <a
                  href={googleTargetUrl || resolvedGoogleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="network-error-btn-google"
                  id="btn-network-popup-google"
                  onClick={() => {
                    handleCopyComment();
                    setShowNetworkPopup(false);
                  }}
                >
                  <ExternalLink size={16} />
                  <span>Proceed to Google Reviews</span>
                </a>
              )}

              <button
                type="button"
                className="network-error-btn-dismiss"
                onClick={() => setShowNetworkPopup(false)}
                id="btn-network-popup-dismiss"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Copied Toaster */}
      {copyToast.show && createPortal(
        <div
          className="customer-copy-toast"
          role="status"
          aria-live="polite"
        >
          <div className="customer-copy-toast-icon">
            <Check size={13} color="#FFFFFF" strokeWidth={3} />
          </div>
          <div className="customer-copy-toast-content">
            <span className="customer-copy-toast-bold">Copied ,</span>
            <span className="customer-copy-toast-sub">Paste in Google Review</span>
          </div>
          <button
            type="button"
            className="customer-copy-toast-close"
            onClick={() => setCopyToast({ show: false, message: '' })}
            aria-label="Close notification"
          >
            <X size={13} />
          </button>
        </div>,
        document.body
      )}

      <Footer />
    </div>
  );
}
