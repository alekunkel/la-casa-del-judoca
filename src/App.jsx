import { AuthProvider } from "./context/AuthContext.jsx";
import LegacySection from "./components/layout/LegacySection.jsx";
import "./styles.css";

export default function App() {
	return (
		<AuthProvider>
			<LegacySection />
		</AuthProvider>
	);
}
