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

const listings = collection(db, "listings");

export function createListing(id, data) {
	return setDoc(doc(listings, id), data);
}

export function updateListing(id, changes) {
	return updateDoc(doc(listings, id), changes);
}

export function deleteListing(id) {
	return deleteDoc(doc(listings, id));
}

export function subscribeListings(onData, onError) {
	return onSnapshot(query(listings, orderBy("ts", "desc")), (snapshot) => {
		onData(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
	}, onError);
}
