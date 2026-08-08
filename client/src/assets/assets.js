import sample_cover from "./sample_cover.jpg";
import sample_profile from "./sample_profile.jpg";
import bgImage from "./bgImage.png";
import group_users from "./group_users.png";
import sponsored_img from "./sponsored_img.png";
import { Home, MessageCircle, Search, UserIcon, Users, Bell, Bookmark } from "lucide-react";

export const assets = {
  logoIconLight: "/favicon-light.png",
  logoIconDark: "/favicon-dark.png",
  logoBannerLight: "/logo-light.png",
  logoBannerDark: "/logo-dark.png",
  sample_cover,
  sample_profile,
  bgImage,
  group_users,
  sponsored_img,
};

export const menuItemsData = [
  { to: "/", label: "Home", Icon: Home },
  { to: "/messages", label: "Messages", Icon: MessageCircle },
  { to: "/connections", label: "Connections", Icon: Users },
  { to: "/discover", label: "Discover", Icon: Search },
  { to: "/notifications", label: "Notifications", Icon: Bell },
  { to: "/bookmarks", label: "Bookmarks", Icon: Bookmark },
  { to: "/profile", label: "Profile", Icon: UserIcon },
];