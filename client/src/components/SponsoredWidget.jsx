import React from "react";
import { assets } from "../assets/assets.js";

const SponsoredWidget = () => {
  return (
    <div className="bg-card border border-border text-xs p-4 rounded-2xl flex flex-col gap-2 shadow-sm">
      <h3 className="text-foreground font-semibold">Sponsored</h3>
      <img src={assets.sponsored_img} alt="" className="w-full rounded-xl" />
      <p className="text-foreground-secondary font-medium">Email marketing</p>
      <p className="text-muted">
        Supercharge your marketing with a powerful, easy-to-use platform built for results.
      </p>
    </div>
  );
};

export default SponsoredWidget;