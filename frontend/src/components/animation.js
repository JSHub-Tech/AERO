import { useEffect, useState, useRef } from 'react';

export function useAnimateOnScroll() {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Toggle state every time it enters/leaves the viewport
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold: 0.15 } // Triggers when 15% of the element is visible
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return [ref, isIntersecting];
}