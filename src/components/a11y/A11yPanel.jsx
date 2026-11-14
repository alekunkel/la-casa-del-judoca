import { useA11yPrefs } from "../../hooks/useA11yPrefs.js";

function PreferenceGroup({ id, label, values, preferences, onSelect }) {
	return (
		<div className="ar">
			<span id={id}>{label}</span>
			<div role="group" aria-labelledby={id}>
				{values.map(
					({ value, label: buttonLabel, toggle = false, group = id }) => (
						<button
							key={value || "normal"}
							type="button"
							data-g={group}
							aria-pressed={preferences[group] === value}
							onClick={() => onSelect(group, value, toggle)}
						>
							{buttonLabel}
						</button>
					),
				)}
			</div>
		</div>
	);
}

export default function A11yPanel({ open }) {
	const { preferences, setPreference, resetPreferences } = useA11yPrefs();

	return (
		<div
			id="a11y-panel"
			className="ap"
			role="region"
			aria-label="Opciones de accesibilidad"
			hidden={!open}
		>
			<p>
				<b>Elegí cómo querés ver la página.</b>
			</p>
			<PreferenceGroup
				id="fs"
				label="Tamaño de letra"
				preferences={preferences}
				onSelect={setPreference}
				values={[
					{ value: "", label: "Normal" },
					{ value: "big", label: "Grande" },
					{ value: "xl", label: "Muy grande" },
				]}
			/>
			<PreferenceGroup
				id="th"
				label="Colores"
				preferences={preferences}
				onSelect={setPreference}
				values={[
					{ value: "", label: "Normal" },
					{ value: "hc", label: "Alto contraste: blanco y negro" },
					{ value: "dk", label: "Fondo negro y letras amarillas" },
				]}
			/>
			<PreferenceGroup
				id="reading"
				label="Lectura"
				preferences={preferences}
				onSelect={setPreference}
				values={[
					{
						value: "sp",
						label: "Más espacio entre letras",
						toggle: true,
						group: "sp",
					},
					{ value: "ul", label: "Subrayar enlaces", toggle: true, group: "ul" },
				]}
			/>
			<button type="button" className="btn" onClick={resetPreferences}>
				Volver a lo normal
			</button>
		</div>
	);
}
