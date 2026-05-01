// ─── Post Types ───

export type PostType = "Apartment" | "House" | "Studio" | "Room" | "Shared Space";
export type PostPurpose = "offer" | "request";

export interface Post {
  id: string;
  title: string;
  type: PostType;
  postType: PostPurpose;
  description: string;
  price?: string | null;
  location?: string | null;
  wilaya?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  amenities: string[];
  tags: string[];
  images: string[];
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
  author?: UserSummary;
}

export interface PostFormData {
  title: string;
  type: PostType;
  postType: PostPurpose;
  description: string;
  price: string;
  location: string;
  wilaya: string;
  bedrooms: string;
  bathrooms: string;
  amenities: string;
  tags: string;
}

// ─── User Types ───

export interface UserSummary {
  id: string;
  name: string;
  image?: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  lastName?: string | null;
  phone?: string | null;
  gender?: string | null;
  birthday?: Date | null;
  bio?: string | null;
  wilaya?: string | null;
  city?: string | null;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile extends User {
  posts: Post[];
}

// ─── Message Types ───

export interface Message {
  id: string;
  text: string;
  createdAt: Date;
  senderId: string;
  sender?: UserSummary;
  conversationId: string;
}

export interface Conversation {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  participantIds: string[];
  participants?: UserSummary[];
  messages?: Message[];
  lastMessage?: Message;
}

// ─── Navigation Types ───

export interface MenuItem {
  label: string;
  path: string;
  icon: string; // icon name string, mapped to component in client code
  requiresAuth?: boolean;
  onClick?: () => void;
}
