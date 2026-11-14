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

const listings = collection(db, "listings");

export function createListing(id, data) {
	return setDoc(doc(listings, id), data);
}

export function updateListing(id, changes) {
	return updateDoc(doc(listings, id), changes);
}

export function setListingStatus(id, status) {
	return updateDoc(doc(listings, id), { status });
}

export function setListingFeatured(id, featured) {
	return updateDoc(doc(listings, id), { featured });
}

export function deleteListing(id) {
	return deleteDoc(doc(listings, id));
}

export function subscribeListings(onData, onError) {
	return onSnapshot(
		query(listings, orderBy("ts", "desc")),
		(snapshot) => {
			onData(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
		},
		onError,
	);
}

export function subscribeVisibleListings({ uid, isAdmin }, onData, onError) {
	const queries = [];
	if (isAdmin) {
		queries.push(query(listings, orderBy("ts", "desc")));
	} else if (uid) {
		queries.push(
			query(listings, where("status", "==", "approved"), orderBy("ts", "desc")),
			query(listings, where("owner", "==", uid), orderBy("ts", "desc")),
		);
	} else {
		queries.push(query(listings, where("status", "==", "approved"), orderBy("ts", "desc")));
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
