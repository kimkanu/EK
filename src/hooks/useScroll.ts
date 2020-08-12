import React, {
  useRef, useEffect, useState, Dispatch, SetStateAction,
} from 'react';

export function useHorizontalScroll(): React.MutableRefObject<HTMLDivElement | null> {
  const elRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<number>(0);
  useEffect(() => {
    const el = elRef.current;
    if (el) {
      const onWheel: (this: HTMLDivElement, ev: WheelEvent) => void = (e) => {
        const threshold = 0.4;
        const isTouchpad = Math.abs(e.deltaX) >= threshold;
        if (!isTouchpad) {
          e.preventDefault();
          const maxScrollPos = Math.max(el.clientWidth, el.scrollWidth, el.offsetWidth)
            - el.clientWidth;
          setPosition((pos) => Math.max(0, Math.min(maxScrollPos, pos + e.deltaY)));
        }
      };
      el.addEventListener('wheel', onWheel);
      const ret: () => void = () => el.removeEventListener('wheel', onWheel);
      return ret;
    }
  }, []);
  useEffect(() => {
    const el = elRef.current;
    if (el) {
      el.scrollTo({ left: position, behavior: 'smooth' });
    }
  }, [position]);
  return elRef;
}

interface Props {
  val: number;
  setVal: Dispatch<SetStateAction<number>>;
}
export function useVerticalScroll(
  { val, setVal }: Props,
): React.MutableRefObject<HTMLDivElement | null> {
  const elRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = elRef.current;
    if (el) {
      const onWheel: (this: HTMLDivElement, ev: WheelEvent) => void = (e) => {
        e.preventDefault();
        const maxScrollPos = Math.max(el.clientHeight, el.scrollHeight, el.offsetHeight)
          - el.clientHeight;
        setVal((pos) => Math.max(0, Math.min(maxScrollPos, pos + e.deltaY)));
      };
      el.addEventListener('wheel', onWheel);
      const ret: () => void = () => el.removeEventListener('wheel', onWheel);
      return ret;
    }
  }, []);
  useEffect(() => {
    const el = elRef.current;
    if (el) {
      el.scrollTo({ top: val, behavior: 'smooth' });
    }
  }, [val]);
  return elRef;
}
