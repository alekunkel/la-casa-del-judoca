import { collection, doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase.js";

const sellers = collection(db, "sellers");

export function setSellerVerification(uid, verified, name) {
	return setDoc(doc(sellers, uid), { verified, name });
}

export function subscribeSellers(onData, onError) {
	return onSnapshot(
		sellers,
		(snapshot) => {
			onData(
				Object.fromEntries(snapshot.docs.map((item) => [item.id, item.data()])),
			);
		},
		onError,
	);
}
