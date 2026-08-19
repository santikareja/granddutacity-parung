'use client';
import React from 'react';

export function useScroll(threshold: number) {
	const [scrolled, setScrolled] = React.useState(false);
	const frameRef = React.useRef<number | null>(null);
	const lastValueRef = React.useRef(false);

	const onScroll = React.useCallback(() => {
		if (frameRef.current !== null) {
			return;
		}

		frameRef.current = window.requestAnimationFrame(() => {
			const nextValue = window.scrollY > threshold;

			if (lastValueRef.current !== nextValue) {
				lastValueRef.current = nextValue;
				setScrolled(nextValue);
			}

			frameRef.current = null;
		});
	}, [threshold]);

	React.useEffect(() => {
		window.addEventListener('scroll', onScroll, { passive: true });

		return () => {
			window.removeEventListener('scroll', onScroll);

			if (frameRef.current !== null) {
				window.cancelAnimationFrame(frameRef.current);
			}
		};
	}, [onScroll]);

	// also check on first load
	React.useEffect(() => {
		const nextValue = window.scrollY > threshold;
		lastValueRef.current = nextValue;
		setScrolled(nextValue);
	}, [threshold]);

	return scrolled;
}
