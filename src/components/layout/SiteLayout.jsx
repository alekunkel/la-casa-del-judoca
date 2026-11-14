import { CFG } from "../../config.js";

export function SkipLink() {
	return (
		<a className="skip" href="#main">
			Saltar al contenido
		</a>
	);
}

export function Header({
	countText,
	accountOpen,
	signedIn,
	a11yOpen,
	onToggleAccount,
	onToggleA11y,
	children,
}) {
	return (
		<>
			<div className="acc">
				<button
					type="button"
					aria-expanded={accountOpen}
					aria-controls="auth"
					onClick={onToggleAccount}
				>
					{accountOpen || signedIn ? "Mi cuenta" : "Ingresar"}
				</button>
				<button
					type="button"
					aria-expanded={a11yOpen}
					aria-controls="a11y-panel"
					onClick={onToggleA11y}
				>
					<span aria-hidden="true">♿ </span>Accesibilidad
				</button>
			</div>
			{children}
			<header>
				<svg
					className="logo"
					viewBox="0 0 96 96"
					width="84"
					height="84"
					aria-hidden="true"
					focusable="false"
				>
					<circle cx="48" cy="48" r="46" fill="var(--ac2)" />
					<path
						d="M30 20 48 32 66 20 86 38 76 50 68 44V74H28V44L20 50 10 38Z"
						fill="#fff"
						stroke="#111"
						strokeWidth="3"
						strokeLinejoin="round"
					/>
					<path
						d="M34 22 58 56M62 22 38 56"
						stroke="#111"
						strokeWidth="3"
						fill="none"
						strokeLinecap="round"
					/>
					<rect x="26" y="57" width="44" height="9" rx="2" fill="#111" />
					<path
						className="t1"
						d="M48 66 40 86"
						stroke="#111"
						strokeWidth="6"
						strokeLinecap="round"
					/>
					<path
						className="t2"
						d="M48 66 56 86"
						stroke="#111"
						strokeWidth="6"
						strokeLinecap="round"
					/>
					<rect
						x="42"
						y="54"
						width="12"
						height="15"
						rx="2"
						fill="#111"
						stroke="#fff"
						strokeWidth="1.5"
					/>
				</svg>
				<h1>
					La Casa del <span>Judoka</span>
				</h1>
				<p>Indumentaria de judo nueva y usada</p>
				<p className="cnt" aria-live="polite">
					{countText}
				</p>
			</header>
			<div className="stripe" aria-hidden="true" />
		</>
	);
}

export function HowItWorks() {
	return (
		<div className="how">
			<div>
				<b>
					<span aria-hidden="true">📸 </span>Paso 1
				</b>
				Publicá tu producto con foto, talle y precio.
			</div>
			<div>
				<b>
					<span aria-hidden="true">💬 </span>Paso 2
				</b>
				Los compradores te escriben por WhatsApp.
			</div>
			<div>
				<b>
					<span aria-hidden="true">🤝 </span>Paso 3
				</b>
				Acordás y cerrás el trato directo.
			</div>
		</div>
	);
}

export function Footer() {
	return (
		<footer>
			La Casa del Judoka es una comunidad de judokas. Encontrate en lugares
			públicos y revisá el estado del producto antes de pagar.
		</footer>
	);
}

export function ConfigWarning({ message }) {
	return (
		<div className="pay" role="alert" hidden={!message}>
			{message}
		</div>
	);
}

export function Sponsors() {
	const sponsorMessage = "Hola! Quiero ser auspiciante de La Casa del Judoka";
	return (
		<section className="info" aria-labelledby="sponsors-title">
			<h2 id="sponsors-title">Auspiciantes</h2>
			<p>¿Tenés una tienda, una marca o un club de judo? Podés aparecer acá.</p>
			<p className="bar2">
				<a
					className="btn"
					target="_blank"
					rel="noopener noreferrer"
					href={`https://wa.me/${CFG.wa}?text=${encodeURIComponent(sponsorMessage)}`}
				>
					Quiero ser auspiciante (se abre en otra pestaña)
				</a>
				<a
					className="btn"
					href="mailto:davidjudo.23@gmail.com?subject=Quiero%20ser%20auspiciante%20de%20La%20Casa%20del%20Judoka"
				>
					Escribir por correo
				</a>
			</p>
		</section>
	);
}

export function About() {
	return (
		<section className="info" aria-labelledby="about-title">
			<h2 id="about-title">Quiénes somos</h2>
			<p>
				Soy David Gómez, judoka paralímpico. Creé esta página para que todos los
				judokas encontremos en un mismo lugar lo que estamos buscando para
				entrenar y competir.
			</p>
			<p className="bar2">
				<a className="btn" href="mailto:davidjudo.23@gmail.com">
					Escribinos por correo
				</a>
				{CFG.ig && (
					<a
						className="btn"
						target="_blank"
						rel="noopener noreferrer"
						href={`https://instagram.com/${encodeURIComponent(CFG.ig)}`}
					>
						Instagram (se abre en otra pestaña)
					</a>
				)}
			</p>
		</section>
	);
}

export function BuyingHelp() {
	return (
		<section className="info" aria-labelledby="buying-help-title">
			<h2 id="buying-help-title">Ayuda para comprar y vender</h2>
			<details>
				<summary>Guía de talles de judogi</summary>
				<p>
					Es una guía aproximada. Cada marca es distinta, así que mirá también
					la tabla del fabricante.
				</p>
				<table>
					<caption>Talle según la altura</caption>
					<thead>
						<tr>
							<th scope="col">Talle</th>
							<th scope="col">Altura aproximada</th>
						</tr>
					</thead>
					<tbody>
						{[140, 150, 160, 170, 180, 190, 200].map((height, index) => (
							<tr key={height}>
								<th scope="row">{index + 1}</th>
								<td>{height} cm</td>
							</tr>
						))}
					</tbody>
				</table>
				<p>
					Las mangas deben llegar a la muñeca y el pantalón al tobillo. Si es de
					algodón, puede encogerse un poco al lavarlo.
				</p>
			</details>
			<details>
				<summary>¿Cómo compro de forma segura?</summary>
				<ul>
					<li>Hablá con el vendedor por WhatsApp.</li>
					<li>Pedí más fotos si las necesitás.</li>
					<li>Encontrate en un lugar público.</li>
					<li>Pagá cuando revises el producto.</li>
				</ul>
			</details>
			<details>
				<summary>¿Cómo saco buenas fotos?</summary>
				<ul>
					<li>Usá un fondo liso y luz natural.</li>
					<li>Sacá el frente y la espalda.</li>
					<li>Mostrá el cuello, las mangas y el pantalón.</li>
					<li>Fotografiá costuras, manchas o desgaste.</li>
					<li>Incluí la marca y la etiqueta del talle.</li>
				</ul>
			</details>
			<details>
				<summary>¿Cómo vendo mi producto?</summary>
				<ol>
					<li>Tocá «Publicar mi producto».</li>
					<li>Completá los datos y subí las fotos.</li>
					<li>Escribí una descripción de las fotos.</li>
					<li>Tocá «Publicar».</li>
					<li>Esperá la revisión: la vemos y la mostramos en la página.</li>
				</ol>
			</details>
			<details>
				<summary>¿Qué hago si algo no está bien?</summary>
				<p>Tocá «Denunciar» en la publicación. Vamos a revisarla.</p>
			</details>
			<details>
				<summary>Términos y condiciones</summary>
				<ul>
					<li>
						La Casa del Judoka es un espacio para que los judokas se encuentren.
						Cada compra y venta es un trato entre comprador y vendedor.
					</li>
					<li>
						Publicar es gratis. Destacar una publicación tiene un costo que se
						informa antes de pagar.
					</li>
					<li>
						Cada vendedor es responsable de lo que publica: fotos reales, estado
						y precio verdaderos.
					</li>
					<li>
						Las opiniones deben ser de compradores reales y respetuosas. Podemos
						borrar las que no lo sean.
					</li>
					<li>Revisamos cada publicación antes de mostrarla.</li>
					<li>
						Podemos sacar publicaciones que no cumplan estas reglas o que hayan
						sido denunciadas.
					</li>
				</ul>
			</details>
		</section>
	);
}
