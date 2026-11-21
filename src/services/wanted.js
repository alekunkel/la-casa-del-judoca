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

// IMPORTANTE: las consultas filtradas (where) NO llevan orderBy (ver listings.js).
export function subscribeVisibleWanted({ uid, isAdmin }, onData, onError) {
	const queries = [];
	if (isAdmin) {
		queries.push(query(wanted, orderBy("ts", "desc")));
	} else if (uid) {
		queries.push(
			query(wanted, where("status", "==", "approved")),
			query(wanted, where("owner", "==", uid)),
		);
	} else {
		queries.push(query(wanted, where("status", "==", "approved")));
	}
	return subscribeMerged(queries, onData, onError);
}
