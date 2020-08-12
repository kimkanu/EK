import React, { useState, useEffect } from 'react';
import { useVerticalScroll } from 'src/hooks/useScroll';

const VerticalScroll: React.FC = React.memo(({ children }) => {
  const [position, setPosition] = useState<number>(0);
  const scrollRef = useVerticalScroll({ val: position, setVal: setPosition });
  useEffect(() => {
    let t = setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: position });
      } else {
        t = setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: position });
          }
        }, 20);
      }
    }, 0);
    return () => {
      clearTimeout(t);
    };
  }, [children]);

  console.log(position)

  return (
    <div className="overflow-hidden w-56">
      <div className="overflow-y-auto w-64" style={{ height: 'calc(100vh - 12rem)' }} ref={scrollRef}>
        {children}
      </div>
    </div>
  );
});

export default VerticalScroll;
