import { onSnapshot, orderBy, query, where } from "firebase/firestore";

// Suscripción a los documentos que la persona puede ver, compatible con las reglas:
//  - admin: toda la colección
//  - con sesión: las aprobadas + las propias (dos consultas, combinadas sin duplicados)
//  - anónima: solo las aprobadas
//
// Las consultas filtradas NO usan orderBy a propósito: filtrar por un campo y ordenar
// por otro exige un índice compuesto en Firestore (en el emulador no se nota, en
// producción la consulta falla). El orden por fecha se hace acá, en el cliente.
export function subscribeVisible(collectionRef, { uid, isAdmin }, onData, onError) {
	let queries;
	if (isAdmin) {
		queries = [query(collectionRef, orderBy("ts", "desc"))];
	} else if (uid) {
		queries = [
			query(collectionRef, where("status", "==", "approved")),
			query(collectionRef, where("owner", "==", uid)),
		];
	} else {
		queries = [query(collectionRef, where("status", "==", "approved"))];
	}

	// Último resultado de cada consulta. Se reemplaza entero en cada snapshot, así los
	// documentos borrados u ocultados desaparecen.
	const results = queries.map(() => null);

	const emit = () => {
		if (results.some((docs) => docs === null)) return; // esperar a que respondan todas
		const merged = new Map();
		for (const docs of results) {
			for (const item of docs) merged.set(item.id, item);
		}
		onData(
			Array.from(merged.values()).sort(
				(left, right) => (right.ts ?? 0) - (left.ts ?? 0),
			),
		);
	};

	const unsubscribers = queries.map((queryRef, index) =>
		onSnapshot(
			queryRef,
			(snapshot) => {
				results[index] = snapshot.docs.map((item) => ({
					id: item.id,
					...item.data(),
				}));
				emit();
			},
			onError,
		),
	);

	return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
}
