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

  // 3. PURE ENGLISH Fallbacks (Very Simple, 100% Positive Everyday English)
  const getRawCategoryFallbacksEnglish = (categoryKey, name) => {
    switch (categoryKey) {
      case 'Healthcare & Clinic':
        return [
          `Great care and friendly doctors at ${name}, very polite staff!`,
          `Very clean clinic with short waiting time. Doctor explained everything with patience and care.`,
          `Thank you for the great medical care at ${name}. Clean rooms and appointments run on time.`,
          `The doctors and staff are very helpful and listened patiently to all my health questions.`,
          `Quick test results and caring doctors. Highly recommend ${name} for family health!`,
          `Warm welcome and very polite nurses. Truly a wonderful clinic!`,
          `Clean treatment rooms, modern equipment, and fair consultation fees.`,
          `Felt very safe and well cared for. Best clinic experience in the area!`,
          `Very polite reception and doctors checked everything with gentle care.`,
          `Clean waiting area and staff always takes good care of patients.`,
          `The doctors here are very skilled, kind, and give honest advice.`,
          `Quick token system and fast attention from the nursing team at ${name}.`,
          `Doctors give clear medicine guidance without any unnecessary tests. Very honest!`,
          `Very neat clinic with clean treatment rooms. High quality medical care!`,
          `Helpful and smiling staff who make you feel completely comfortable.`,
          `Great follow-up and clear explanation of medicines. Thank you ${name}!`,
          `Wonderful clinic with caring doctors and helpful front desk staff.`,
          `Clean and peaceful clinic with gentle treatment. Highly recommended for kids and elders!`,
          `Fast response and emergency care handled very quickly. Lifesaver!`,
          `Polite reception, caring staff, and experienced doctors throughout.`,
          `One of the best clinics in the neighborhood with fair fees.`,
          `Doctor listened to every symptom with patience. Feeling much better!`,
          `Honest treatment plan and spotless hygiene maintained in all rooms.`,
          `Short waiting time and very caring doctors at ${name}. 5 stars!`
        ];
      case 'Restaurant & Cafe':
        return [
          `Delicious food and cozy atmosphere at ${name}!`,
          `Quick service and fresh food every single time. Staff is very polite and smiling.`,
          `Had a wonderful meal at ${name}. Big portion sizes and warm hospitality!`,
          `Loved the taste and fresh presentation of every dish. Will definitely order again!`,
          `Great place for dining with friends and family. Staff made us feel so welcome.`,
          `Super tasty food, clean kitchen, and fair prices. Easily one of my favorite spots!`,
          `Every dish was fresh, hot, and full of flavor. Great customer service throughout!`,
          `Delicious food options, refreshing drinks, and comfortable seating. Highly recommend ${name}!`,
          `Authentic taste and lovely food! Everything tasted super fresh.`,
          `The starters and special dishes at ${name} are very tasty. Great vibe overall!`,
          `Prompt service even during busy hours. Staff was polite and always smiling.`,
          `Comfortable seating, pleasant background music, and yummy desserts!`,
          `Loved the hospitality and delicious food at ${name}. Perfect family dinner spot!`,
          `Clean dining tables, neat plates, and mouth-watering food. 5 stars!`,
          `Generous food portions and great value for money. Can't wait to visit again!`,
          `Staff was very helpful and served custom requests with a smile. Great hospitality!`,
          `The special recipes here are super tasty. Highly recommended for all food lovers!`,
          `Warm welcome at the door and quick order delivery. Outstanding food quality!`,
          `Nice lighting and delicious food flavors. Loved every minute at ${name}!`,
          `Piping hot food, great spices, and friendly service throughout.`,
          `Great spot for family dinners and celebrations. Very polite servers!`,
          `Fresh ingredients in every single bite. Very satisfied!`,
          `Fast billing, reasonable prices, and fantastic hospitality at ${name}.`,
          `A great place with tasty recipes and a friendly dining atmosphere!`
        ];
      case 'Hotel & Resort':
        return [
          `Spotless rooms and wonderful hospitality at ${name}!`,
          `Smooth check-in and peaceful stay throughout. Staff was always helpful and smiling.`,
          `Had a memorable stay at ${name}. Rooms were very clean and breakfast was delicious.`,
          `Comfortable beds, fast Wi-Fi, and polite housekeeping. Perfect for a restful trip!`,
          `Great location and peaceful atmosphere. Front desk team was polite and accommodating.`,
          `Quiet rooms with clean bathrooms and fast room service. Highly recommended!`,
          `Great value for money with neat rooms and very well-maintained property.`,
          `From warm welcome to quick checkout, our stay at ${name} was wonderful!`,
          `Spacious rooms with comfortable beds and nice views. Loved our time here!`,
          `Breakfast spread was fresh and delicious. Attentive dining staff as well.`,
          `Housekeeping team kept our room very clean and neat every day.`,
          `Very safe and secure hotel with 24/7 polite front desk assistance.`,
          `Easy parking and good location close to key areas in the city.`,
          `Fresh bed sheets, quiet AC, and good room amenities.`,
          `Check-in was done in under two minutes with a friendly greeting!`,
          `Peaceful vibe with green gardens and clean surroundings.`,
          `Courteous front desk team who helped with local travel directions.`,
          `Ideal hotel for both work trips and relaxing family vacations.`,
          `Very helpful management who accommodated our late checkout request.`,
          `Spotless bathrooms with hot water and clean towels at ${name}.`,
          `Peaceful and comfortable atmosphere throughout. Very happy with the stay!`,
          `Loved the prompt room service and delicious hot snacks.`,
          `Top quality hospitality and clean premises everywhere!`,
          `A truly comfortable stay with warm staff and cozy rooms at ${name}.`
        ];
      case 'Retail & Shopping':
        return [
          `Great collection and very helpful staff at ${name}!`,
          `Wide variety of quality products with fair prices. Fast billing and polite support.`,
          `Always love shopping at ${name}. Trendy collections and very neat store layout!`,
          `Found exactly what I needed at a good price. Staff was very helpful.`,
          `Neat displays and fresh stock. Smooth shopping experience every visit!`,
          `High quality items and quick billing counter. Loved shopping here!`,
          `Helpful staff who guide you politely without any pressure. Best shop in town!`,
          `Great discount offers and genuine quality items. Definitely coming back for more!`,
          `Neat shelves and wide selection across all budgets at ${name}.`,
          `Store associates helped me pick the right size with a lot of patience.`,
          `Quick checkout with multiple payment options. No long queues!`,
          `Genuine branded items with clear exchange policies.`,
          `New designs and fresh arrivals in great colors every season.`,
          `Clean air-conditioned store with spacious trial rooms and polite attendants.`,
          `Great festival discounts and genuine quality on all items.`,
          `Staff greeted us warmly and answered all questions patiently.`,
          `Found good quality products at very reasonable and competitive prices.`,
          `Clean, bright store floor that makes browsing products easy and fun.`,
          `Convenient shop location with easy parking and polite staff.`,
          `Very helpful store manager who helped with my request in seconds.`,
          `Great customer service and wide selection of trending designs at ${name}.`,
          `Best shopping place in the area for quality and affordable prices!`,
          `Neat packaging and pleasant shopping atmosphere from start to finish.`,
          `Consistent high quality and polite staff every time I visit ${name}!`
        ];
      case 'Salon & Spa':
        return [
          `Skilled professionals and relaxing service at ${name}!`,
          `On-time appointments with clean hygiene standards. Stylists listen carefully to what you want.`,
          `Left ${name} feeling fresh and relaxed. Calming vibe and quality products!`,
          `Expert hair styling and polite personal care. Absolutely love my new look!`,
          `Relaxing vibe, clean chairs, and very polite stylists. Worth every rupee!`,
          `Great skincare treatment and relaxing massage. Felt completely refreshed!`,
          `Friendly team who take time to understand your style preference.`,
          `Consistently five-star service and warm hospitality. Highly recommend visiting ${name}!`,
          `Sanitized tools and clean towels used for every service. Very hygienic!`,
          `Pleasant fragrance and peaceful setup that helps you relax completely.`,
          `The stylist gave helpful hair care tips suited to my hair type.`,
          `Gentle skin care and neat facial treatment by experienced staff.`,
          `Appointments start right on time with no unnecessary waiting.`,
          `Good quality hair and skin products used with clear, honest pricing.`,
          `Loved the foot massage and pedicure at ${name}. Pure relaxation!`,
          `Stylists are creative and know the latest trending haircuts.`,
          `Warm greeting and polite reception staff. Truly enjoyable salon visit!`,
          `Gentle scalp massage and refreshing hair spa. Hair feels so soft and healthy!`,
          `Clean mirrors, sanitized chairs, and friendly staff throughout.`,
          `Very affordable grooming packages with great finishing touches.`,
          `The facial treatment gave my skin a healthy, natural glow. Thank you ${name}!`,
          `Polite staff who check on your comfort throughout the session.`,
          `Flawless hair styling and neat grooming service at ${name}!`,
          `My go-to salon for all grooming needs. Professional and courteous team!`
        ];
      case 'Automotive & Garage':
        return [
          `Honest service and on-time delivery at ${name}!`,
          `Skilled mechanics with fair estimates and clear billing. Delivered my vehicle right on time.`,
          `Very reliable service center at ${name}. Used genuine parts and car runs like new!`,
          `Clear explanation of required repairs without any hidden charges. Trustworthy team.`,
          `Quick repair turnaround and polite customer care. Car feels completely smooth.`,
          `Modern diagnostic tools, clean workshop, and polite service advisors.`,
          `Great attention to detail during oil change and general checkup. Highly satisfied!`,
          `Best garage experience I've had. Fair rates, honest advice, and quality work.`,
          `Fixed my car problem quickly that others could not solve. Skilled mechanics!`,
          `Clean waiting area with cool drinking water while waiting for car service.`,
          `Clear service bill with replaced parts shown transparently.`,
          `Car was washed clean, vacuumed, and delivered on schedule. Looks fresh!`,
          `Engine runs smoother and car drives great after servicing at ${name}.`,
          `Fast tire check and wheel alignment with computer calibration.`,
          `Honest mechanics who never push unnecessary replacements. Very trustworthy!`,
          `Quick brake check and safe test drive before handing over vehicle.`,
          `Breakdown assistance was quick, reassuring, and very helpful.`,
          `Reliable electrical diagnosis and quick wiring repair.`,
          `Fair quote shared upfront before starting any work. No surprises!`,
          `Experienced mechanics who treat your vehicle with good care.`,
          `AC cooling repaired quickly with genuine gas refilled. Cold AC now!`,
          `Service advisor kept me updated via phone during the repair process.`,
          `Highly trustworthy vehicle service workshop in the area. 5 stars!`,
          `Smooth car handover with neat cleaning and on-time delivery.`
        ];
      case 'Gym & Fitness Center':
        return [
          `Modern equipment and motivating vibe at ${name}!`,
          `Spacious workout floor with helpful certified trainers. Clean locker rooms and great energy.`,
          `Best fitness gym in the area at ${name}. Modern machines and supportive vibe!`,
          `Trainers give personal guidance on workout form. Seeing great fitness results!`,
          `Very clean workout area with well-kept weights and cardio machines.`,
          `Energetic music, positive crowd, and encouraging trainers every day.`,
          `Great variety of workout machines. Always look forward to exercising here!`,
          `Helpful gym management, clean showers, and polite coaching staff!`,
          `Spacious floor area and good quality dumbbells and barbells.`,
          `Trainers correct your exercise posture patiently to avoid injuries.`,
          `Sanitized benches and cleaning wipes available across the workout floor.`,
          `Good air ventilation and cool temperature kept even during busy mornings.`,
          `Helpful diet and workout guidance provided for fitness goals.`,
          `Very polite front desk and convenient opening hours from morning to night.`,
          `Energetic workout batches and fun fitness sessions.`,
          `Machines are oiled and maintained smoothly with zero issues.`,
          `Clean drinking water and safe lockers for gym members.`,
          `Supportive gym community that encourages beginners!`,
          `Personal training sessions helped me improve my strength and stamina.`,
          `Plenty of treadmills and cycles so there is never any waiting line.`,
          `Best choice for health and fitness. Highly recommend joining ${name}!`,
          `Knowledgeable trainers who motivate you to stay fit safely.`,
          `Clean changing rooms, hot showers, and neat facilities.`,
          `Energetic atmosphere that makes daily workouts fun and easy!`
        ];
      case 'Education & Coaching':
        return [
          `Dedicated teachers and personal attention at ${name}!`,
          `Clear lessons and simple explanations. Teachers are encouraging and clear all doubts patiently.`,
          `Great learning academy at ${name}. Helpful faculty and well-organized study materials.`,
          `Friendly learning atmosphere where teachers build students' confidence.`,
          `Interactive classes with regular mock tests that keep students prepared.`,
          `Helpful faculty and focused guidance for exam success. Highly recommended!`,
          `Doubt clearing sessions are easy to understand. Great improvement in marks!`,
          `Inspiring teachers who make difficult topics simple and fun to learn.`,
          `Good study notes and practice tests that build real exam confidence.`,
          `Small batches so every student gets personal attention and feedback.`,
          `Parents are updated about attendance and student progress regularly.`,
          `Clean classrooms with good lighting and comfortable seating.`,
          `Teachers explain math and science concepts in a very simple way.`,
          `Encouraging mentors who make sure students understand concepts clearly.`,
          `Good library facility and quiet reading space for study.`,
          `Helpful study guidance and exam tips given by teachers.`,
          `Polite office staff who help with class schedules and test papers.`,
          `Noticeable improvement in marks and subject confidence within a few months!`,
          `Regular doubt-solving time after class. Very helpful!`,
          `Positive environment that inspires students to achieve high scores.`,
          `Experienced teaching faculty who guide every student with care.`,
          `Disciplined and caring learning environment at ${name}.`,
          `Affordable fees with high quality teaching for all subjects.`,
          `The best coaching academy for students in the city!`
        ];
      default:
        return [
          `Great experience at ${name}, very polite and helpful staff!`,
          `Quick response and high quality work from start to finish. Team is professional and reliable.`,
          `Very happy with the work done by ${name}. Great results!`,
          `Clear communication, fair pricing, and on-time service. Highly recommend!`,
          `The team took great care of us. Very happy with the service!`,
          `Polite staff and quick work throughout. Great experience at ${name}!`,
          `Smooth and hassle-free service. Will definitely come back again!`,
          `Friendly customer support and dependable team. Exceeded my expectations!`,
          `Clean place, fair rates, and honest team at ${name}. 5 stars!`,
          `Delivered on their promise right on time with no delays. Very happy!`,
          `Helpful staff who explained everything clearly and politely before starting.`,
          `Smooth, quick, and efficient service. Highly recommend to everyone!`,
          `Always a pleasure dealing with ${name}. Reliable, quick, and polite.`,
          `Very helpful management who understood our needs right away.`,
          `Great attention to customer requests and neat work throughout.`,
          `Fair pricing, good quality results, and friendly staff every single time.`,
          `Quick turnaround time with great quality of work.`,
          `Staff treats customers with great respect and warm smiles.`,
          `One of the most dependable businesses in town. Will definitely visit again!`,
          `Great service and friendly people. Thank you ${name} for a great experience!`
        ];
    }
  };

  // Curated 4-liner review generator (guarantees the 2nd suggestion is strictly a detailed 4-liner review)
  const getCuratedFourLiner = (categoryKey, name, lang = 'english', keywords = '') => {
    const kwList = (keywords || '').split(',').map(k => k.trim()).filter(Boolean);
    const topKw = kwList[0] || '';

    if (lang === 'telugu') {
      switch (categoryKey) {
        case 'Restaurant & Cafe':
          return `${name} లో భోజనం చాలా అద్భుతంగా ఉంది. ${topKw ? `ప్రత్యేకించి ${topKw} మరియు ప్రతి వంటకం ఎంతో తాజా రుచితో వడ్డించారు.` : 'ప్రతి వంటకం ఎంతో తాజా రుచితో మరియు పరిశుభ్రంగా వడ్డించారు.'} సిబ్బంది ఆతిథ్యం మరియు వాతావరణం ఎంతో ఆహ్లాదకరంగా అనిపించాయి. కుటుంబంతో కలిసి రావడానికి ఇది అత్యుత్తమ రెస్టారెంట్!`;
        case 'Healthcare & Clinic':
          return `${name} లో వైద్య సేవలు ఎంతో సంతృప్తికరంగా ఉన్నాయి. ${topKw ? `వైద్యులు ${topKw} మరియు ఇతర సమస్యలను శ్రద్ధగా విని ఎంతో ఓపికగా పరిష్కారం వివరించారు.` : 'వైద్యులు సమస్యను శ్రద్ధగా విని ఎంతో ఓపికగా పరిష్కారం వివరించారు.'} క్లినిక్ చాలా శుభ్రంగా ఉంది మరియు సిబ్బంది ఎంతో సహాయకారిగా ఉన్నారు. ఉత్తమ వైద్య సంరక్షణ కోసం తప్పక సిఫార్సు చేస్తున్నాను!`;
        case 'Hotel & Resort':
          return `${name} లో మా బస ఎంతో ప్రశాంతంగా మరియు ఆహ్లాదకరంగా గడిచింది. ${topKw ? `గదులు చాలా విశాలంగా, ${topKw} మరియు అన్ని ఆధునిక సౌకర్యాలతో ఉన్నాయి.` : 'గదులు చాలా విశాలంగా, శుభ్రంగా మరియు అన్ని సౌకర్యాలతో ఉన్నాయి.'} సిబ్బంది ఎంతో మర్యాదగా మాట్లాడి ప్రతి విషయంలో వేగంగా స్పందించారు. తప్పకుండా మళ్లీ ఇక్కడే బస చేస్తాము!`;
        case 'Retail & Shopping':
          return `${name} లో షాపింగ్ అనుభవం చాలా బాగుంది. ${topKw ? `ఇక్కడ ${topKw} మరియు ఎన్నో రకాల తాజా కలెక్షన్స్ నాణ్యమైన వస్తువులు అందుబాటులో ఉన్నాయి.` : 'ఇక్కడ ఎన్నో రకాల తాజా కలెక్షన్స్ మరియు నాణ్యమైన వస్తువులు అందుబాటులో ఉన్నాయి.'} సిబ్బంది ప్రతి వస్తువు గురించి ఎంతో ఓపికగా వివరించారు. ధరలు కూడా చాలా సరసమైనవిగా ఉన్నాయి!`;
        case 'Salon & Spa':
          return `${name} లో సర్వీస్ ఎంతో అద్భుతంగా ఉంది. ${topKw ? `నిపుణులైన స్టైలిస్ట్స్ ${topKw} ని మన అభిరుచికి తగినట్లుగా చాలా శ్రద్ధగా చేశారు.` : 'నిపుణులైన స్టైలిస్ట్స్ మన అభిరుచికి తగినట్లుగా చాలా శ్రద్ధగా పనిచేశారు.'} ఇక్కడి పరిశుభ్రత మరియు ప్రశాంతమైన వాతావరణం ఎంతో నచ్చాయి. సరికొత్త లుక్ తో చాలా సంతోషంగా అనిపిస్తోంది!`;
        case 'Automotive & Garage':
          return `${name} లో వాహనం సర్వీస్ చాలా నమ్మకంగా చేశారు. ${topKw ? `మెకానిక్స్ ${topKw} మరియు ఇతర సమస్యలను త్వరగా గుర్తించి పారదర్శకమైన బిల్లింగ్ అందించారు.` : 'మెకానిక్స్ సమస్యను త్వరగా గుర్తించి పారదర్శకమైన బిల్లింగ్ అందించారు.'} సమయానికి వాహనాన్ని వాష్ చేసి కొత్తదానిలా డెలివరీ చేశారు. నిజాయితీ గల సర్వీస్ సెంటర్!`;
        case 'Gym & Fitness Center':
          return `${name} లో వ్యాయామం చేయడం ఎంతో ఉత్సాహాన్ని ఇస్తుంది. ${topKw ? `ఆధునిక పరికరాలు, ${topKw} మరియు సర్టిఫైడ్ ట్రైనర్స్ ఎంతో మంచి గైడెన్స్ ఇస్తున్నారు.` : 'ఆధునిక పరికరాలు మరియు సర్టిఫైడ్ ట్రైనర్స్ ఎంతో మంచి గైడెన్స్ ఇస్తున్నారు.'} పరిశుభ్రత మరియు సౌకర్యాలు చాలా ఉన్నతంగా ఉన్నాయి. ఫిట్‌నెస్ లక్ష్యాలు సాధించడానికి ఇది సరైన ప్రదేశం!`;
        case 'Education & Coaching':
          return `${name} లో విద్యా బోధన ఎంతో ప్రమాణాలతో కూడుకుని ఉంది. ${topKw ? `అధ్యాపకులు ${topKw} తో పాటు ప్రతి విషయాన్ని ఎంతో స్పష్టంగా అర్థమయ్యేలా బోధిస్తున్నారు.` : 'అధ్యాపకులు ప్రతి విషయాన్ని ఎంతో స్పష్టంగా అర్థమయ్యేలా బోధిస్తున్నారు.'} క్రమం తప్పకుండా పరీక్షలు నిర్వహిస్తూ విద్యార్థుల్లో విశ్వాసాన్ని పెంచుతున్నారు. అత్యుత్తమ కోచింగ్ అకాడమీ!`;
        default:
          return `Project work super గా చేశారు, staff response కూడా చాలా బాగుంది. ${topKw ? `ప్రత్యేకించి ${topKw} నాణ్యత ఎంతో బాగుంది మరియు సకాలంలో పని పూర్తి చేశారు.` : 'ఇచ్చిన మాట ప్రకారం సమయానికి పని పూర్తి చేశారు.'} నాణ్యత మరియు సహకారం రెండూ ఎంతో సంతృప్తికరంగా ఉన్నాయి. మంచి సర్వీస్ కోరుకునే ప్రతి ఒక్కరికీ ${name} ని తప్పక సిఫార్సు చేస్తున్నాను!`;
      }
    }

    if (lang === 'tenglish') {
      switch (categoryKey) {
        case 'Restaurant & Cafe':
          return `Food super ga undi, ambiance kuda chala bagundi at ${name}. ${topKw ? `Specially ${topKw} and starters fresh ga, delicious taste tho serve chesaru.` : 'Starters and main course rendu fresh ga, delicious taste tho icharu.'} Staff hospitality chala courteous ga undi, order fast ga vachindi. Family dinner ki perfect spot, definitely recommend chestanu!`;
        case 'Healthcare & Clinic':
          return `${name} lo consultation experience chala bagundi. ${topKw ? `Doctor garu ${topKw} and health queries chala patient ga vini clear ga explain chesaru.` : 'Doctor garu problem chala patient ga vini clear ga explain chesaru.'} Clinic premises spotless ga maintain chesaru with minimal waiting time. Best medical care in the area, highly recommended!`;
        case 'Hotel & Resort':
          return `Our stay at ${name} was peaceful and very comfortable. ${topKw ? `Rooms chala clean ga, ${topKw} and modern amenities tho super ga maintain chesaru.` : 'Rooms chala clean ga, spacious ga modern amenities tho unnayi.'} Front desk staff chala polite ga receive chesukuni fast check-in chesaru. Great hospitality and definitely will visit again!`;
        case 'Retail & Shopping':
          return `${name} lo shopping experience chala bagundi. ${topKw ? `Latest trending collections and genuine quality ${topKw} available ga unnayi.` : 'Latest trending collections and genuine quality products available ga unnayi.'} Staff associates product details chala patient ga explain chesaru. Billing fast ga jarigindi with very reasonable prices!`;
        case 'Salon & Spa':
          return `${name} lo styling and grooming session super ga undi. ${topKw ? `Stylists chala skilled ga unnaru and ${topKw} perfectly execute chesaru.` : 'Stylists chala skilled ga unnaru and exactly manam korukunnate chesaru.'} High-grade hygienic tools and top products use chesaru. Very relaxing experience, felt totally refreshed!`;
        case 'Automotive & Garage':
          return `${name} lo vehicle servicing chala professional ga chesaru. ${topKw ? `Mechanics ${topKw} issue accurate ga diagnose chesi upfront estimate icharu.` : 'Mechanics accurate diagnosis chesi upfront estimate icharu.'} Car performance super ga undi and right on time deliver chesaru. Highly dependable garage with fair charges!`;
        case 'Gym & Fitness Center':
          return `Best gym in the area with modern machines and great workout vibe. ${topKw ? `Trainers ${topKw} and workout posture personal attention tho chala patient ga guide chestaru.` : 'Trainers personal attention tho exercise posture chala patient ga guide chestaru.'} Locker rooms clean ga unnayi and fitness atmosphere super ga undi. Highly recommend joining ${name}!`;
        case 'Education & Coaching':
          return `${name} lo coaching and guidance super ga undi. ${topKw ? `Faculty ${topKw} and core concepts chala simple ga explain chesi doubts clarify chestaru.` : 'Faculty concepts chala simple ga explain chesi doubts patient ga clarify chestaru.'} Study material and regular tests exams ki full confidence istayi. Best academy for academic success!`;
        default:
          return `Project work super ga chesaru, staff response kuda chala bagundi. ${topKw ? `Specially ${topKw} quality standard top-notch ga undi and timely deliver chesaru.` : 'Timely delivery chesi clear communication maintain chesaru.'} Quality and service standards rendu top-notch ga unnayi. Anyone looking for reliable work, definitely recommend ${name}!`;
      }
    }

    // Default: 'english' (Very Simple, 100% Positive Everyday English)
    switch (categoryKey) {
      case 'Restaurant & Cafe':
        return `Had a great meal at ${name}. ${topKw ? `Their ${topKw} was hot, fresh, and very tasty.` : 'The dishes were freshly prepared and very tasty.'} The staff was polite, welcoming, and served us quickly. Highly recommend visiting with friends and family!`;
      case 'Healthcare & Clinic':
        return `Visited ${name} for consultation and had a wonderful experience. ${topKw ? `The doctor listened patiently and explained ${topKw} very clearly.` : 'The doctor listened patiently and explained everything very clearly.'} The clinic is very clean with short waiting times. Truly grateful for the wonderful medical care!`;
      case 'Hotel & Resort':
        return `Our stay at ${name} was comfortable and very pleasant. ${topKw ? `The rooms were clean, quiet, and equipped with ${topKw}.` : 'The rooms were spacious, clean, and very quiet.'} The front desk staff was polite, welcoming, and assisted with every request. Will definitely stay here again!`;
      case 'Retail & Shopping':
        return `Always a pleasure shopping at ${name}. ${topKw ? `They have a great collection of ${topKw} and quality products.` : 'They have a great collection of quality products.'} The store staff was polite and helped me find what I needed. Checkout was quick with fair prices!`;
      case 'Salon & Spa':
        return `Had a wonderful grooming session at ${name} today. ${topKw ? `The stylists are skilled and did ${topKw} exactly as I wanted.` : 'The stylists are skilled, patient, and did a great job.'} Clean tools and quality products were used throughout. Left feeling happy and refreshed!`;
      case 'Automotive & Garage':
        return `Great vehicle service and maintenance at ${name}. ${topKw ? `The mechanics checked ${topKw} carefully and shared a fair estimate upfront.` : 'The mechanics diagnosed the problem accurately and gave a fair quote.'} My vehicle was delivered right on time and runs smoothly. Highly dependable garage with fair rates!`;
      case 'Gym & Fitness Center':
        return `Best fitness gym in the area with modern equipment and great energy. ${topKw ? `The certified trainers guide you with personal attention, especially for ${topKw}.` : 'The certified trainers guide you with personal attention and proper form.'} The workout floor and locker rooms are cleaned regularly. Seeing great fitness results and highly recommend ${name}!`;
      case 'Education & Coaching':
        return `Outstanding learning academy with dedicated and caring teachers at ${name}. ${topKw ? `Their ${topKw} lessons and concepts are taught clearly and simply.` : 'Concepts are taught with great clarity and doubt-clearing sessions are very helpful.'} Regular tests and study materials keep students confident. Truly the best coaching institute!`;
      default:
        return `Had a wonderful experience dealing with ${name}. ${topKw ? `Their ${topKw} and work quality was great and completed right on time.` : 'The quality of work was great and completed right on time.'} The entire team was professional, polite, and prompt in addressing all queries. Highly recommended to anyone looking for reliable service!`;
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
      const kwCards = [];
      const englishTemplates = [
        (kw) => `Great experience at ${name}, especially loved the ${kw}! Quick service and polite team.`,
        (kw) => `Loved the ${kw} and friendly staff at ${name}. Will definitely visit again!`,
        (kw) => `The ${kw} here is super tasty and fresh! Very happy with the service at ${name}.`,
        (kw) => `Best place for ${kw} in the area! Quick service and friendly staff at ${name}.`,
        (kw) => `Had a wonderful time at ${name}. The ${kw} was very good! Highly recommend.`,
        (kw) => `Consistently great experience at ${name}. Their ${kw} and customer care are very good!`
      ];
      const teluguTemplates = [
        (kw) => `${name} లో ${kw} చాలా బాగుంది! సర్వీస్ ఎంతో బాగుంది మరియు సిబ్బంది ఎంతో మర్యాదగా ఉన్నారు.`,
        (kw) => `${name} లో ${kw} క్వాలిటీ సూపర్ గా ఉంది. ఖచ్చితంగా మళ్ళీ వస్తాము!`,
        (kw) => `${kw} ఇక్కడ చాలా అద్భుతంగా ఉంది. సిబ్బంది మంచి మర్యాదతో త్వరగా సర్వ్ చేశారు.`,
        (kw) => `${name} లో ${kw} కోసం తప్పకుండా వెళ్ళవచ్చు. చాలా నచ్చింది!`,
        (kw) => `${name} లో సర్వీస్ అద్భుతం, ప్రత్యేకించి ${kw} నాణ్యత ఎంతో సంతృప్తికరంగా ఉంది.`
      ];
      const tenglishTemplates = [
        (kw) => `${name} lo ${kw} super ga undi! Service chala bagundi and staff polite ga unnaru.`,
        (kw) => `${kw} quality super ga undi at ${name}. Definitely recommend chestanu!`,
        (kw) => `Ikada ${kw} chala bagundi, quick service and courteous team at ${name}.`,
        (kw) => `${name} lo ${kw} experience super ga undi, 5 stars for the team!`,
        (kw) => `Best place for ${kw}! Friendly staff and super quick response at ${name}.`,
        (kw) => `Loved the ${kw} here! Timely delivery and super quality at ${name}.`
      ];

      kwList.forEach((kw, idx) => {
        let text = '';
        if (lang === 'english') {
          const fn = englishTemplates[idx % englishTemplates.length];
          text = fn(kw);
        } else if (lang === 'telugu') {
          const fn = teluguTemplates[idx % teluguTemplates.length];
          text = fn(kw);
        } else {
          const fn = tenglishTemplates[idx % tenglishTemplates.length];
          text = fn(kw);
        }
        if (text) kwCards.push(text);
      });

      return [...kwCards, ...copy];
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

  const activeKeywords = (clientKeywords || '')
    .split(',')
    .map(k => k.trim().toLowerCase())
    .filter(Boolean);

  const getKeywordMatchScore = (text) => {
    if (!activeKeywords.length || !text) return 0;
    const lower = text.toLowerCase();
    let score = 0;
    for (const kw of activeKeywords) {
      if (lower.includes(kw)) score += 1;
    }
    return score;
  };

  const combinedCandidates = [...freshGemini, ...freshFallbacks];
  // Sort candidates so keyword-rich reviews are prioritized at the top of the list
  const prioritizedCandidates = activeKeywords.length > 0
    ? [...combinedCandidates].sort((a, b) => {
        const scoreB = getKeywordMatchScore(b);
        const scoreA = getKeywordMatchScore(a);
        if (scoreB !== scoreA) return scoreB - scoreA;
        const aIsGemini = freshGemini.includes(a) ? 1 : 0;
        const bIsGemini = freshGemini.includes(b) ? 1 : 0;
        return bIsGemini - aIsGemini;
      })
    : combinedCandidates;

  const candidatePool = [];
  const seenNorm = new Set();

  for (const item of prioritizedCandidates) {
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
        `Great service and very friendly staff at ${clientName}. Truly wonderful!`,
        `Very polite staff and quick assistance at ${clientName}. Highly satisfied!`,
        `Had a wonderful experience at ${clientName}. Will definitely recommend to everyone!`,
        `Consistently good quality and great hospitality at ${clientName}. 5 stars!`,
        `Smooth, hassle-free and dependable service at ${clientName}!`,
        `Loved how polite and helpful the entire team was at ${clientName}.`,
        `Very clean premises and pleasant atmosphere at ${clientName}!`,
        `Neat place and skilled team at ${clientName}. Highly recommended!`
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
  const curatedFourLiner = getCuratedFourLiner(activeCategoryKey, clientName, reviewLang, clientKeywords);
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

  const handleGenerateGeminiSuggestions = async (targetLang = reviewLang, forceFresh = false) => {
    // 1. Client-Side Memoization Check:
    // If we already fetched suggestions for this language in this session, re-use instantly UNLESS forceFresh is true!
    if (!forceFresh) {
      const memoized = geminiMemoRef.current[targetLang];
      if (Array.isArray(memoized) && memoized.length > 0) {
        const freshUnused = memoized.filter(item => !isReviewUsed(item, usedReviews));
        if (freshUnused.length >= 4) {
          setGeminiSuggestions(freshUnused);
          setAiSource('gemini');
          return; // Zero network latency, instant tab switch!
        }
      }
    }

    setIsGeneratingAi(true);
    setAiNotice(
      targetLang === 'english'
        ? 'Generating fresh English review options...'
        : 'Generating fresh Tenglish review options...'
    );
    try {
      const currentCards = forceFresh && Array.isArray(displayedSuggestions) ? displayedSuggestions : [];
      const res = await fetch(`${config.API_BASE_URL}/api/public/ai/suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: clientName,
          businessType: activeCategoryMeta.categoryLabel || rawCategory,
          keywords: clientKeywords,
          clientId: client?.id,
          qrId: qrInfo?.qrId || qrId,
          excludeReviews: [...usedReviews, ...currentCards],
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
        setAiNotice('✨ 8 new review suggestions ready');
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

  const handleGenerateNewComments = () => {
    if (isGeneratingAi) return;
    setIsSwitchingTab(true);
    setSelectedSuggestion('');
    setSelectedChip('');
    setComments('');

    // Re-shuffle fallback cards with dynamic variants
    setShuffledFallbacks(shuffleSuggestions(getCategoryFallbacks(activeCategoryKey, clientName, clientKeywords, reviewLang)));

    // Fetch completely fresh suggestions from Gemini AI
    handleGenerateGeminiSuggestions(reviewLang, true);

    setTimeout(() => {
      setIsSwitchingTab(false);
    }, 350);
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
            <form onSubmit={handleSubmit} className="customer-review-form">
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
              <div className="form-group customer-suggestions-group">
                <div className="suggestions-section-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MessageSquareText size={15} style={{ color: 'var(--primary, #8B5CF6)' }} />
                    <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Choose a comment <span style={{ color: 'var(--danger)' }}>*</span>
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {/* Shuffle Button to get fresh new comments on customer screen */}
                    <button
                      type="button"
                      className="btn-shuffle-comments btn-generate-fresh-comments"
                      onClick={handleGenerateNewComments}
                      disabled={isGeneratingAi || isSwitchingTab}
                      title="Shuffle to see new review comments"
                      id="btn-customer-shuffle-comments"
                    >
                      <Shuffle size={12} className={isGeneratingAi ? 'animate-spin' : ''} />
                      <span>{isGeneratingAi ? 'Shuffling...' : 'Shuffle'}</span>
                    </button>

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
                          <div className="review-suggestion-content">
                            <div className="review-badge-float">
                              {isSelected ? (
                                <span className="review-copied-badge" title="Copied to clipboard">
                                  <Check size={11} style={{ strokeWidth: 2.5 }} />
                                  <span>Copied ✓</span>
                                </span>
                              ) : (
                                <span className="review-tap-copy-badge" title="Tap to copy">
                                  <Copy size={10} />
                                  <span>Tap to Copy</span>
                                </span>
                              )}
                            </div>
                            <div className="review-suggestion-text">
                              "{item}"
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Customer Phone Number Input */}
              <div className="form-group customer-phone-group">
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
