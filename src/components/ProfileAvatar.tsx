"use client";

import React, { useState } from "react";
import { User as UserIcon } from "lucide-react";

interface ProfileAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  border?: boolean;
}

export default function ProfileAvatar({
  src,
  name,
  size = "md",
  className = "",
  border = true
}: ProfileAvatarProps) {
  const [errored, setErrored] = useState(false);
  const initial = name?.trim()?.[0]?.toUpperCase() ?? "?";

  const sizeClasses = {
    xs: "w-6 h-6 text-[8px]",
    sm: "w-8 h-8 text-[10px]",
    md: "w-10 h-10 text-xs",
    lg: "w-16 h-16 text-xl",
    xl: "w-24 h-24 text-2xl"
  };

  const iconSizes = {
    xs: 12,
    sm: 14,
    md: 18,
    lg: 24,
    xl: 40
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-emerald-500", "bg-blue-500", "bg-primary",
      "bg-orange-500", "bg-purple-500", "bg-rose-500",
      "bg-amber-500", "bg-teal-500"
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const bgColor = name ? getAvatarColor(name) : "bg-gray-100";

  return (
    <div className={`
      ${sizeClasses[size]} 
      rounded-full 
      ${src && !errored ? "bg-gray-100" : bgColor}
      overflow-hidden 
      flex items-center justify-center 
      shrink-0 
      ${border ? "border-2 sm:border-4 border-white shadow-sm" : ""}
      ${className}
    `}>
      {src && !errored ? (
        <img
          src={src}
          alt={name ?? "Profile"}
          className="w-full h-full object-cover"
          onError={() => setErrored(true)}
        />
      ) : name ? (
        <span className="font-black text-white">{initial}</span>
      ) : (
        <UserIcon size={iconSizes[size]} className="text-gray-300" />
      )}
    </div>
  );
}
