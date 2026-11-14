import { useEffect, useState } from "react";

export function useCollection(subscribeFn) {
	const [result, setResult] = useState(() => ({
		source: subscribeFn,
		data: [],
		loading: true,
		error: null,
	}));

	useEffect(() => {
		let active = true;
		let unsubscribe;
		try {
			unsubscribe = subscribeFn(
				(nextData) => {
					if (active)
						setResult({
							source: subscribeFn,
							data: nextData,
							loading: false,
							error: null,
						});
				},
				(nextError) => {
					if (active)
						setResult({
							source: subscribeFn,
							data: [],
							loading: false,
							error: nextError,
						});
				},
			);
		} catch (nextError) {
			queueMicrotask(() => {
				if (active)
					setResult({
						source: subscribeFn,
						data: [],
						loading: false,
						error: nextError,
					});
			});
		}
		return () => {
			active = false;
			unsubscribe?.();
		};
	}, [subscribeFn]);

	if (result.source !== subscribeFn)
		return { data: [], loading: true, error: null };
	return { data: result.data, loading: result.loading, error: result.error };
}
