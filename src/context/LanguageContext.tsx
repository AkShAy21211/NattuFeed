"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Language = "en" | "ml";

const translations: Record<string, Record<Language, string>> = {
  // Feed / General
  localHub: { en: "Local Hub", ml: "പ്രാദേശിക വാർത്തകൾ" },
  feed: { en: "Feed", ml: "ഫീഡ്" },
  leaderboard: { en: "Leaderboard", ml: "റാങ്കിംഗ്" },
  profile: { en: "Profile", ml: "പ്രൊഫൈൽ" },
  loading: { en: "Loading local updates...", ml: "വാർത്തകൾ ലോഡ് ചെയ്യുന്നു..." },
  syncingProfile: { en: "Syncing Profile...", ml: "പ്രൊഫൈൽ പുതുക്കുന്നു..." },
  noPostsTitle: { en: "No updates yet", ml: "വാർത്തകൾ ലഭ്യമല്ല" },
  noPostsDesc: { en: "Be the first to update your neighborhood!", ml: "നിങ്ങളുടെ പ്രദേശത്തെ ആദ്യ വാർത്ത പങ്കുവെക്കൂ!" },
  beTheFirst: { en: "Post an Update", ml: "വിവരങ്ങൾ പങ്കുവെക്കുക" },
  radiusLabel: { en: "{radius}km radius", ml: "{radius} കി.മീ ചുറ്റളവ്" },
  globalFeed: { en: "All Kerala Feed", ml: "കേരളം മുഴുവൻ" },
  refresh: { en: "Refresh", ml: "പുതുക്കുക" },
  kerala: { en: "Kerala", ml: "കേരളം" },
  yourArea: { en: "Your Area", ml: "നിങ്ങളുടെ പ്രദേശം" },
  viewingEverywhere: { en: "Viewing everywhere", ml: "കേരളത്തിലെ എല്ലാ വാർത്തകളും" },
  localFeed: { en: "Local Feed", ml: "പ്രാദേശിക വാർത്തകൾ" },
  posts: { en: "Posts", ml: "വാർത്തകൾ" },
  viewGlobal: { en: "All Kerala Feed", ml: "കേരളം" },
  local: { en: "Show Local", ml: "ലോക്കൽ" },
  filters: { en: "Filters", ml: "ഫിൽട്ടർ" },
  km: { en: "km", ml: " കി.മി." },
  silenceArea: { en: "Quiet in this area", ml: "ഈ ഭാഗത്ത് വിശേഷങ്ങളൊന്നുമില്ല" },
  noUpdates: { en: "No new updates in {radius}km radius.", ml: "{radius} കി.മീ ചുറ്റളവിൽ പുതിയ വാർത്തകളൊന്നുമില്ല." },
  postUpdate: { en: "Post Update", ml: "അറിയിക്കുക" },
  whereAreYou: { en: "Where are you?", ml: "നിങ്ങൾ എവിടെയാണ്?" },
  needsLocation: { en: "Location permission is required to show relevant local updates.", ml: "പ്രസക്തമായ വാർത്തകൾ കാണുന്നതിന് ലൊക്കേഷൻ അനുമതി ആവശ്യമാണ്." },
  tryAgain: { en: "Try Again", ml: "വീണ്ടും ശ്രമിക്കുക" },
  filterLive: { en: "Live", ml: "തത്സമയം" },
  filterToday: { en: "Today", ml: "ഇന്ന്" },
  filterYesterday: { en: "Yesterday", ml: "ഇന്നലെ" },
  filterMixed: { en: "Mixed", ml: "എല്ലാം" },
  trendingKerala: { en: "Trending in Kerala", ml: "കേരളത്തിലെ തരംഗങ്ങൾ" },
  viewEverywhere: { en: "View Everything Across Kerala", ml: "കേരളം മുഴുവൻ കാണുക" },

  // Auth / Login
  welcome: { en: "Welcome to NattuFeed", ml: "നട്ടുഫീഡിലേക്ക് സ്വാഗതം" },
  welcomeBack: { en: "Welcome back!", ml: "വീണ്ടും സ്വാഗതം!" },
  tagline: { en: "The heartbeat of your neighborhood", ml: "നിങ്ങളുടെ അയൽപക്കത്തെ വിശേഷങ്ങൾ" },
  signInGoogle: { en: "Continue with Google", ml: "ഗൂഗിൾ വഴി ലോഗിൻ ചെയ്യുക" },
  or: { en: "or", ml: "അല്ലെങ്കിൽ" },
  phoneNumber: { en: "Phone Number", ml: "ഫോൺ നമ്പർ" },
  fullName: { en: "Full Name", ml: "പൂർണ്ണരൂപത്തിലുള്ള പേര്" },
  sendOTP: { en: "Send OTP", ml: "OTP അയക്കുക" },
  enterOTP: { en: "Enter 6-Digit OTP", ml: "6 അക്ക OTP നൽകുക" },
  verifyOTP: { en: "Verify OTP", ml: "OTP ശരിയാണെന്ന് ഉറപ്പാക്കുക" },
  resendOTP: { en: "Resend OTP", ml: "OTP വീണ്ടും അയക്കുക" },
  loggingIn: { en: "Logging in...", ml: "ലോഗിൻ ചെയ്യുന്നു..." },
  legalNote: { en: "By signing in, you agree to our", ml: "ലോഗിൻ ചെയ്യുന്നതിലൂടെ നിങ്ങൾ പാലിപ്പിക്കാൻ ബാധ്യസ്ഥരാണ്:" },
  privacyPolicy: { en: "Privacy Policy", ml: "സ്വകാര്യതാ നയം" },
  googleFail: { en: "Google sign in failed.", ml: "ഗൂഗിൾ ലോഗിൻ പരാജയപ്പെട്ടു." },
  validPhone: { en: "Enter a valid 10-digit phone number.", ml: "ശരിയായ ഫോൺ നമ്പർ നൽകൂ." },
  validName: { en: "Enter a valid name.", ml: "ശരിയായ പേര് നൽകൂ." },
  otpSendFail: { en: "Failed to send OTP.", ml: "ഒടിപി അയക്കാൻ കഴിഞ്ഞില്ല." },
  invalidOtp: { en: "Invalid OTP.", ml: "ഒടിപി തെറ്റാണ്." },
  connecting: { en: "Connecting your neighborhood", ml: "നിങ്ങളുടെ അയൽക്കാരെ ബന്ധിപ്പിക്കുന്നു" },
  contGoogle: { en: "Continue with Google", ml: "ഗൂഗിൾ വഴി തുടരുക" },
  fullNameLabel: { en: "Full Name", ml: "പൂർണ്ണനാമം" },
  phonePlaceholder: { en: "00000 00000", ml: "00000 00000" },
  signInPhone: { en: "Sign in with Phone", ml: "ഫോൺ വഴി ലോഗിൻ ചെയ്യുക" },
  backToOptions: { en: "Back to options", ml: "തിരിച്ചു പോകുക" },
  verifyOtpTitle: { en: "Verify OTP", ml: "ഒടിപി ഉറപ്പാക്കുക" },
  sentTo: { en: "Sent to {phoneNumber}", ml: "{phoneNumber} എന്ന നമ്പറിലേക്ക് അയച്ചു" },
  confirmEnter: { en: "Confirm & Enter", ml: "ഉറപ്പാക്കി പ്രവേശിക്കുക" },
  featureTitle: { en: "Your Neighborhood Network", ml: "നാട്ടിലെ വിശേഷങ്ങൾ വിരൽത്തുമ്പിൽ" },
  featureTraffic: { en: "Live Traffic & Bus Radar", ml: "ബസ്സും ട്രാഫിക്കും നേരിട്ടറിയാം" },
  featureMarket: { en: "Local Market & Prices", ml: "ചന്തയിലെ വിലവിവരങ്ങൾ" },
  featureAlerts: { en: "Emergency & Safety Alerts", ml: "അടിയന്തര അറിയിപ്പുകൾ" },
  featureTrust: { en: "Verified by People you Trust", ml: "വിശ്വാസയോഗ്യമായ വാർത്തകൾ" },

  // Posting
  whatIsHappening: { en: "What is happening?", ml: "എന്താണ് പുതിയ വിശേഷം?" },
  postTitlePlaceholder: { en: "Add a headline (optional)", ml: "തലക്കെട്ട് ചേർക്കുക (നിർബന്ധമില്ല)" },
  postContentPlaceholder: { en: "Tell your neighborhood...", ml: "കൂടുതൽ വിവരങ്ങൾ നൽകുക..." },
  postButton: { en: "Post Update", ml: "വിവരം പങ്കുവെക്കുക" },
  posting: { en: "Posting...", ml: "പങ്കുവെക്കുന്നു..." },
  category: { en: "Category", ml: "വിഭാഗം" },
  selectCategory: { en: "Select Category", ml: "വിഭാഗം തിരഞ്ഞെടുക്കുക" },
  enterHeadline: { en: "Please enter a headline", ml: "തലക്കെട്ട് നൽകുക" },
  locationRequired: { en: "Location is required to post", ml: "ലൊക്കേഷൻ ലഭ്യമായിരിക്കണം" },
  restrictedLanguage: { en: "Please avoid using offensive language", ml: "മോശമായ വാക്കുകൾ ഒഴിവാക്കുക" },
  nativeMember: { en: "Helpful Local", ml: "സഹായ മനസ്ഥിതിയുള്ള നാട്ടുകാർ" },
  statusChecking: { en: "Checking...", ml: "പരിശോധിക്കുന്നു..." },
  viewOnMap: { en: "View on Map / Navigate", ml: "മാപ്പിൽ കാണുക / പോകുക" },
  reportPost: { en: "Report this update", ml: "ഈ വാർത്ത റിപ്പോർട്ട് ചെയ്യുക" },
  // Post Detail Page
  loadingDetails: { en: "Gathering details...", ml: "വിവരങ്ങൾ ശേഖരിക്കുന്നു..." },
  postNotFound: { en: "Update Not Found", ml: "വാർത്ത ലഭ്യമല്ല" },
  postNotFoundDesc: { en: "The update you're looking for might have been removed or has expired.", ml: "നിങ്ങൾ തിരയുന്ന വാർത്ത നീക്കം ചെയ്യുകയോ കാലഹരണപ്പെടുകയോ ചെയ്തിരിക്കാം." },
  updateDetails: { en: "Update Details", ml: "വാർത്തയുടെ വിവരങ്ങൾ" },
  postedOn: { en: "Posted On", ml: "പങ്കുവെച്ചത്" },
  radarInfoMsg: { en: "This is a real-time citizen-tracked bus location. Its accuracy depends on how recently it was reported.", ml: "ഇതൊരു തത്സമയ ബസ് ലൊക്കേഷനാണ്. ഇതിന്റെ കൃത്യത റിപ്പോർട്ട് ചെയ്ത സമയത്തെ ആശ്രയിച്ചിരിക്കും." },
  viewDetails: { en: "View Full Update", ml: "മുഴുവൻ വാർത്തയും കാണുക" },
  viewTrackDetails: { en: "View Live Tracking", ml: "തത്സമയ ട്രാക്കിംഗ് കാണുക" },
  linkCopied: { en: "Link copied to clipboard!", ml: "ലിങ്ക് കോപ്പി ചെയ്തു!" },
  postedKarma: { en: "Posted! You earned Karma.", ml: "വാർത്ത പങ്കുവെച്ചു! നിങ്ങൾക്ക് കർമ്മ ലഭിച്ചു." },
  failedToPost: { en: "Failed to post update.", ml: "വാർത്ത പങ്കുവെക്കാൻ കഴിഞ്ഞില്ല." },
  categoryTraffic: { en: "Traffic", ml: "ട്രാഫിക്" },
  categoryUtility: { en: "Utility", ml: "യൂട്ടിലിറ്റി" },
  categoryMarket: { en: "Market", ml: "മാർക്കറ്റ്" },
  categoryServices: { en: "Services", ml: "സേവനങ്ങൾ" },
  categoryHealth: { en: "Health", ml: "ആരോഗ്യം" },
  categoryAlerts: { en: "Alerts", ml: "അലേർട്ടുകൾ" },
  categoryTownTalk: { en: "Town Talk", ml: "നാട്ടുവിശേഷം" },
  titleLegend: { en: "Local Legend", ml: "നാട്ടിലെ താരം" },
  titleHelping: { en: "Helping Hand", ml: "സഹായമനസ്കൻ" },
  titleMarketPro: { en: "Market Pro", ml: "മാർക്കറ്റ് പ്രോ" },
  titleNeighbor: { en: "Neighbor Hero", ml: "നല്ല അയൽവാസി" },
  noReactionsYet: { en: "No reactions yet", ml: "പ്രതികരണങ്ങൾ ലഭ്യമല്ല" },
  react: { en: "React", ml: "പ്രതികരിക്കൂ" },
  reacted: { en: "Reacted", ml: "പ്രതികരിച്ചു" },
  verify: { en: "Verify", ml: "ശരിവെക്കുക" },
  hot: { en: "Hot", ml: "തത്സമയം" },
  helpful: { en: "Helpful", ml: "സഹായം" },
  interesting: { en: "Cool", ml: "കൊള്ളാം" },
  hintTraffic: { en: "Bus late, road block, accident, railway cross", ml: "ബസ് വൈകി, റോഡ് ബ്ലോക്ക്, അപകടം" },
  hintUtility: { en: "Power cut, pipe burst, street light issue", ml: "കറന്റ് പോയി, പൈപ്പ് പൊട്ടി, സ്ട്രീറ്റ് ലൈറ്റ്" },
  hintMarket: { en: "Fresh catch, fish/veg price, shop open, food", ml: "മീൻ/പച്ചക്കറി വില, കട തുറന്നോ, ചന്ത വിശേഷങ്ങൾ" },
  hintServices: { en: "Driver, electrician, plumber, coconut climber", ml: "ഡ്രൈവർ, ഇലക്ട്രീഷ്യൻ, തഴോളി, തെങ്ങുകയറ്റം" },
  hintHealth: { en: "Blood needed, ambulance, pharmacy info", ml: "രക്തം വേണം, ആംബുലൻസ്, മരുന്ന് വിവരങ്ങൾ" },
  hintAlerts: { en: "Hartal, heavy rain, festival, stray dog", ml: "ഹർത്താൽ, കനത്ത മഴ, ഉത്സവം, തെരുവുനായ" },
  hintTownTalk: { en: "Hidden gems, local food spots, neighborhood news", ml: "നാട്ടിലെ പുത്തൻ വിശേഷങ്ങൾ, നല്ല ഭക്ഷണശാലകൾ" },
  newUpdate: { en: "New Update", ml: "പുതിയ അറിയിപ്പ്" },
  titleRadar: { en: "Radar a Bus", ml: "ബസ് റഡാർ" },
  titleTraffic: { en: "Traffic Alert", ml: "ട്രാഫിക് അലർട്ട്" },
  titleUtility: { en: "Utility Report", ml: "യൂട്ടിലിറ്റി റിപ്പോർട്ട്" },
  titleMarket: { en: "Market Update", ml: "മാർക്കറ്റ് അപ്ഡേറ്റ്" },
  titleServices: { en: "Service Listing", ml: "സേവനങ്ങൾ" },
  titleHealth: { en: "Health/Medical", ml: "ആരോഗ്യ അറിയിപ്പ്" },
  titleAlerts: { en: "Urgent Alert", ml: "അടിയന്തര അറിയിപ്പ്" },
  titleTownTalk: { en: "Town Discovery", ml: "നാട്ടുവിശേഷം" },
  
  promptTraffic: { en: "Road blocks or accidents?", ml: "റോഡ് ബ്ലോക്ക് അല്ലെങ്കിൽ അപകടം ഉണ്ടോ?" },
  promptUtility: { en: "Power, Water, or Road updates?", ml: "വൈദ്യുതി, വെള്ളം അല്ലെങ്കിൽ റോഡ് വാർത്തകൾ?" },
  promptMarket: { en: "What's the price or stock today?", ml: "ഇന്നത്തെ ചന്തയിലെ വിലവിവരങ്ങൾ?" },
  promptServices: { en: "Need or offering a local service?", ml: "സേവനങ്ങൾ ആവശ്യമുണ്ടോ അതോ നൽകുന്നുണ്ടോ?" },
  promptHealth: { en: "Medical emergencies or info?", ml: "മരുന്ന് അല്ലെങ്കിൽ മറ്റ് ആരോഗ്യ വിവരങ്ങൾ?" },
  promptAlerts: { en: "Emergency news for neighbors?", ml: "അയാൽപക്കക്കാർ അറിയേണ്ട അടിയന്തര വിവരങ്ങൾ?" },
  promptTownTalk: { en: "Spot anything interesting in your neighborhood?", ml: "നാട്ടിലെ പുത്തൻ വിശേഷങ്ങൾ പങ്കുവെക്കൂ?" },

  tagRoadBlock: { en: "Road Block", ml: "റോഡ് ബ്ലോക്ക്" },
  tagAccident: { en: "Accident", ml: "അപകടം" },
  tagHeavyTraffic: { en: "Heavy Traffic", ml: "തിരക്ക്" },
  tagPowerCut: { en: "Power Cut", ml: "കറന്റ് പോയി" },
  tagWaterIssue: { en: "Water Issue", ml: "വാട്ടർ അതോറിറ്റി" },
  tagStreetLight: { en: "Street Light", ml: "സ്ട്രീറ്റ് ലൈറ്റ്" },
  tagFishPrice: { en: "Fish Price", ml: "മീൻ വില" },
  tagVeggiePrice: { en: "Veggie Price", ml: "പച്ചക്കറി വില" },
  tagShopClosed: { en: "Shop Closed", ml: "കട അടച്ചു" },
  tagHeavyRain: { en: "Heavy Rain", ml: "കനത്ത മഴ" },
  tagHartal: { en: "Hartal", ml: "ഹർത്താൽ" },
  tagStrayDogs: { en: "Stray Dogs", ml: "തെരുവുനായ" },
  tagHiddenGems: { en: "Hidden Gems", ml: "പുതിയ കാഴ്ച്ചകൾ" },
  tagLocalFood: { en: "Local Food", ml: "നാടൻ ഭക്ഷണം" },
  tagSpotting: { en: "Spotting", ml: "സ്പോട്ടിംഗ്" },
  cancel: { en: "Cancel", ml: "വേണ്ട" },
  headlinePlaceholder: { en: "What's happening?", ml: "എന്തിനെക്കുറിച്ചാണ്?" },
  landmarkLabel: { en: "Nearby Landmark", ml: "അടുത്തുള്ള പ്രധാന സ്ഥലം" },
  landmarkPlaceholder: { en: "e.g. Near School, Junction...", ml: "ഉദാ: സ്ക്കൂൾ പറമ്പ്, ജംഗ്ഷൻ..." },
  detailsPlaceholder: { en: "More details (optional)...", ml: "കൂടുതൽ വിവരങ്ങൾ..." },
  headlineLabel: { en: "Headline", ml: "തലക്കെട്ട്" },
  detailsLabel: { en: "Details", ml: "വിവരങ്ങൾ" },
  
  // Bus Spott / Virtual Radar
  towardsCity: { en: "Heading to City", ml: "നഗരത്തിലേക്ക്" },
  towardsVillage: { en: "Heading to Village", ml: "നാട്ടിലേക്ക്" },
  routeLabel: { en: "Bus Name or Route", ml: "ബസ് പേര് അല്ലെങ്കിൽ റൂട്ട്" },
  enterRouteName: { en: "e.g. Kannur-Azhikode, Limited Stop", ml: "ഉദാ: കണ്ണൂർ-അഴീക്കോട്" },
  spottAbus: { en: "Spott a Bus", ml: "ബസ് എവിടെയാണ്?" },
  directionLabel: { en: "Direction", ml: "ദിശ" },
  busRadarMode: { en: "Bus Radar", ml: "ബസ് റഡാർ" },
  otherTrafficMode: { en: "Other Issues", ml: "മറ്റ് റിപ്പോർട്ടുകൾ" },
  away: { en: "away", ml: "ദൂരെ" },
  minsAgo: { en: "{mins}m ago", ml: "{mins} മിനിറ്റ് മുൻപ്" },
  activeNow: { en: "Active Now", ml: "ഇപ്പോൾ സജീവം" },
  expired: { en: "Expired", ml: "സമയം കഴിഞ്ഞു" },
  radarLive: { en: "Live Radar", ml: "തത്സമയ റഡാർ" },
  gpsSnapInfo: { 
    en: "Your current location will be used to radar this bus for neighbors.", 
    ml: "ഈ ബസിന്റെ ലൊക്കേഷൻ മറ്റുള്ളവർക്ക് കാണുന്നതിനായി നിങ്ങളുടെ ലൊക്കേഷൻ ഉപയോഗിക്കും." 
  },
  busSpottPrompt: { en: "I just spotted a bus near me —", ml: "ഞാൻ ഇപ്പോൾ ഒരു ബസ് കണ്ടു —" },
  spottedBy: { en: "Spotted by", ml: "വിവരം നൽകിയത്" },
  distance: { en: "Distance", ml: "ദൂരം" },
  status: { en: "Status", ml: "നില" },
  tooFarToVerify: { en: "You must be near the bus to verify!", ml: "ബസ് ശരിവെക്കാൻ നിങ്ങൾ അതിനടുത്ത് ഉണ്ടായിരിക്കണം!" },
  tooFarFromRoad: { en: "We don't know this stop! Help us by naming it below.", ml: "ഈ സ്റ്റോപ്പ് മാപ്പിൽ ഇല്ല! ഇത് ചേർക്കാനായി താഴെ പേര് നൽകുക." },
  suggestStop: { en: "ADD STOP TO MAP", ml: "സ്റ്റോപ്പ് മാപ്പിലേക്ക് ചേർക്കാം" },
  suggestionNote: { en: "Once added, everyone will be able to radar buses here! 🚀", ml: "നിങ്ങൾ ഇത് ചേർത്താൽ മറ്റുള്ളവർക്കും ഇവിടെ റഡാർ ലഭ്യമാകും! 🚀" },
  suggestStopTitle: { en: "Add to Map 📍", ml: "മാപ്പിലേക്ക് ചേർക്കാം 📍" },
  commonRoutesLabel: { en: "Bus Stop Name", ml: "സ്റ്റോപ്പിന്റെ പേര്" },
  commonRoutesHint: { en: "e.g. Town Hospital Stop", ml: "ഉദാ: ടൗൺ ഹോസ്പിറ്റൽ സ്റ്റോപ്പ്" },
  stopSuggested: { en: "Spot suggested! Community will verify soon.", ml: "വിവരം രേഖപ്പെടുത്തി! വൈകാതെ തന്നെ എല്ലാവർക്കും ലഭ്യമാകും." },
  verifyingSpot: { en: "Sending suggestion...", ml: "വിവരം അയക്കുന്നു..." },
  timingStatus: { en: "Bus Timing", ml: "ബസ് സമയം" },
  timingOnTime: { en: "On Time", ml: "സമയത്തിന്" },
  timingDelayed: { en: "Delayed", ml: "വൈകുന്നു" },
  timingJustMissed: { en: "Just Missed", ml: "ഇപ്പോൾ പോയി" },
  postingFrom: { en: "Posting from", ml: "ഇവിടെ നിന്ന്:" },
  atStop: { en: "at {stop}", ml: "{stop}-ൽ" },

  // Post Actions
  meToo: { en: "Me Too", ml: "ശരിയാണ്" },
  verified: { en: "Verified", ml: "ശരിവെച്ചു" },
  report: { en: "Report", ml: "റിപ്പോർട്ട്" },
  delete: { en: "Delete", ml: "ഒഴിവാക്കുക" },
  reporting: { en: "Reporting...", ml: "റിപ്പോർട്ട് ചെയ്യുന്നു..." },
  deleting: { en: "Deleting...", ml: "ഒഴിവാക്കുന്നു..." },
  justNow: { en: "Just now", ml: "ഇപ്പോൾ" },
  verifyFail: { en: "Verification failed.", ml: "ശരിവെക്കാൻ കഴിഞ്ഞില്ല." },
  reportSpam: { en: "Report this post as harmful or false?", ml: "ഇതൊരു തെറ്റായ വാർത്തയാണെന്ന് റിപ്പോർട്ട് ചെയ്യണോ?" },
  confirm: { en: "Confirm", ml: "ഉറപ്പാക്കുക" },
  reportSuccess: { en: "Reported successfully.", ml: "റിപ്പോർട്ട് ചെയ്തു." },
  reportFail: { en: "Reporting failed.", ml: "റിപ്പോർട്ട് ചെയ്യാൻ കഴിഞ്ഞില്ല." },
  adminDeleteConfirm: { en: "Admin: Permanently delete this post?", ml: "അഡ്മിൻ: ഈ പോസ്റ്റ് എന്നെന്നേക്കുമായി ഒഴിവാക്കണോ?" },
  deleteConfirm: { en: "Delete your post permanently?", ml: "നിങ്ങളുടെ ഈ വാർത്ത ഒഴിവാക്കണോ?" },
  deleteSuccess: { en: "Deleted successfully.", ml: "ഒഴിവാക്കി." },
  deleteFail: { en: "Deletion failed.", ml: "ഒഴിവാക്കാൻ കഴിഞ്ഞില്ല." },
  ago: { en: "{time} ago", ml: "{time} മുൻപ്" },
  plus1Karma: { en: "+1 Karma", ml: "+1 കർമ്മ" },

  // Leaderboard
  rankings: { en: "Neighborhood Rankings", ml: "നിങ്ങളുടെ നാട്ടിലെ റാങ്കിംഗ്" },
  weeklyRankings: { en: "Weekly Rankings", ml: "ഈ ആഴ്ചയിലെ റാങ്കിംഗ്" },
  resetsInDays: { en: "Resets in {days} days", ml: "{days} ദിവസത്തിനുള്ളിൽ പുതുക്കും" },
  noRankingsInDistrict: { en: "No rankings in {district} yet", ml: "{district}-ൽ റാങ്കിംഗ് ലഭ്യമല്ല" },
  claimSpotDesc: { en: "Be the first in your district to share an update and claim the top spot!", ml: "നിങ്ങളുടെ ജില്ലയിലെ ആദ്യ വാർത്ത പങ്കുവെച്ച് ഒന്നാം സ്ഥാനത്തെത്തൂ!" },
  startPosting: { en: "Start Posting", ml: "വാർത്തകൾ പങ്കുവെച്ചു തുടങ്ങൂ" },
  keepPosting: { en: "Keep Posting", ml: "തുടരുക" },
  pioneerTitle: { en: "You're a Pioneer! 🚀", ml: "നിങ്ങൾ ഒരു വഴികാട്ടിയാണ്! 🚀" },
  pioneerDesc: { en: "Be the first in {district} to claim the crown.", ml: "{district}-ൽ ഒന്നാമത്തെത്താൻ ആദ്യ വാർത്ത പങ്കുവെക്കൂ." },
  showingGlobal: { en: "Showing All Kerala Rankings", ml: "കേരളത്തിലെ റാങ്കിംഗ് കാണിക്കുന്നു" },
  claimRank: { en: "Claim #1 Rank", ml: "ഒന്നാം സ്ഥാനം നേടൂ" },
  weekly: { en: "This Week", ml: "ഈ ആഴ്ച" },
  allTime: { en: "All Time", ml: "എക്കാലത്തെയും" },
  karmaPoints: { en: "Karma Points", ml: "കർമ്മ പോയിന്റുകൾ" },
  karmaDesc: { en: "Earn Karma by sharing helpful updates and verifying others.", ml: "വിവരങ്ങൾ പങ്കുവെക്കുന്നതിലൂടെയും മറ്റുള്ളവ ശരിവെക്കുന്നതിലൂടെയും കർമ്മ നേടാം." },
  pointsToNext: { en: "{points} to reach {rank}", ml: "{rank} റാങ്കിലെത്താൻ {points} പോയിന്റ് വേണം" },
  levelUp: { en: "Keep going!", ml: "തുടരുക!" },
  champion: { en: "Local Hero", ml: "ലോക്കൽ ഹീറോ" },
  leader: { en: "Leader", ml: "ലീഡർ" },
  contributor: { en: "Contributor", ml: "സഹായി" },
  statusNovice: { en: "Newbie", ml: "പുതിയ അംഗം" },
  statusActive: { en: "Active Member", ml: "സജീവ അംഗം" },
  statusHero: { en: "Neighborhood Star", ml: "നാട്ടിലെ താരം" },
  statusPath: { en: "Pathfinder", ml: "വഴികാട്ടി" },
  statusGuardian: { en: "Guardian", ml: "കാവലാൾ" },
  levelLabel: { en: "Level", ml: "നിലവാരം" },
  loadingRankings: { en: "Loading rankings...", ml: "റാങ്കിംഗ് ലോഡ് ചെയ്യുന്നു..." },
  topNattukarans: { en: "Top Neighbors", ml: "മുൻനിരക്കാർ" },
  ptsToReach: { en: "{pts} points to reach #{rank}", ml: "#{rank} റാങ്കിലെത്താൻ {pts} പോയിന്റ് വേണം" },
  toReachTop10: { en: "{pts} points to reach top 10", ml: "പത്താം സ്ഥാനത്തെത്താൻ {pts} പോയിന്റ് വേണം" },
  neighborhoodHero: { en: "Neighborhood Hero", ml: "നാട്ടിലെ താരം" },
  points: { en: "Points", ml: "പോയിന്റുകൾ" },
  yourStand: { en: "Your Current Standing", ml: "നിങ്ങളുടെ ഇപ്പോഴത്തെ സ്ഥാനം" },
  allKerala: { en: "All Kerala", ml: "കേരളം മുഴുവൻ" },
  districtLevel: { en: "{district} Level", ml: "{district} നിലവാരം" },
  keralaLevel: { en: "Kerala Level", ml: "കേരള നിലവാരം" },
  pioneerMode: { en: "Pioneer Mode", ml: "പയനിയർ മോഡ്" },
  lonelyLeaderTitle: { en: "It's lonely at the top! 👑", ml: "തലപ്പത്ത് ഒറ്റയ്ക്കാണോ? 👑" },
  lonelyLeaderDesc: { en: "You are the current #1 in {district}! Invite your neighbors to join the race and see who can catch up.", ml: "നിലവിൽ {district}-ൽ നിങ്ങളാണ് ഒന്നാമത്! ഈ മത്സരത്തിൽ പങ്കുചേരാൻ നിങ്ങളുടെ അയൽക്കാരെയും സുഹൃത്തുക്കളെയും ക്ഷണിക്കൂ." },
  inviteNeighbors: { en: "Invite Neighbors", ml: "അയൽക്കാരെ ക്ഷണിക്കൂ" },
  shareText: { en: "I'm the current #1 in {district} on NattuFeed! 🏆 Think you can beat my Karma? Join our neighborhood hub and let's see: {url}", ml: "നട്ടുഫീഡിൽ {district}-ൽ നിലവിൽ ഞാനാണ് ഒന്നാമത്! 🏆 എന്റെ കർമ്മ പോയിന്റുകൾ മറികടക്കാൻ ആർക്കെങ്കിലും സാധിക്കുമോ? നമുക്ക് നോക്കാം: {url}" },
  unlockLocalRanking: { en: "Set neighborhood to unlock local rankings!", ml: "ലോക്കൽ റാങ്കിംഗ് കാണാൻ പ്രദേശം തിരഞ്ഞെടുക്കൂ!" },
  setNeighborhood: { en: "Set Neighborhood", ml: "പ്രദേശം നൽകുക" },
  viewingKeralaDesc: { en: "You are currently viewing all-Kerala rankings. Complete your profile to see how you rank in your local district!", ml: "നിങ്ങൾ ഇപ്പോൾ കാണുന്നത് കേരള റാങ്കിംഗ് ആണ്. നിങ്ങളുടെ പ്രദേശം സെറ്റ് ചെയ്താൽ ലോക്കൽ റാങ്കിംഗ് കാണാം!" },
  // Guide & Help Center
  guideTitle: { en: "Community Guide 📖", ml: "നാട്ടുകാരുടെ വഴികാട്ടി 📖" },
  guideSub: { en: "Everything you need to know about NattuFeed.", ml: "നമ്മുടെ ആപ്പിനെക്കുറിച്ച് അറിയേണ്ടതെല്ലാം." },
  
  // Section: Radar Detail
  howToRadar: { en: "How to Bus Radar 🚌", ml: "റഡാർ എങ്ങനെ ഉപയോഗിക്കാം? 🚌" },
  radarExplanation: { en: "NattuFeed turns neighbors into 'Sensors'. When you spot a bus, you report it so others don't have to wait blindly at the stop.", ml: "ബസ് കാണുമ്പോൾ സമയം അറിയിക്കുന്നതിലൂടെ മറ്റുള്ളവരുടെ കാത്തിരിപ്പ് ഒഴിവാക്കാൻ നമുക്ക് സാധിക്കും." },
  radarStep1: { en: "Go near a verified stop (within 300m).", ml: "സ്റ്റോപ്പിന് 300 മീറ്റർ ചുറ്റളവിൽ എത്തുക." },
  radarStep2: { en: "Select 'Traffic' ➔ 'Bus' in the post menu.", ml: "പോസ്റ്റ് മെനുവിൽ 'Traffic' ➔ 'Bus' തിരഞ്ഞെടുക്കുക." },
  radarStep3: { en: "Choose the timing (On Time, Delayed, or Missed).", ml: "സമയം (On Time, Delayed, Missed) തിരഞ്ഞെടുക്കുക." },
  radarExpiryNote: { en: "Radar posts expire after 20 minutes to keep the data fresh.", ml: "വിവരങ്ങൾ കൃത്യമായിരിക്കാൻ 20 മിനിറ്റിന് ശേഷം ഇവ തനിയെ നീക്കം ചെയ്യപ്പെടും." },

  // Section: Karma Detail
  whyKarma: { en: "The Karma System ✨", ml: "എന്താണ് കർമ്മ പോയിന്റ്? ✨" },
  karmaExplanation: { en: "Karma represents your contribution to the community. Higher Karma unlocks trust and higher ranking.", ml: "നിങ്ങൾ സമൂഹത്തിന് നൽകുന്ന സഹായത്തിന്റെ അടയാളമാണ് കർമ്മ. കൂടുതൽ പോയിന്റുകൾ നിങ്ങളെ നാട്ടിലെ താരമാക്കുന്നു." },
  earnKarma1: { en: "+1 for any helpful neighborhood update.", ml: "ഓരോ പോസ്റ്റിനും +1 കർമ്മ ലഭിക്കും." },
  earnKarma2: { en: "+2 for verifiable Bus Radar entries.", ml: "ഓരോ റഡാർ എൻട്രിക്കും +2 കർമ്മ ലഭിക്കും." },
  earnKarma3: { en: "+1 when others 'Verify' your update.", ml: "മറ്റുള്ളവർ നിങ്ങളുടെ പോസ്റ്റ് ശരിവെക്കുമ്പോൾ +1 ലഭിക്കും." },

  // Section: Categories Detail
  whatToPost: { en: "What to Post? 📢", ml: "എന്താണ് പോസ്റ്റ് ചെയ്യേണ്ടത്? 📢" },
  catTrafficDesc: { en: "Accidents, blocks, or bus updates.", ml: "അപകടങ്ങൾ, ബ്ലോക്കുകൾ, അല്ലെങ്കിൽ ബസ് വിവരങ്ങൾ." },
  catUtilityDesc: { en: "Power cuts, water issues, or KSEB work.", ml: "കറന്റ് കട്ട്, പൈപ്പ് പൊട്ടൽ മുതലായവ." },
  catMarketDesc: { en: "Daily prices, fresh arrivals, or local sales.", ml: "മാർക്കറ്റ് വിലകൾ, മറ്റു കച്ചവട വിവരങ്ങൾ." },
  catAlertsDesc: { en: "Urgent warnings, strikes, or health alerts.", ml: "അത്യാവശ്യ മുന്നറിയിപ്പുകൾ, സമരങ്ങൾ മുതലായവ." },

  // Section: Moderation
  beSafe: { en: "Community Rules 🛡️", ml: "സമൂഹത്തിലെ നിയമങ്ങൾ 🛡️" },
  safetyExplanation: { en: "We use a neighborhood-watch system. 5 reports will automatically hide a post for review.", ml: "തെറ്റായ വിവരങ്ങൾ നൽകരുത്. 5 റിപ്പോർട്ടുകൾ ലഭിച്ചാൽ പോസ്റ്റ് തനിയെ ഒഴിവാക്കപ്പെടും." },

  getStarted: { en: "Back to Feed", ml: "തിരികെ ഹോമിലേക്ക്" },
  readGuide: { en: "New here? Read our Guide", ml: "പുതിയ അംഗമാണോ? വഴികാട്ടി വായിക്കൂ" },
  helpCenter: { en: "Help Center", ml: "സഹായ കേന്ദ്രം" },

  // Profile / Settings
  myProfile: { en: "My Profile", ml: "എന്റെ പ്രൊഫൈൽ" },
  myUpdates: { en: "My Local Updates", ml: "എന്റെ വാർത്തകൾ" },
  totalKarma: { en: "Total Karma", ml: "ആകെ കർമ്മ" },
  weeklyKarma: { en: "Weekly Karma", ml: "ഈ ആഴ്ചയിലെ കർമ്മ" },
  karmaScore: { en: "Karma Score", ml: "കർമ്മ സ്കോർ" },
  neighborhoodLabel: { en: "Neighborhood", ml: "പ്രദേശം" },
  wardLabel: { en: "Ward", ml: "വാർഡ്" },
  editProfile: { en: "Edit Profile", ml: "പ്രൊഫൈൽ മാറ്റുക" },
  updateIdentity: { en: "Update your neighborhood identity", ml: "നിങ്ങളുടെ പ്രൊഫൈൽ വിവരങ്ങൾ മാറ്റുക" },

  // Age Groups
  selectAgeTitle: { en: "Which group describes you?", ml: "നിങ്ങളുടെ പ്രായം എത്രയാണ്?" },
  ageYouth: { en: "Youth (< 18)", ml: "18 വയസ്സിന് താഴെ" },
  ageYoungAdult: { en: "Young Adult (18-35)", ml: "18-35 വയസ്സ്" },
  ageMiddleAge: { en: "Middle Age (36-60)", ml: "36-60 വയസ്സ്" },
  ageSenior: { en: "Senior (60+)", ml: "60 വയസ്സിന് മുകളിൽ" },
  optionalLabel: { en: "(Optional)", ml: "(നിർബന്ധമില്ല)" },
  ageGroup: { en: "Age Group", ml: "പ്രായപരിധി" },
  locationTrustNote: { en: "Precise locations build community trust.", ml: "വാർത്തകൾ വിശ്വസനീയമാകാൻ കൃത്യമായ പ്രദേശം നൽകുക." },
  profileIdentityBonus: { en: "Complete profile for +10 KarmaPoints.", ml: "പ്രൊഫൈൽ പൂർത്തിയാക്കിയാൽ 10 പോയിന്റുകൾ ലഭിക്കും." },
  searchBodyNote: { en: "Select your Local Body for accurate updates.", ml: "കൃത്യമായ വിവരങ്ങൾക്കായി പ്രദേശം തിരഞ്ഞെടുക്കുക." },
  myPostsTitle: { en: "My Local Updates", ml: "എന്റെ വാർത്തകൾ" },
  noPostsSub: { en: "You haven't posted any updates yet.", ml: "നിങ്ങൾ ഇതുവരെ വാർത്തകളൊന്നും പങ്കുവെച്ചിട്ടില്ല." },
  signOut: { en: "Sign Out", ml: "പുറത്തിറങ്ങുക" },
  secureDisconnect: { en: "Securely disconnect", ml: "സുരക്ഷിതമായി പുറത്തിറങ്ങുക" },
  whatsappFeedback: { en: "WhatsApp Feedback", ml: "വാട്സാപ്പ് ഫീഡ്ബാക്ക്" },
  directChat: { en: "Direct chat with founder", ml: "നേരിട്ട് സംസാരിക്കുക" },
  locating: { en: "Locating...", ml: "സ്ഥാനം കണ്ടെത്തുന്നു..." },
  lowAccuracyRadar: { en: "High-accuracy GPS (Mobile) is required for Bus Radar to prevent fake reports.", ml: "വ്യാജ റിപ്പോർട്ടുകൾ ഒഴിവാക്കാൻ ബസ് രാഡാർ ഉപയോഗിക്കാൻ കൃത്യമായ ജിപിഎസ് (മൊബൈൽ) ആവശ്യമാണ്." },
  gpsLocked: { en: "High-Accuracy GPS Locked. Ready to Radar.", ml: "ജിപിഎസ് ലൊക്കേഷൻ ഉറപ്പുവരുത്തി. ബസ് രാഡാർ അയക്കാൻ തയ്യാറാണ്." },
  feedbackPlaceholder: { en: "What's on your mind? Suggestions, bugs...", ml: "എന്തെങ്കിലും നിർദ്ദേശങ്ങൾ, പരാതികൾ ഉണ്ടോ?" },
  sendToWhatsApp: { en: "Send via WhatsApp", ml: "വാട്സാപ്പ് വഴി അയക്കുക" },
  guardianTitle: { en: "NattuFeed Sentinel", ml: "നട്ടുഫീഡിന്റെ കാവലാൾ" },
  deleteAccount: { en: "Delete Account", ml: "അക്കൗണ്ട് ഒഴിവാക്കുക" },
  deleteAccountConfirm: { en: "This action is permanent and IRREVERSIBLE. All your posts, karma, and profile data will be permanently wiped from our servers. Are you sure?", ml: "ഈ നടപടി ശാശ്വതമാണ്, മാറ്റാൻ കഴിയില്ല. നിങ്ങളുടെ എല്ലാ വാർത്തകളും, കർമ്മ പോയിന്റുകളും, പ്രൊഫൈലും ഞങ്ങളുടെ സെർവറുകളിൽ നിന്ന് എന്നെന്നേക്കുമായി നീക്കം ചെയ്യപ്പെടും. നിങ്ങൾക്ക് ഉറപ്പാണോ?" },
  deleteAccountSuccess: { en: "Your account and data have been permanently erased. Goodbye!", ml: "നിങ്ങളുടെ അക്കൗണ്ടും മുഴുവൻ വിവരങ്ങളും എന്നെന്നേക്കുമായി നീക്കം ചെയ്തു. നന്ദി!" },
  deleteAccountFail: { en: "Failed to delete account. Please try again or contact support.", ml: "അക്കൗണ്ട് ഒഴിവാക്കാൻ കഴിഞ്ഞില്ല. ദയവായി വീണ്ടും ശ്രമിക്കുക അല്ലെങ്കിൽ ഞങ്ങളെ ബന്ധപ്പെടുക." },
  reauthRequired: { en: "Security verification needed. Please log out and sign back in before deleting your account.", ml: "സുരക്ഷാ പരിശോധന ആവശ്യമാണ്. അക്കൗണ്ട് ഒഴിവാക്കുന്നതിന് മുൻപായി ദയവായി ലോഗ് ഔട്ട് ചെയ്ത് വീണ്ടും ലോഗിൻ ചെയ്യുക." },
  language: { en: "Language / ഭാഷ", ml: "Language / ഭാഷ" },
  location: { en: "Location", ml: "സ്ഥലം" },
  district: { en: "District", ml: "ജില്ല" },
  panchayat: { en: "Local Body", ml: "പഞ്ചായത്ത്/നഗരസഭ" },
  ward: { en: "Ward", ml: "വാർഡ്" },
  updateSuccess: { en: "Profile updated successfully", ml: "പ്രൊഫൈൽ പുതുക്കി" },
  profileUpdated: { en: "Profile updated!", ml: "പ്രൊഫൈൽ മാറ്റി!" },
  failedToUpdateProfile: { en: "Failed to update profile", ml: "പ്രൊഫൈൽ പുതുക്കാൻ കഴിഞ്ഞില്ല" },
  saveChanges: { en: "Save Changes", ml: "സേവ് ചെയ്യുക" },
  searchPanchayatPlaceholder: { en: "Search Panchayat/Municipality...", ml: "പഞ്ചായത്ത്/മുനിസിപ്പാലിറ്റി തിരയുക..." },
  wardStreetOptional: { en: "Ward / Street (Optional)", ml: "വാർഡ് / തെരുവ് (നിർബന്ധമില്ല)" },
  wardStreetPlaceholder: { en: "e.g. Ward 5 or MG Road", ml: "ഉദാ: വാർഡ് 5 അല്ലെങ്കിൽ എം.ജി റോഡ്" },
  notSet: { en: "Not set", ml: "സജ്ജമാക്കിയിട്ടില്ല" },
  primaryLocation: { en: "Primary Location", ml: "പ്രധാന സ്ഥലം" },
  searchLocalBody: { en: "Search Local Body", ml: "പഞ്ചായത്ത്/നഗരസഭ" },
  fullNamePlaceholder: { en: "Enter your full name", ml: "പേര് നൽകുക" },
  noMatchesFound: { en: "No matches found", ml: "ലഭ്യമല്ല" },
  nameRequired: { en: "Name is required", ml: "പേര് നൽകുക" },
  noRankingsYet: { en: "No rankings yet", ml: "റാങ്കിംഗ് ലഭ്യമല്ല" },
  citizen: { en: "Neighbor", ml: "അയൽവാസി" },
  notAvailable: { en: "N/A", ml: "ലഭ്യമല്ല" },

  // Legal Pages
  privacyPolicyTitle: { en: "Privacy Policy", ml: "സ്വകാര്യതാ നയം" },
  termsOfServiceTitle: { en: "Terms of Service", ml: "നിബന്ധനകൾ" },
  lastUpdated: { en: "Last updated: March 2026", ml: "അവസാനം പുതുക്കിയത്: മാർച്ച് 2026" },
  contactLabel: { en: "Contact", ml: "ബന്ധപ്പെടുക" },
  questionsPrivacy: { en: "Questions about your privacy? Email us at", ml: "നിങ്ങളുടെ സ്വകാര്യതയെക്കുറിച്ച് ചോദ്യങ്ങളുണ്ടോ? മെയിൽ അയക്കുക:" },
  questionsTerms: { en: "Questions about our terms? Email us at", ml: "നിബന്ധനകളെക്കുറിച്ച് ചോദ്യങ്ങളുണ്ടോ? മെയിൽ അയക്കുക:" },
  
  privacyHeroIntro: { 
    en: "NattuFeed is a hyperlocal community app for neighborhoods in Kerala. We are committed to being transparent about what data we collect and why. This policy explains our practices in plain language.", 
    ml: "കേരളത്തിലെ അയൽപക്കങ്ങൾക്കായുള്ള ലോക്കൽ കമ്മ്യൂണിറ്റി ആപ്പാണ് NattuFeed. ഞങ്ങൾ ശേഖരിക്കുകയും ഉപയോഗിക്കുകയും ചെയ്യുന്ന വിവരങ്ങളെക്കുറിച്ച് സുതാര്യത ഉറപ്പാക്കാൻ ഞങ്ങൾ ബാധ്യസ്ഥരാണ്." 
  },

  // Onboarding / QuickSetup
  skipSetup: { en: "Skip", ml: "ഒഴിവാക്കുക" },
  editYourNeighborhood: { en: "Update Your Neighborhood", ml: "പ്രദേശം മാറ്റം വരുത്തുക" },
  onboardingTitle: { en: "Let's Get Started", ml: "നമുക്ക് തുടങ്ങാം!" },
  editLocationSub: { en: "Adjust your local area settings.", ml: "നിങ്ങളുടെ പ്രദേശം മാറ്റം വരുത്തുക." },
  onboardingSub: { en: "Tell us where you live to see local updates.", ml: "നിങ്ങളുടെ പ്രദേശത്തെക്കുറിച്ചുള്ള വിവരങ്ങൾ നൽകുക." },
  selectDistrict: { en: "Select your district", ml: "ജില്ല തിരഞ്ഞെടുക്കുക" },
  backDistricts: { en: "Back to districts", ml: "ജില്ലയിലേക്ക് തിരിച്ചു പോകുക" },
  searchBody: { en: "Select Panchayat/Municipality", ml: "പഞ്ചായത്ത്/നഗരസഭ തിരഞ്ഞെടുക്കുക" },
  searchPlaceholder: { en: "Search...", ml: "തിരയുക..." },
  using: { en: "Using {value}", ml: "{value} തിരഞ്ഞെടുത്തിരിക്കുന്നു" },
  backBodies: { en: "Local bodies in {district}", ml: "{district}-ലെ വിവിരങ്ങൾ" },
  wardTitle: { en: "Enter Ward / Area", ml: "വാർഡ് തിരഞ്ഞെടുക്കുക" },
  wardPlaceholder: { en: "Ward number or area name", ml: "വാർഡ് നമ്പർ അല്ലെങ്കിൽ പേര്" },
  saving: { en: "Saving...", ml: "സംരക്ഷിക്കുന്നു..." },
  finish: { en: "Finish Setup", ml: "പൂർത്തിയാക്കുക" },
  outsideKerala: { en: "Outside Kerala", ml: "കേരളത്തിന് പുറത്ത്" },
  keralaOnlyRequirement: { en: "NattuFeed is currently only available for users physically within Kerala.", ml: "നട്ടുഫീഡ് നിലവിൽ കേരളത്തിലുള്ളവർക്ക് മാത്രമേ ലഭ്യമാകൂ." },

  // Privacy Sections
  privacyCollectTitle: { en: "What We Collect", ml: "ശേഖരിക്കുന്ന വിവരങ്ങൾ" },
  privacyCollect1: { en: "Account information: Your name, email address, and profile photo obtained from your Google account when you sign in.", ml: "അക്കൗണ്ട് വിവരങ്ങൾ: നിങ്ങളുടെ പേര്, ഇമെയിൽ, പ്രൊഫൈൽ ചിത്രം എന്നിവ ഗൂഗിൾ സൈൻ ഇൻ വഴി ശേഖരിക്കുന്നു." },
  privacyCollect2: { en: "Location data: Your precise GPS coordinates, collected only when the app is open and in use. This is required to show you posts from your local area (~2km radius). We do not track your location in the background.", ml: "ലൊക്കേഷൻ വിവരങ്ങൾ: ആപ്പ് ഉപയോഗിക്കുമ്പോൾ മാത്രം നിങ്ങളുടെ ലൊക്കേഷൻ വിവരങ്ങൾ ശേഖരിക്കുന്നു. ഇത് നിങ്ങളുടെ പ്രദേശത്തുള്ള വാർത്തകൾ കാണിക്കുന്നതിനായി മാത്രമാണ്." },
  privacyCollect3: { en: "Content you create: Posts, headlines, and details you submit to the feed.", ml: "നിങ്ങൾ പങ്കുവെക്കുന്ന വിവരങ്ങൾ: ഫീഡിലേക്ക് നിങ്ങൾ നൽകുന്ന പോസ്റ്റുകളും ഹെഡ്‌ലൈനുകളും വിവരങ്ങളും." },
  privacyCollect4: { en: "Usage data: Which posts you verify (\"Me Too\") or flag. This is used to calculate your Karma score.", ml: "ഉപയോഗ വിവരങ്ങൾ: നിങ്ങൾ ശരിവെക്കുന്ന അല്ലെങ്കിൽ ഫ്ലാഗ് ചെയ്യുന്ന പോസ്റ്റുകൾ. ഇത് കർമ്മ സ്കോർ കണക്കാക്കുന്നതിനായി ഉപയോഗിക്കുന്നു." },

  privacyUsageTitle: { en: "How We Use Your Data", ml: "വിവരങ്ങൾ എങ്ങനെ ഉപയോഗിക്കുന്നു" },
  privacyUsage1: { en: "To show you a real-time feed of posts within your neighborhood.", ml: "നിങ്ങളുടെ പ്രദേശത്തെ തത്സമയ വാർത്തകൾ കാണിക്കുന്നതിന്." },
  privacyUsage2: { en: "To display your name and photo on posts you create and on the leaderboard.", ml: "നിങ്ങൾ പങ്കുവെക്കുന്ന പോസ്റ്റുകളിലും ലീഡർബോർഡിലും നിങ്ങളുടെ പേരും ഫോട്ടോയും കാണിക്കുന്നതിന്." },
  privacyUsage3: { en: "To calculate and display your Karma score.", ml: "നിങ്ങളുടെ കർമ്മ സ്കോർ കണക്കാക്കി പ്രദർശിപ്പിക്കുന്നതിന്." },
  privacyUsage4: { en: "We do not sell your personal data to any third party. We do not serve advertisements based on your data.", ml: "ഞങ്ങൾ നിങ്ങളുടെ വിവരങ്ങൾ ആർക്കും നൽകില്ല. പരസ്യങ്ങൾക്കായി നിങ്ങളുടെ വിവരങ്ങൾ ഉപയോഗില്ല." },

  privacyThirdPartyTitle: { en: "Third-Party Services", ml: "മറ്റ് സേവനങ്ങൾ" },
  privacyThirdParty1: { en: "Firebase (Google LLC): We use Firebase Authentication to manage your login, and Cloud Firestore to store your account data and posts. Your data is stored on Google's servers in the asia-south1 (Mumbai, India) region.", ml: "ഫയർബേസ് (ഗൂഗിൾ): ലോഗിൻ ചെയ്യുന്നതിനും വിവരങ്ങൾ സൂക്ഷിക്കുന്നതിനും ഞങ്ങൾ ഫയർബേസ് ഉപയോഗിക്കുന്നു. നിങ്ങളുടെ വിവരങ്ങൾ ഗൂഗിളിന്റെ കമ്പ്യൂട്ടറുകളിൽ സുരക്ഷിതമായിരിക്കും." },
  privacyThirdParty2: { en: "Google Sign-In: When you log in with Google, we receive only your name, email, and profile photo.", ml: "ഗൂഗിൾ സൈൻ ഇൻ: നിങ്ങൾ ഗൂഗിൾ വഴി ലോഗിൻ ചെയ്യുമ്പോൾ പേര്, ഇമെയിൽ, ഫോട്ടോ എന്നിവ മാത്രമേ ഞങ്ങൾക്ക് ലഭിക്കൂ." },
  privacyThirdParty3: { en: "These services have their own privacy policies. We encourage you to review Google's Privacy Policy at policies.google.com.", ml: "ഈ സേവനങ്ങൾക്കെല്ലാം സ്വന്തം സ്വകാര്യതാ നയങ്ങളുണ്ട്. ഗൂഗിളിന്റെ നയങ്ങൾ policies.google.com-ൽ വായിക്കാവുന്നതാണ്." },

  privacyRightsTitle: { en: "Your Rights & Data Deletion", ml: "നിങ്ങളുടെ അവകാശങ്ങൾ" },
  privacyRights1: { en: "Under India's Digital Personal Data Protection Act (DPDPA) 2023, you have the right to access, correct, and erase your personal data.", ml: "ഇന്ത്യയുടെ DPDPA 2023 പ്രകാരം നിങ്ങളുടെ വിവരങ്ങളിൽ മാറ്റം വരുത്താനോ അത് ഒഴിവാക്കാനോ നിങ്ങൾക്ക് അവകാശമുണ്ട്." },
  privacyRights2: { en: "To delete your account and all associated data, go to Profile → Settings → Delete Account. This action is permanent.", ml: "അക്കൗണ്ടും വിവരങ്ങളും നീക്കം ചെയ്യാൻ പ്രൊഫൈൽ -> സെറ്റിംഗ്സ് -> ഡിലീറ്റ് അക്കൗണ്ട് ഉപയോഗിക്കുക." },
  privacyRights3: { en: "To request a copy of your data or raise a concern, contact us at nimbact@gmail.com. We will respond within 30 days.", ml: "നിങ്ങളുടെ വിവരങ്ങളെക്കുറിച്ച് കൂടുതൽ അറിയാൻ nimbact@gmail.com എന്ന ഇമെയിലിൽ ബന്ധപ്പെടുക." },

  termsHeroIntro: { 
    en: "By using NattuFeed, you agree to these terms. Please read them carefully. They protect both you and the community you are part of.", 
    ml: "NattuFeed ഉപയോഗിക്കുന്നതിലൂടെ നിങ്ങൾ ഈ നിബന്ധനകൾ അംഗീകരിക്കുന്നു. ഇത് നിങ്ങൾക്കും കമ്മ്യൂണിറ്റിക്കും സുരക്ഷ നൽകുന്നു." 
  },

  // Terms Sections
  termsWhoTitle: { en: "Who Can Use NattuFeed", ml: "ആർക്കൊക്കെ ഉപയോഗിക്കാം?" },
  termsWho1: { en: "You must be at least 13 years of age to use NattuFeed.", ml: "നിങ്ങൾക്ക് കുറഞ്ഞത് 13 വയസ്സ് പ്രായമുണ്ടായിരിക്കണം." },
  termsWho2: { en: "You must provide accurate information when creating your account.", ml: "കൃത്യമായ വിവരങ്ങൾ നൽകി അക്കൗണ്ട് നിർമ്മിക്കുക." },
  termsWho3: { en: "You are responsible for maintaining the security of your account.", ml: "അക്കൗണ്ടിന്റെ സുരക്ഷാ ഉത്തരവാദിത്തം നിങ്ങൾക്കായിരിക്കും." },
  termsWho4: { en: "One account per person. Creating multiple accounts to game the Karma system is a violation of these terms.", ml: "ഒരാൾക്ക് ഒരു അക്കൗണ്ട് മാത്രം. കൂടുതൽ അക്കൗണ്ടുകൾ നിർമ്മിക്കുന്നത് നിയമവിരുദ്ധമാണ്." },

  termsContentTitle: { en: "Your Content & Our Rights", ml: "കന്റ്ന്റും അവകാശങ്ങളും" },
  termsContent1: { en: "You own the content you post. By posting, you grant NattuFeed a non-exclusive, royalty-free license to display your posts within the app to other users in your local area.", ml: "നിങ്ങളുടെ പോസ്റ്റുകളുടെ ഉടമസ്ഥാവകാശം നിങ്ങൾക്കാണ്. എന്നാൽ അത് ആപ്പിൽ പ്രദർശിപ്പിക്കാനുള്ള അനുമതി നിങ്ങൾ ഞങ്ങൾക്ക് നൽകുന്നു." },
  termsContent2: { en: "You confirm that your posts are truthful to the best of your knowledge. Deliberately posting false information is a violation of these terms.", ml: "നിങ്ങൾ നൽകുന്ന വിവരങ്ങൾ സത്യമാണെന്ന് ഉറപ്പുവരുത്തുക. തെറ്റായ വിവരങ്ങൾ നൽകുന്നത് നിരോധിച്ചിരിക്കുന്നു." },
  termsContent3: { en: "We do not claim ownership of your content. If you delete a post or your account, we will remove your content within 30 days.", ml: "നിങ്ങളുടെ വിവരങ്ങളുടെ ഉടമസ്ഥാവകാശം ഞങ്ങൾക്കില്ല. ഡിലീറ്റ് ചെയ്താൽ 30 ദിവസത്തിനുള്ളിൽ അത് ഭാഗികമായി നീക്കം ചെയ്യും." },

  termsProhibitedTitle: { en: "Prohibited Content", ml: "നിരോധിച്ചിട്ടുള്ളവ" },
  termsProhibited1: { en: "Misinformation or deliberately false reports about public safety, medical emergencies, or civic services.", ml: "പൊതു സുരക്ഷെയെ ബാധിക്കുന്ന വ്യാജ വാർത്തകളോ തെറ്റായ വിവരങ്ങളോ നൽകരുത്." },
  termsProhibited2: { en: "Hate speech, harassment, or content targeting individuals based on religion, caste, gender, or ethnicity.", ml: "വിദ്വേഷ പ്രസംഗങ്ങളോ മറ്റൊരാളെ വേദനിപ്പിക്കുന്ന രീതിയിലുള്ള പരാമർശങ്ങളോ അനുവദിക്കില്ല." },
  termsProhibited3: { en: "Personal information of others (phone numbers, addresses, photos) without their consent.", ml: "മറ്റൊരാളുടെ അനുവാദം കൂടാതെ അവരുടെ സ്വകാര്യ വിവരങ്ങൾ പങ്കുവെക്കരുത്." },
  termsProhibited4: { en: "Spam, commercial promotions, or repeated identical posts.", ml: "പരസ്യങ്ങൾ അല്ലെങ്കിൽ ഒരേ പോസ്റ്റുകൾ ആവർത്തിക്കുന്നത് ഒഴിവാക്കുക." },
  termsProhibited5: { en: "Content that violates any applicable Indian law including the IT Act 2000 and DPDPA 2023.", ml: "ഇന്ത്യയിലെ നിയമങ്ങൾ ലംഘിക്കുന്ന രീതിയിലുള്ള പോസ്റ്റുകൾ അനുവദിക്കില്ല." },

  termsKarmaTitle: { en: "Karma System", ml: "കർമ്മ സിസ്റ്റം" },
  termsKarma1: { en: "Karma is a trust score within NattuFeed. It has no monetary value and cannot be exchanged, transferred, or redeemed.", ml: "കർമ്മ സ്കോർ വിശ്വാസ്യതയുടെ അടയാളമാണ്. ഇതിന് പണമായോ മറ്റോ മാറ്റാൻ കഴിയില്ല." },
  termsKarma2: { en: "We reserve the right to adjust or reset Karma scores if we detect abuse, gaming, or coordinated inauthentic behavior.", ml: "തെറ്റായ രീതിയിൽ പോയിന്റ് വർദ്ധിപ്പിക്കാൻ ശ്രമിച്ചാൽ സ്കോർ റീസെറ്റ് ചെയ്യുന്നതായിരിക്കും." },
  termsKarma3: { en: "Leaderboard rankings are recalculated weekly and are for community recognition only.", ml: "ലീഡർബോർഡ് റാങ്കിംഗ് ആഴ്ചയിൽ ഒരിക്കൽ പുതുക്കുന്നതാണ്." },

  termsModerationTitle: { en: "Moderation & Termination", ml: "നിയന്ത്രണങ്ങൾ" },
  termsModeration1: { en: "We reserve the right to remove any content that violates these terms, without prior notice.", ml: "നിയമം ലംഘിക്കുന്ന പോസ്റ്റുകൾ മുന്നറിയിപ്പില്ലാതെ നീക്കം ചെയ്യാൻ ഞങ്ങൾക്ക് അവകാശമുണ്ട്." },
  termsModeration2: { en: "Accounts that repeatedly violate these terms may be suspended or permanently banned.", ml: "നിയമം ആവർത്തിച്ച് ലംഘിച്ചാൽ അക്കൗണ്ട് എന്നെന്നേക്കുമായി റദ്ദാക്കുന്നതായിരിക്കും." },
  termsModeration3: { en: "Posts that receive 3 or more community flags are automatically hidden pending admin review.", ml: "മൂന്നിൽ കൂടുതൽ റിപ്പോർട്ടുകൾ ലഭിച്ചാൽ പോസ്റ്റ് താൽക്കാലികമായി മറയ്ക്കപ്പെടും." },
  termsModeration4: { en: "You may appeal a moderation decision by contacting nimbact@gmail.com with the subject line \"Appeal\".", ml: "പരാതികൾ ഉണ്ടെങ്കിൽ nimbact@gmail.com-ൽ ബന്ധപ്പെടുക." },

  termsLiabilityTitle: { en: "Liability & Governing Law", ml: "നിയമപരമായ കാര്യങ്ങൾ" },
  termsLiability1: { en: "NattuFeed is a platform for community information sharing. We are not responsible for the accuracy of user-generated content.", ml: "NattuFeed വിവരങ്ങൾ പങ്കുവെക്കാനുള്ള ഇടം മാത്രമാണ്. പോസ്റ്റുകളുടെ നിജസ്ഥിതിയിൽ ഞങ്ങൾ ഉത്തരവാദികളല്ല." },
  termsLiability2: { en: "Our liability is limited to the maximum extent permitted by applicable Indian law.", ml: "നിയമപരമായ പരിധികൾക്ക് ഉള്ളിൽ മാത്രമേ ഞങ്ങളുടെ ഉത്തരവാദിത്തം ഉണ്ടായിരിക്കുകയുള്ളൂ." },
  termsLiability3: { en: "These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Kannur, Kerala.", ml: "ഈ നിബന്ധനകൾ ഇന്ത്യൻ നിയമങ്ങൾക്ക് വിധേയമാണ്. പരാതികൾ കണ്ണൂർ കോടതിയുടെ പരിധിയിൽ മാത്രമായിരിക്കും." },
  termsLiability4: { en: "We may update these terms from time to time.", ml: "കാലാകാലങ്ങളിൽ ഈ നിബന്ധനകളിൽ മാറ്റം വരുത്താൻ ഞങ്ങൾക്ക് അവകാശമുണ്ട്" },

  // Offline Page
  offlineTitle: { en: "You're Offline", ml: "നിങ്ങൾ ഓഫ്‌ലൈനാണ്" },
  offlineDesc: { en: "NattuFeed requires an internet connection to load new posts. Please check your network.", ml: "പുതിയ വിവരങ്ങൾ ലഭിക്കുന്നതിന് ഇന്റർനെറ്റ് കണക്ഷൻ ആവശ്യമാണ്. ദയവായി നെറ്റ്വർക്ക് പരിശോധിക്കുക." },
  retryLabel: { en: "Try Again", ml: "വീണ്ടും ശ്രമിക്കുക" },

  // PWA Prompts
  installApp: { en: "Install NattuFeed", ml: "നട്ടുഫീഡ് ഇൻസ്റ്റാൾ ചെയ്യുക" },
  installAppDesc: { en: "Add to home screen for faster access", ml: "എളുപ്പത്തിൽ ഉപയോഗിക്കാൻ ഹോം സ്ക്രീനിലേക്ക് ചേർക്കുക" },
  tapShare: { en: "Tap Share", ml: "Share ടാപ്പ് ചെയ്യുക" },
  install: { en: "Install", ml: "ഇൻസ്റ്റാൾ" },
  addToHome: { en: "Add to Home", ml: "ഹോം സ്ക്രീനിലേക്ക് ചേർക്കുക" },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, variables?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const saved = localStorage.getItem("nattu_lang") as Language;
    if (saved && (saved === "en" || saved === "ml")) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("nattu_lang", lang);
  };

  const t = (key: string, variables?: Record<string, string>) => {
    // Robust access to handle potential edge cases
    const entry = translations[key];
    if (!entry) return key;
    
    let text = entry[language] || entry["en"] || key;
    
    if (variables) {
      Object.entries(variables).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, v);
      });
    }
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};
