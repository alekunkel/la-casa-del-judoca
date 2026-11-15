import { beforeEach, describe, expect, it, vi } from "vitest";

const onSnapshotMock = vi.hoisted(() => vi.fn());
const queryMock = vi.hoisted(() => vi.fn((ref, ...args) => ({ ref, args })));
const orderByMock = vi.hoisted(() => vi.fn((field, direction) => ({ type: "orderBy", field, direction })));
const whereMock = vi.hoisted(() => vi.fn((field, operator, value) => ({ type: "where", field, operator, value })));

vi.mock("firebase/firestore", () => ({
	onSnapshot: onSnapshotMock,
	orderBy: orderByMock,
	query: queryMock,
	where: whereMock,
}));

import { subscribeVisible } from "../../src/services/visible.js";

describe("subscribeVisible", () => {
	const makeDoc = (id, data) => ({ id, data: () => data });

	beforeEach(() => {
		onSnapshotMock.mockReset();
		onSnapshotMock.mockImplementation(() => vi.fn());
		queryMock.mockClear();
		orderByMock.mockClear();
		whereMock.mockClear();
	});

	it("anónimo usa una sola consulta aprobada y no ordena por ts", () => {
		const ref = { id: "listings" };
		subscribeVisible(ref, { uid: null, isAdmin: false }, vi.fn(), vi.fn());

		expect(queryMock).toHaveBeenCalledTimes(1);
		expect(whereMock).toHaveBeenCalledWith("status", "==", "approved");
		expect(orderByMock).not.toHaveBeenCalled();
	});

	it("con sesión combina dos consultas sin duplicados y sin orderBy", () => {
		const onData = vi.fn();
		const ref = { id: "listings" };
		subscribeVisible(ref, { uid: "user-1", isAdmin: false }, onData, vi.fn());

		expect(onSnapshotMock).toHaveBeenCalledTimes(2);
		expect(whereMock.mock.calls.map(([field, operator, value]) => [field, operator, value])).toEqual([
			["status", "==", "approved"],
			["owner", "==", "user-1"],
		]);
		expect(orderByMock).not.toHaveBeenCalled();

		const firstSnapshot = {
			docs: [
				makeDoc("a", { ts: 1, owner: "user-1" }),
				makeDoc("b", { ts: 2, owner: "user-2" }),
			],
		};
		const secondSnapshot = {
			docs: [
				makeDoc("a", { ts: 1, owner: "user-1" }),
				makeDoc("c", { ts: 3, owner: "user-1" }),
			],
		};
		onSnapshotMock.mock.calls[0][1](firstSnapshot);
		onSnapshotMock.mock.calls[1][1](secondSnapshot);

		expect(onData).toHaveBeenLastCalledWith([
			{ id: "c", ts: 3, owner: "user-1" },
			{ id: "b", ts: 2, owner: "user-2" },
			{ id: "a", ts: 1, owner: "user-1" },
		]);
	});

	it("admin usa una sola consulta ordenada por ts desc", () => {
		const ref = { id: "listings" };
		subscribeVisible(ref, { uid: null, isAdmin: true }, vi.fn(), vi.fn());

		expect(queryMock).toHaveBeenCalledTimes(1);
		expect(orderByMock).toHaveBeenCalledWith("ts", "desc");
		expect(whereMock).not.toHaveBeenCalled();
	});

	it("elimina documentos que desaparecen de un snapshot posterior", () => {
		const onData = vi.fn();
		const ref = { id: "listings" };
		subscribeVisible(ref, { uid: "user-1", isAdmin: false }, onData, vi.fn());

		onSnapshotMock.mock.calls[0][1]({
			docs: [makeDoc("a", { ts: 10 }), makeDoc("b", { ts: 8 })],
		});
		onSnapshotMock.mock.calls[1][1]({ docs: [makeDoc("a", { ts: 10 })] });
		onSnapshotMock.mock.calls[0][1]({ docs: [makeDoc("a", { ts: 10 })] });

		expect(onData).toHaveBeenLastCalledWith([{ id: "a", ts: 10 }]);
	});

	it("no emite hasta recibir todas las consultas", () => {
		const onData = vi.fn();
		const ref = { id: "listings" };
		subscribeVisible(ref, { uid: "user-1", isAdmin: false }, onData, vi.fn());

		onSnapshotMock.mock.calls[0][1]({ docs: [makeDoc("a", { ts: 5 })] });
		expect(onData).not.toHaveBeenCalled();

		onSnapshotMock.mock.calls[1][1]({ docs: [makeDoc("b", { ts: 7 })] });
		expect(onData).toHaveBeenCalledTimes(1);
	});

	it("ordena el resultado por ts descendente", () => {
		const onData = vi.fn();
		const ref = { id: "listings" };
		subscribeVisible(ref, { uid: null, isAdmin: false }, onData, vi.fn());

		onSnapshotMock.mock.calls[0][1]({
			docs: [makeDoc("old", { ts: 2 }), makeDoc("new", { ts: 9 })],
		});

		expect(onData).toHaveBeenLastCalledWith([
			{ id: "new", ts: 9 },
			{ id: "old", ts: 2 },
		]);
	});

	it("devuelve una función que cancela todas las suscripciones", () => {
		const ref = { id: "listings" };
		const unsubscribe = subscribeVisible(ref, { uid: "user-1", isAdmin: false }, vi.fn(), vi.fn());
		const unsubscribers = onSnapshotMock.mock.results.map((result) => result.value);

		unsubscribe();

		for (const unsub of unsubscribers) {
			expect(unsub).toHaveBeenCalledTimes(1);
		}
	});
});
