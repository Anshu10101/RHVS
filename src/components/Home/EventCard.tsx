"use client";

import Link from "next/link";
import Image from "next/image";
import { Calendar, MapPin, Clock, ExternalLink, Users, User } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

interface EventCardProps {
  event: {
    id: string | number;
    title: string;
    title_hindi?: string;
    description?: string;
    image_path?: string;
    event_type?: string;
    event_date?: string;
    event_time?: string;
    end_date?: string;
    end_time?: string;
    location?: string;
    district?: string;
    state?: string;
    registration_required?: boolean;
    registration_url?: string;
    max_participants?: number;
    created_at?: string;
    creator_name?: string;
    creator_photo?: string;
    creator_email?: string;
  };
  onClick?: () => void;
}

const getEventTypeLabel = (type?: string) => {
  const labels: Record<string, string> = {
    festival: "त्योहार",
    meeting: "बैठक",
    workshop: "कार्यशाला",
    conference: "सम्मेलन",
    celebration: "उत्सव",
    other: "अन्य",
  };
  return labels[type || ""] || "कार्यक्रम";
};

const getEventTypeColor = (type?: string) => {
  const colors: Record<string, string> = {
    festival: "bg-orange-100 text-orange-800 border-orange-200",
    meeting: "bg-blue-100 text-blue-800 border-blue-200",
    workshop: "bg-purple-100 text-purple-800 border-purple-200",
    conference: "bg-indigo-100 text-indigo-800 border-indigo-200",
    celebration: "bg-pink-100 text-pink-800 border-pink-200",
    other: "bg-gray-100 text-gray-800 border-gray-200",
  };
  return colors[type || ""] || "bg-orange-100 text-orange-800 border-orange-200";
};

export default function EventCard({ event, onClick }: EventCardProps) {
  const displayTitle = event.title_hindi || event.title;
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      return format(date, "dd MMM yyyy");
    } catch {
      return null;
    }
  };

  const formatCreatedDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      return format(new Date(dateString), "dd MMM");
    } catch {
      return null;
    }
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return "RH";
  };

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <article className="group bg-white rounded-xl sm:rounded-2xl overflow-hidden border border-orange-100/60 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
      {/* Image */}
      {event.image_path && (
        <div className="relative w-full h-40 sm:h-56 md:h-64 overflow-hidden bg-gray-100">
          {onClick ? (
            <button
              type="button"
              onClick={handleClick}
              className="w-full h-full"
            >
              <Image
                src={event.image_path}
                alt={displayTitle}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </button>
          ) : (
            <Link href={`/events/${event.id}`}>
              <Image
                src={event.image_path}
                alt={displayTitle}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </Link>
          )}
        </div>
      )}

      <div className="p-3 sm:p-4 md:p-5 flex flex-col flex-1">
        {/* Category Tag & District/State Tags - Same Line */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-2 mb-2 sm:mb-3 flex-wrap">
          <span
            className={`inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold border ${getEventTypeColor(
              event.event_type
            )}`}
          >
            {getEventTypeLabel(event.event_type)}
          </span>
          
          {(event.district || event.state) && (
            <div className="flex items-center gap-1 sm:gap-2">
              {event.district && (
                <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-[10px] sm:text-xs font-medium">
                  <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span className="hidden xs:inline">{event.district}</span>
                </span>
              )}
              {event.state && (
                <span className="inline-flex items-center px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-green-50 text-green-700 border border-green-100 text-[10px] sm:text-xs font-medium">
                  <span className="hidden xs:inline">{event.state}</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Title */}
        {onClick ? (
          <button
            type="button"
            onClick={handleClick}
            className="text-left w-full"
          >
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-1.5 sm:mb-2 line-clamp-2 group-hover:text-orange-700 transition-colors">
              {displayTitle}
            </h3>
          </button>
        ) : (
          <Link href={`/events/${event.id}`}>
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-1.5 sm:mb-2 line-clamp-2 group-hover:text-orange-700 transition-colors">
              {displayTitle}
            </h3>
          </Link>
        )}

        {/* Description */}
        {event.description && (
          <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-4 line-clamp-2 flex-1">
            {event.description.length > 80 
              ? `${event.description.substring(0, 80)}...` 
              : event.description}
          </p>
        )}

        {/* Date & Time Info */}
        <div className="space-y-1 sm:space-y-2 mb-2 sm:mb-4 text-xs sm:text-sm text-gray-600">
          {event.event_date && (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500 flex-shrink-0" />
              <span className="truncate">{formatDate(event.event_date)}</span>
              {event.end_date && event.end_date !== event.event_date && (
                <span className="text-gray-400 hidden sm:inline">- {formatDate(event.end_date)}</span>
              )}
            </div>
          )}
          {event.event_time && 
           event.event_time !== "00:00:00" && 
           event.event_time !== "00:00" && 
           event.event_time.trim() !== "" && (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500 flex-shrink-0" />
              <span className="truncate">
                {event.event_time}
                {event.end_time && 
                 event.end_time !== "00:00:00" && 
                 event.end_time !== "00:00" && 
                 event.end_time !== event.event_time && 
                 event.end_time.trim() !== "" && (
                  <span className="text-gray-400 hidden sm:inline"> - {event.end_time}</span>
                )}
              </span>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500 flex-shrink-0" />
              <span className="line-clamp-1 text-xs sm:text-sm">{event.location}</span>
            </div>
          )}
        </div>

        {/* Registration & Max Participants */}
        {(event.registration_required || event.max_participants) && (
          <div className="flex items-center justify-between gap-2 mb-2 sm:mb-4 pt-1.5 sm:pt-2 border-t border-gray-100">
            {event.registration_required && event.registration_url && (
              <a
                href={event.registration_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 bg-orange-600 hover:bg-orange-700 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-[10px] sm:text-xs font-semibold transition-colors"
              >
                <span className="hidden sm:inline">पंजीकरण करें</span>
                <span className="sm:hidden">पंजीकरण</span>
                <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              </a>
            )}
            {event.max_participants && (
              <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-gray-500">
                <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                {event.max_participants} सीटें
              </span>
            )}
          </div>
        )}

        {/* Author Info */}
        <div className="flex items-center gap-2 sm:gap-3 pt-2 sm:pt-4 border-t border-gray-100">
          {event.creator_photo ? (
            <Avatar className="w-6 h-6 sm:w-8 sm:h-8">
              <AvatarImage
                src={event.creator_photo}
                alt={event.creator_name || "Admin"}
              />
              <AvatarFallback className="bg-orange-100 text-orange-700 text-[10px] sm:text-xs font-semibold">
                {getInitials(event.creator_name, event.creator_email)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-orange-100 flex items-center justify-center">
              <User className="w-3 h-3 sm:w-4 sm:h-4 text-orange-700" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
              {event.creator_name || "Admin"}
            </p>
            {formatCreatedDate(event.created_at) && (
              <p className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">Posted on {formatCreatedDate(event.created_at)}</p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

