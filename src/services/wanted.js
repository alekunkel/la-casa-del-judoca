import {
	collection,
	deleteDoc,
	doc,
	onSnapshot,
	orderBy,
	query,
	setDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase.js";

const wanted = collection(db, "wanted");

export function createWanted(id, data) {
	return setDoc(doc(wanted, id), data);
}

export function deleteWanted(id) {
	return deleteDoc(doc(wanted, id));
}

export function subscribeWanted(onData, onError) {
	return onSnapshot(query(wanted, orderBy("ts", "desc")), (snapshot) => {
		onData(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
	}, onError);
}
