import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import A11yPanel from "./components/a11y/A11yPanel.jsx";
import AuthPanel from "./components/auth/AuthPanel.jsx";
import {
	About,
	BuyingHelp,
	ConfigWarning,
	Footer,
	Header,
	HowItWorks,
	SkipLink,
	Sponsors,
} from "./components/layout/SiteLayout.jsx";
import ListingGrid from "./components/listings/ListingGrid.jsx";
import WantedSection from "./components/wanted/WantedSection.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { useCollection } from "./hooks/useCollection.js";
import { useFavorites } from "./hooks/useFavorites.js";
import { subscribeVisibleListings } from "./services/listings.js";
import { subscribeSellers } from "./services/sellers.js";
import { subscribeReports } from "./services/reports.js";
import { subscribeReviews } from "./services/reviews.js";
import { subscribeVisibleWanted } from "./services/wanted.js";
import "./styles.css";

const AdminPanel = lazy(() => import("./components/admin/AdminPanel.jsx"));

function AppContent() {
	const { user, uid, isAdmin, loading, errorMessage: authError } = useAuth();
	const [accountOpen, setAccountOpen] = useState(false);
	const [a11yOpen, setA11yOpen] = useState(false);
	const [announcement, setAnnouncement] = useState("");
	const { favorites, toggleFavorite } = useFavorites();
	const listingsSubscription = useCallback(
		(onData, onError) => {
			if (loading) return () => { };
			return subscribeVisibleListings({ uid, isAdmin }, onData, onError);
		},
		[isAdmin, loading, uid],
	);
	const sellersSubscription = useCallback(
		(onData, onError) => subscribeSellers(onData, onError),
		[],
	);
	const reviewsSubscription = useCallback(
		(onData, onError) => subscribeReviews(onData, onError),
		[],
	);
	const wantedSubscription = useCallback(
		(onData, onError) => {
			if (loading) return () => { };
			return subscribeVisibleWanted({ uid, isAdmin }, onData, onError);
		},
		[isAdmin, loading, uid],
	);
	const reportsSubscription = useCallback(
		(onData, onError) =>
			isAdmin ? subscribeReports(onData, onError) : () => { },
		[isAdmin],
	);
	const listingsState = useCollection(listingsSubscription);
	const sellersState = useCollection(sellersSubscription);
	const reviewsState = useCollection(reviewsSubscription);
	const wantedState = useCollection(wantedSubscription);
	const reportsState = useCollection(reportsSubscription);
	const sellers = sellersState.data;
	const reports = isAdmin ? reportsState.data : [];
	const dataError =
		listingsState.error ||
		sellersState.error ||
		reviewsState.error ||
		wantedState.error ||
		(isAdmin && reportsState.error);

	// Diagnóstico: informa en la consola CUÁL lectura de Firestore falla y por qué.
	useEffect(() => {
		const errores = {
			publicaciones: listingsState.error,
			vendedores: sellersState.error,
			opiniones: reviewsState.error,
			"se busca": wantedState.error,
			denuncias: isAdmin ? reportsState.error : null,
		};
		for (const [nombre, error] of Object.entries(errores)) {
			if (error) {
				console.error(
					`Firestore (${nombre}):`,
					error.code ?? "sin-codigo",
					error.message ?? error,
				);
			}
		}
	}, [
		listingsState.error,
		sellersState.error,
		reviewsState.error,
		wantedState.error,
		reportsState.error,
		isAdmin,
	]);

	const availableCount = listingsState.data.filter(
		(listing) => !listing.sold && listing.status === "approved",
	).length;
	const countText = listingsState.data.length
		? `${availableCount} ${availableCount === 1 ? "producto disponible" : "productos disponibles"}`
		: "";

	const announcementHandler = useCallback(
		(message) => setAnnouncement(message),
		[],
	);
	const loginRequestHandler = useCallback(() => setAccountOpen(true), []);
	const toggleAccount = useCallback(
		() => setAccountOpen((current) => !current),
		[],
	);
	const toggleA11y = useCallback(() => setA11yOpen((current) => !current), []);
	return (
		<div className="w">
			<SkipLink />
			<ConfigWarning
				message={
					authError ||
					(dataError
						? "No se pudieron cargar todos los datos. Revisá tu conexión y probá de nuevo."
						: "")
				}
			/>
			<Header
				countText={countText}
				accountOpen={accountOpen}
				signedIn={!!user}
				a11yOpen={a11yOpen}
				onToggleAccount={toggleAccount}
				onToggleA11y={toggleA11y}
			>
				<AuthPanel
					open={accountOpen}
					onAnnouncement={announcementHandler}
					onClose={() => setAccountOpen(false)}
				/>
				<A11yPanel open={a11yOpen} />
			</Header>
			<main id="main" tabIndex="-1">
				<HowItWorks />
				{isAdmin && (
					<Suspense
						fallback={<p role="status">Cargando panel de administración…</p>}
					>
						<AdminPanel
							isAdmin={isAdmin}
							listings={listingsState.data}
							wanted={wantedState.data}
							reports={reports}
							reviews={reviewsState.data}
							onAnnouncement={announcementHandler}
						/>
					</Suspense>
				)}
				<ListingGrid
					listings={listingsState.data}
					listingsLoading={listingsState.loading}
					listingsError={listingsState.error}
					sellers={sellers}
					reviews={reviewsState.data}
					uid={uid}
					isAdmin={isAdmin}
					favorites={favorites}
					onToggleFavorite={toggleFavorite}
					onLoginRequest={loginRequestHandler}
					onAnnouncement={announcementHandler}
				/>
				<WantedSection
					items={wantedState.data}
					loading={wantedState.loading}
					error={wantedState.error}
					uid={uid}
					isAdmin={isAdmin}
					onLoginRequest={loginRequestHandler}
					onAnnouncement={announcementHandler}
				/>
				<About />
				<Sponsors />
				<BuyingHelp />
			</main>
			<p id="ok" role="status" aria-live="polite">
				{announcement}
			</p>
			<Footer />
		</div>
	);
}

export default function App() {
	return (
		<AuthProvider>
			<AppContent />
		</AuthProvider>
	);
}
