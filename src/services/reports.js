import {
	collection,
	deleteDoc,
	doc,
	onSnapshot,
	setDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase.js";

const reports = collection(db, "reports");

export function createReport(id, data) {
	return setDoc(doc(reports, id), data);
}

export function deleteReport(id) {
	return deleteDoc(doc(reports, id));
}

export function subscribeReports(onData, onError) {
	return onSnapshot(
		reports,
		(snapshot) => {
			onData(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
		},
		onError,
	);
}
