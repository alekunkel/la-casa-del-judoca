import { lazy, Suspense, useCallback, useState } from "react";
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
import { subscribeListings } from "./services/listings.js";
import {
	subscribeModeration,
	subscribeSellers,
} from "./services/moderation.js";
import { subscribeReports } from "./services/reports.js";
import { subscribeReviews } from "./services/reviews.js";
import { subscribeWanted } from "./services/wanted.js";
import "./styles.css";

const AdminPanel = lazy(() => import("./components/admin/AdminPanel.jsx"));

function AppContent() {
	const { user, uid, isAdmin, errorMessage: authError } = useAuth();
	const [accountOpen, setAccountOpen] = useState(false);
	const [a11yOpen, setA11yOpen] = useState(false);
	const [announcement, setAnnouncement] = useState("");
	const { favorites, toggleFavorite } = useFavorites();
	const listingsSubscription = useCallback(
		(onData, onError) => subscribeListings(onData, onError),
		[],
	);
	const moderationSubscription = useCallback(
		(onData, onError) => subscribeModeration(onData, onError),
		[],
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
		(onData, onError) => subscribeWanted(onData, onError),
		[],
	);
	const reportsSubscription = useCallback(
		(onData, onError) =>
			isAdmin ? subscribeReports(onData, onError) : () => {},
		[isAdmin],
	);
	const listingsState = useCollection(listingsSubscription);
	const moderationState = useCollection(moderationSubscription);
	const sellersState = useCollection(sellersSubscription);
	const reviewsState = useCollection(reviewsSubscription);
	const wantedState = useCollection(wantedSubscription);
	const reportsState = useCollection(reportsSubscription);
	const moderation = moderationState.data;
	const sellers = sellersState.data;
	const reports = isAdmin ? reportsState.data : [];
	const dataError =
		listingsState.error ||
		moderationState.error ||
		sellersState.error ||
		reviewsState.error ||
		wantedState.error ||
		(isAdmin && reportsState.error);
	const availableCount = listingsState.data.filter(
		(listing) => !listing.sold && moderation[listing.id]?.approved === true,
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
				<AuthPanel open={accountOpen} onAnnouncement={announcementHandler} />
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
							moderation={moderation}
							onAnnouncement={announcementHandler}
						/>
					</Suspense>
				)}
				<ListingGrid
					listings={listingsState.data}
					listingsLoading={listingsState.loading}
					listingsError={listingsState.error}
					moderation={moderation}
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
					moderation={moderation}
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
