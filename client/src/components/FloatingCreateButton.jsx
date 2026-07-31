import React from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";

const FloatingCreateButton = () => {
  return (
    <Link
      to="/create-post"
      className="sm:hidden fixed bottom-20 right-4 z-20 size-14 rounded-full bg-gradient-to-r from-gradient-start to-gradient-end text-white shadow-lg flex items-center justify-center hover:brightness-110 active:scale-95 transition"
      aria-label="Create post"
    >
      <Plus className="size-6" />
    </Link>
  );
};

export default FloatingCreateButton;