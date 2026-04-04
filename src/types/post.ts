export type PostCategory = "Traffic" | "Utility" | "Market" | "Services" | "GigsJobs" | "Health" | "Alerts" | "TownTalk";

export const ALL_CATEGORIES: PostCategory[] = ["Traffic", "Utility", "Market", "Services", "GigsJobs", "Health", "Alerts", "TownTalk"];

export type PostSubType = 
  | "blood_request" | "ambulance" | "pharmacy_info" 
  | "electrician" | "plumber" | "driver" | "other"
  | "power_cut" | "water_issue" | "road_issue"
  | "job_full_time" | "job_part_time" | "gig_one_time"
  | null;

export type UrgencyLevel = "low" | "medium" | "high" | "urgent" | null;
export type ContactMode = "whatsapp" | "call" | null;


export interface Post {
  id: string;
  authorId: string;
  authorName?: string;
  authorPhoto?: string;
  headline: string;
  details?: string;
  landmark?: string;
  category: PostCategory;
  type: "general" | "bus_spott";
  lat: number;
  lng: number;
  authorLat?: number;
  authorLng?: number;
  district?: string;
  localBody?: string;
  verifiedCount: number;
  flagCount: number;
  reactions?: Record<string, number>;
  anchorId?: string | null;
  anchorName?: string | null;
  timingStatus?: "on_time" | "delayed" | "just_missed" | null;
  colorTag?: string | null;
  isHidden: boolean;
  isBusinessPost: boolean;
  authorKarmaAtPost?: number;
  authorRole?: string;
  isOfficial?: boolean;
  trustScore?: number;
  createdAt: any;
  expiresAt?: any;
  viewCount?: number;

  // New Resolution & Category Fields
  subType?: PostSubType;
  urgencyLevel?: UrgencyLevel;
  contactMode?: ContactMode;
  contactPhone?: string;
  isResolved?: boolean;
  resolvedAt?: any;
  reward?: string;
  isInformational?: boolean;
}
