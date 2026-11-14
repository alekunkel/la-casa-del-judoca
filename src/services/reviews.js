import { collection, deleteDoc, doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase.js";

const reviews = collection(db, "reviews");

export function createReview(buyerUid, sellerUid, data) {
	return setDoc(doc(reviews, `${buyerUid}_${sellerUid}`), {
		...data,
		by: buyerUid,
		seller: sellerUid,
	});
}

export function deleteReview(id) {
	return deleteDoc(doc(reviews, id));
}

export function subscribeReviews(onData, onError) {
	return onSnapshot(reviews, (snapshot) => {
		onData(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
	}, onError);
}
