import {
	collection,
	deleteDoc,
	doc,
	orderBy,
	query,
	setDoc,
	updateDoc,
	where,
} from "firebase/firestore";
import { db } from "../lib/firebase.js";
import { subscribeMerged } from "./subscribeMerged.js";

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

// IMPORTANTE: las consultas filtradas (where) NO llevan orderBy. Combinar where
// con orderBy en otro campo exige índices compuestos en Firebase real (los
// emuladores no los piden). El orden por fecha se hace en subscribeMerged.
export function subscribeVisibleListings({ uid, isAdmin }, onData, onError) {
	const queries = [];
	if (isAdmin) {
		queries.push(query(listings, orderBy("ts", "desc")));
	} else if (uid) {
		queries.push(
			query(listings, where("status", "==", "approved")),
			query(listings, where("owner", "==", uid)),
		);
	} else {
		queries.push(query(listings, where("status", "==", "approved")));
	}
	return subscribeMerged(queries, onData, onError);
}
