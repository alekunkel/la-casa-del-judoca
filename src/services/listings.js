import {
	collection,
	deleteDoc,
	doc,
	onSnapshot,
	orderBy,
	query,
	setDoc,
	updateDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase.js";
import { subscribeVisible } from "./visible.js";

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

export function subscribeVisibleListings(access, onData, onError) {
	return subscribeVisible(listings, access, onData, onError);
}
