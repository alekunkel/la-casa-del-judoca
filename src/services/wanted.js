import {
	collection,
	deleteDoc,
	doc,
	onSnapshot,
	orderBy,
	query,
	setDoc,
	updateDoc,
	where,
} from "firebase/firestore";
import { db } from "../lib/firebase.js";

const wanted = collection(db, "wanted");

export function createWanted(id, data) {
	return setDoc(doc(wanted, id), data);
}

export function setWantedStatus(id, status) {
	return updateDoc(doc(wanted, id), { status });
}

export function deleteWanted(id) {
	return deleteDoc(doc(wanted, id));
}

export function subscribeWanted(onData, onError) {
	return onSnapshot(
		query(wanted, orderBy("ts", "desc")),
		(snapshot) => {
			onData(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
		},
		onError,
	);
}

export function subscribeVisibleWanted({ uid, isAdmin }, onData, onError) {
	const queries = [];
	if (isAdmin) {
		queries.push(query(wanted, orderBy("ts", "desc")));
	} else if (uid) {
		queries.push(
			query(wanted, where("status", "==", "approved"), orderBy("ts", "desc")),
			query(wanted, where("owner", "==", uid), orderBy("ts", "desc")),
		);
	} else {
		queries.push(query(wanted, where("status", "==", "approved"), orderBy("ts", "desc")));
	}

	const combined = new Map();
	const listeners = queries.map((queryRef) =>
		onSnapshot(
			queryRef,
			(snapshot) => {
				for (const document of snapshot.docs) {
					const item = { id: document.id, ...document.data() };
					combined.set(item.id, item);
				}
				const visible = Array.from(combined.values()).sort(
					(left, right) => (right.ts ?? 0) - (left.ts ?? 0),
				);
				onData(visible);
			},
			onError,
		),
	);

	return () => listeners.forEach((unsubscribe) => unsubscribe());
}
