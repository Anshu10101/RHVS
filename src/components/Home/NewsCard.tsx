import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, User } from 'lucide-react';

interface NewsCardProps {
  id: number;
  title: string;
  content: string;
  image_url?: string;
  created_at: string;
  district?: string | null;
  state?: string | null;
  district_id?: string | null; // For backward compatibility
  state_id?: string | null; // For backward compatibility
  added_by_name?: string | null;
  showDistrictInfo?: boolean;
}

export default function NewsCard({
  id,
  title,
  content,
  image_url,
  created_at,
  district,
  state,
  district_id, // For backward compatibility
  state_id, // For backward compatibility
  added_by_name,
  showDistrictInfo = true
}: NewsCardProps) {
  // Use district/state if available, fallback to district_id/state_id for backward compatibility
  const displayDistrict = district || district_id;
  const displayState = state || state_id;
  // Format date
  const formattedDate = new Date(created_at).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  // Truncate content for preview
  const truncatedContent = content.length > 150 
    ? content.substring(0, 150) + '...' 
    : content;

  return (
    <Card className="h-full flex flex-col overflow-hidden hover:shadow-md transition-shadow">
      {image_url && (
        <div className="relative w-full h-48">
          <Image
            src={image_url}
            alt={title}
            fill
            className="object-cover"
          />
        </div>
      )}
      <CardHeader className="pb-2">
        <CardTitle className="text-xl line-clamp-2">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pb-2 flex-grow">
        <p className="text-gray-600 text-sm line-clamp-3">{truncatedContent}</p>
      </CardContent>
      <CardFooter className="pt-2 text-sm text-gray-500 flex flex-col items-start gap-2">
        <div className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          <span>{formattedDate}</span>
        </div>
        
        {showDistrictInfo && displayDistrict && displayState && (
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {displayDistrict}, {displayState}
            </Badge>
            
            {added_by_name && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {added_by_name}
              </Badge>
            )}
          </div>
        )}
        
        <Link 
          href={`/news/${id}`} 
          className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2"
        >
          Read more →
        </Link>
      </CardFooter>
    </Card>
  );
}
