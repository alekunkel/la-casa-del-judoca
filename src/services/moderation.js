import {
	collection,
	doc,
	getDoc,
	onSnapshot,
	setDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase.js";

const moderation = collection(db, "mod");
const sellers = collection(db, "sellers");

export function setModeration(id, changes) {
	const reference = doc(moderation, id);
	return getDoc(reference).then((snapshot) =>
		setDoc(reference, {
			approved: false,
			featured: false,
			...(snapshot.data() ?? {}),
			...changes,
		}),
	);
}

export function subscribeModeration(onData, onError) {
	return onSnapshot(moderation, (snapshot) => {
		onData(Object.fromEntries(snapshot.docs.map((item) => [item.id, item.data()])));
	}, onError);
}

export function setSellerVerification(uid, verified, name) {
	return setDoc(doc(sellers, uid), { verified, name });
}

export function subscribeSellers(onData, onError) {
	return onSnapshot(sellers, (snapshot) => {
		onData(Object.fromEntries(snapshot.docs.map((item) => [item.id, item.data()])));
	}, onError);
}
