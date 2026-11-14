export function CategoryChips({ value, onChange }) {
	const categories = [
		["", "Todo"],
		["Judogis", "Judogis"],
		["Cinturones", "Cinturones"],
		["Protecciones", "Protecciones"],
		["Remeras y buzos", "Remeras y buzos"],
		["Otros", "Otros"],
		["__fav", "Favoritos"],
	];
	return (
		<div className="chips" role="group" aria-label="Categorías">
			{categories.map(([category, label]) => (
				<button
					key={category || "all"}
					type="button"
					className={`chip${value === category ? " on" : ""}`}
					aria-pressed={value === category}
					onClick={() => onChange(category)}
				>
					{label}
				</button>
			))}
		</div>
	);
}

export function Filters({
	query,
	condition,
	sort,
	onQueryChange,
	onConditionChange,
	onSortChange,
}) {
	return (
		<div className="tools">
			<input
				type="search"
				aria-label="Buscar"
				placeholder="Buscar judogi, marca…"
				value={query}
				onChange={(event) => onQueryChange(event.target.value)}
			/>
			<select
				aria-label="Filtrar por estado"
				value={condition}
				onChange={(event) => onConditionChange(event.target.value)}
			>
				<option value="">Todos los estados</option>
				<option>Nuevo</option>
				<option>Como nuevo</option>
				<option>Muy buen estado</option>
				<option>Buen estado</option>
				<option>Con detalles</option>
			</select>
			<select
				aria-label="Ordenar"
				value={sort}
				onChange={(event) => onSortChange(event.target.value)}
			>
				<option value="new">Más nuevos</option>
				<option value="lo">Menor precio</option>
				<option value="hi">Mayor precio</option>
			</select>
		</div>
	);
}

export function LoadingMessage({ loading, error, count, hasListings }) {
	let message;
	if (loading) message = "Cargando publicaciones…";
	else if (error) message = "No se pudieron cargar las publicaciones.";
	else if (count)
		message = `${count} ${count === 1 ? "producto" : "productos"}`;
	else if (hasListings) message = "No hay resultados con esos filtros.";
	else message = "Todavía no hay publicaciones. ¡Sé el primero en publicar!";
	return (
		<div id="msg" role="status" aria-live="polite">
			{message}
		</div>
	);
}
