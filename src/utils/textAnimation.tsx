import React from 'react';

// Helper function to split text into characters for animation
// Uses Intl.Segmenter for proper grapheme cluster handling (important for Hindi/Devanagari)
export const splitText = (text: string): React.ReactElement[] => {
  // Check if Intl.Segmenter is available (modern browsers)
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    try {
      // Use Intl.Segmenter for proper Unicode grapheme segmentation
      // This handles complex scripts like Devanagari correctly
      const segmenter = new Intl.Segmenter('hi', { granularity: 'grapheme' });
      const segments = Array.from(segmenter.segment(text));
      
      return segments.map((segment, index) => (
        <span key={index} style={{ "--i": index } as React.CSSProperties}>
          {segment.segment === ' ' ? '\u00A0' : segment.segment}
        </span>
      ));
    } catch (e) {
      // Fallback if Segmenter fails
      console.warn('Intl.Segmenter not available, using fallback');
    }
  }
  
  // Fallback: Use regex to match grapheme clusters (works for most cases)
  // This regex matches Devanagari characters with their combining marks
  const graphemeRegex = /(\p{L}\p{M}*|\p{N}|\p{P}|\s)/gu;
  const matches = text.match(graphemeRegex) || [];
  
  return matches.map((char, index) => (
    <span key={index} style={{ "--i": index } as React.CSSProperties}>
      {char === ' ' ? '\u00A0' : char}
    </span>
  ));
};

