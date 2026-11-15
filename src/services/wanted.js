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

export function subscribeVisibleWanted(access, onData, onError) {
	return subscribeVisible(wanted, access, onData, onError);
}
