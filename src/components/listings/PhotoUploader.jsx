export default function PhotoUploader({ files, onChange, alt, onAltChange, altRef, disabled }) {
	return (
		<div className="f" id="phw">
			<label htmlFor="listing-photos">Fotos (hasta 4, opcional)</label>
			<small className="m" id="photo-tip" style={{ display: "block" }}>
				Consejo: sacá el frente, la espalda, las costuras y la etiqueta del talle.
			</small>
			<input
				id="listing-photos"
				type="file"
				accept="image/*"
				multiple
				aria-describedby="photo-tip photo-count"
				onChange={(event) => onChange(Array.from(event.target.files || []).slice(0, 4))}
				disabled={disabled}
			/>
			<p id="photo-count" className="m" aria-live="polite">
				{files.length ? `${files.length} ${files.length === 1 ? "foto seleccionada" : "fotos seleccionadas"}` : ""}
			</p>
			<label htmlFor="listing-photo-alt">Descripción de las fotos, para quienes no pueden verlas</label>
			<input
				ref={altRef}
				id="listing-photo-alt"
				maxLength="150"
				placeholder="Ej: Judogi blanco doblado sobre una mesa"
				value={alt}
				onChange={(event) => onAltChange(event.target.value)}
				disabled={disabled}
			/>
		</div>
	);
}
