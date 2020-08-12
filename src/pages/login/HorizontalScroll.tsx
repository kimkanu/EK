import React from 'react';
import { useHorizontalScroll } from 'src/hooks/useScroll';

const HorizontalScroll: React.FC = ({ children }) => {
  const scrollRef = useHorizontalScroll();
  return (
    <div
      className="px-8 flex min-w-full justify-center overflow-y-hidden"
      style={{ maxHeight: 192 }}
    >
      <div
        ref={scrollRef}
        className="flex overflow-x-auto"
        style={{ minHeight: 224, paddingBottom: '17px' }}
      >
        {children}
      </div>
    </div>
  );
};

export default HorizontalScroll;
