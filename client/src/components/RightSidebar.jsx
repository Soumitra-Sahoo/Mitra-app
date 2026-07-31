import React from "react";
import SponsoredWidget from "./SponsoredWidget.jsx";
import TrendingTopicsWidget from "./TrendingTopicsWidget.jsx";
import SuggestedConnectionsWidget from "./SuggestedConnectionsWidget.jsx";
import RecentMessagesWidget from "./RecentMessagesWidget.jsx";

const RightSidebar = () => {
  return (
    <div className="max-xl:hidden w-80 flex-shrink-0 sticky top-4 space-y-4 self-start">
      <SponsoredWidget />
      <TrendingTopicsWidget />
      <SuggestedConnectionsWidget />
      <RecentMessagesWidget />
    </div>
  );
};

export default RightSidebar;