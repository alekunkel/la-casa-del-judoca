import { onSnapshot } from "firebase/firestore";

// Escucha varias consultas a la vez y entrega la unión de sus resultados,
// ordenada por fecha (ts) descendente.
// Cada consulta guarda su propio resultado: si un documento deja de aparecer
// en una consulta (se borró o cambió de estado), desaparece de la lista.
export function subscribeMerged(queries, onData, onError) {
	const results = queries.map(() => new Map());

	const unsubscribes = queries.map((queryRef, index) =>
		onSnapshot(
			queryRef,
			(snapshot) => {
				results[index] = new Map(
					snapshot.docs.map((item) => [item.id, { id: item.id, ...item.data() }]),
				);
				const merged = new Map();
				for (const result of results) {
					for (const [id, item] of result) merged.set(id, item);
				}
				onData(
					Array.from(merged.values()).sort(
						(left, right) => (right.ts ?? 0) - (left.ts ?? 0),
					),
				);
			},
			onError,
		),
	);

	return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
}
