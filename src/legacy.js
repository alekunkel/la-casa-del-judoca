import { CFG } from "./config.js";

export function initializeLegacy(services) {
const $ = s => document.querySelector(s);
		const db = services.db, user = services.user, assets = services.assets;
		let uid = null, canAdmin = false, disposed = false;
		const unsubscribers = [];
		let unsubscribeAuth = () => {};
		let unsubscribeReports = () => {};
		let listingTimer;
		const payOn = () => !!(CFG.precio && (CFG.alias || CFG.link) && CFG.wa);
		let MOD = {}, VER = {}, REV = [], REP = [], WNT = []; const M = id => MOD[id] || {}; const vis = d => M(d.id).approved === true || canAdmin || (uid && d.data().owner === uid);
		async function setMod(id, p) {await db.doc("mod/" + id).set(Object.assign({approved: false, featured: false}, MOD[id] || {}, p))}
		$("#swa").href = "https://wa.me/" + CFG.wa + "?text=" + encodeURIComponent("Hola! Quiero ser auspiciante de La Casa del Judoka");
		if (CFG.ig) $("#ig").innerHTML = '<a class="btn" target="_blank" rel="noopener" href="https://instagram.com/' + esc(CFG.ig) + '">Instagram (se abre en otra pestaña)</a>';
		function esc(s) {return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]))}
		$("#tg").onclick = () => {const o = $("#fm").classList.toggle("on"); $("#tg").setAttribute("aria-expanded", o); if (o) $("#t").focus()};
		const onFilterInput = () => render();
		["#q", "#fs", "#so"].forEach(i => $(i).addEventListener("input", onFilterInput));
		document.querySelectorAll(".chip").forEach(c => c.setAttribute("aria-pressed", c.classList.contains("on")));
		$("#chips").onclick = e => {const b = e.target.closest(".chip"); if (!b) return; cat = b.dataset.c; document.querySelectorAll(".chip").forEach(c => {c.classList.toggle("on", c === b); c.setAttribute("aria-pressed", c === b)}); render()};
		let all = [], cat = "", FV = []; try {FV = JSON.parse(localStorage.getItem("fav") || "[]")} catch (e) { }
		async function shrink(f) {
			try {
				if (!/^image\/(jpeg|png|webp)$/.test(f.type)) return f;
				const bm = await createImageBitmap(f), m = 800, k = Math.min(1, m / Math.max(bm.width, bm.height));
				const c = document.createElement("canvas"); c.width = Math.round(bm.width * k); c.height = Math.round(bm.height * k);
				const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(bm, 0, 0, c.width, c.height);
				const b = await new Promise(r => c.toBlob(r, "image/jpeg", .7));
				return (b && b.size < f.size) ? b : f
			} catch (e) {return f}
		}
		function mk(tag, cls, txt) {const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e}
		function mb(txt, label, fn) {const b = mk("button", "x", txt); if (label) b.setAttribute("aria-label", label); b.onclick = fn; return b}
		function ratingTxt(o) {const r = REV.filter(v => v.seller === o); if (!o || !r.length) return ""; const a = r.reduce((t, v) => t + Number(v.rating || 0), 0) / r.length; return " · Valoración " + a.toFixed(1).replace(".", ",") + " de 5 (" + r.length + (r.length === 1 ? " opinión)" : " opiniones)")}
		function revPanel(x) {
			const p = mk("div", "pay rev"); p.setAttribute("role", "region"); p.setAttribute("aria-label", "Opiniones sobre el vendedor");
			const rs = REV.filter(v => v.seller === x.owner).sort((a, b) => b.ts - a.ts).slice(0, 5);
			if (!rs.length) p.appendChild(mk("p", null, "Todavía no hay opiniones de este vendedor."));
			rs.forEach(v => {
				p.appendChild(mk("p", null, v.rating + " de 5" + (v.name ? " · " + v.name : "") + (v.text ? ": " + v.text : "")));
				if (canAdmin) p.appendChild(mb("Borrar opinión", "Borrar opinión de " + (v.name || "comprador"), async () => {if (confirm("¿Borrar esta opinión?")) {try {await db.doc("reviews/" + v.id).delete()} catch (e) {alert("No se pudo borrar")} } }))
			});
			if (uid && x.owner && uid !== x.owner) {
				const u = Math.random().toString(36).slice(2, 7);
				p.appendChild(mk("p", null, "Dejá tu opinión como comprador:")).style.fontWeight = "800";
				const f = mk("div");
				f.innerHTML = '<label for="rs' + u + '">Puntaje</label><select id="rs' + u + '"><option value="5">5 - Excelente</option><option value="4">4 - Muy bueno</option><option value="3">3 - Bueno</option><option value="2">2 - Regular</option><option value="1">1 - Malo</option></select><label for="rn' + u + '">Tu nombre</label><input id="rn' + u + '" maxlength="40"><label for="rt' + u + '">Comentario (opcional)</label><input id="rt' + u + '" maxlength="200">';
				const sb = mk("button", "btn", "Enviar opinión"); sb.style.marginTop = "8px";
				sb.onclick = async () => {
					const nm = f.querySelector("#rn" + u).value.trim(); if (!nm) {alert("Escribí tu nombre."); return }
					try {await db.doc("reviews/" + uid + "_" + x.owner).set({seller: x.owner, sellerName: x.seller || "", rating: Number(f.querySelector("#rs" + u).value), name: nm, text: f.querySelector("#rt" + u).value.trim(), by: uid, ts: Date.now()}); alert("Gracias por tu opinión.")} catch (e) {alert("No se pudo enviar la opinión.")}
				};
				p.appendChild(f); p.appendChild(sb);
			} else if (!uid) p.appendChild(mk("p", "m", "Iniciá sesión para dejar una opinión."));
			return p
		}
		$("#wt").onclick = () => {const o = $("#wf").classList.toggle("on"); $("#wt").setAttribute("aria-expanded", o); if (o) $("#wx").focus()};
		$("#wf").onsubmit = async e => {
			e.preventDefault(); if (!db) {$("#wst").textContent = "Publicar no está disponible ahora."; return }
			if (!uid) {$("#wst").textContent = "Primero ingresá o creá tu cuenta (botón Ingresar, arriba)."; const b = $("#ub"); if (b) b.focus(); return }
			const wd = $("#ww").value.replace(/\D/g, ""); if (wd.length < 10 || wd.length > 15) {$("#wst").textContent = "Revisá el WhatsApp: usá solo números con código de país."; return }
			$("#wg").disabled = true; $("#wst").textContent = "Publicando…";
			try {
				const id = "w" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
				await db.doc("wanted/" + id).set({text: $("#wx").value.trim(), name: $("#wn").value.trim(), city: $("#wc").value.trim(), wa: $("#ww").value.trim(), owner: uid, ts: Date.now()});
				if (canAdmin) {try {await setMod(id, {approved: true})} catch (e) { } }
				$("#wf").reset(); $("#wf").classList.remove("on"); $("#wt").setAttribute("aria-expanded", "false"); $("#wst").textContent = "";
				$("#wm").textContent = canAdmin ? "Búsqueda publicada." : "¡Listo! Tu búsqueda aparece cuando la revisemos."
			} catch (err) {$("#wst").textContent = "No se pudo publicar. Probá de nuevo."}
			$("#wg").disabled = false
		};
		function wanted() {
			const L = $("#wl"); if (!L) return; L.innerHTML = "";
			const vs = WNT.filter(w => M(w.id).approved === true || canAdmin || (uid && w.owner === uid));
			if (!vs.length) {L.appendChild(mk("p", "m", "Todavía no hay búsquedas.")); return }
			vs.forEach(w => {
				const c = mk("article", "card"), b = mk("div", "b");
				b.appendChild(mk("div", "pr", "Busco: " + w.text)); b.appendChild(mk("div", "m", w.name + (w.city ? " · " + w.city : "")));
				if (M(w.id).approved !== true) b.appendChild(mk("div", "m", "En revisión"));
				const a = mk("a", "btn", "Escribirle por WhatsApp"); a.target = "_blank"; a.rel = "noopener"; a.setAttribute("aria-label", "Escribirle por WhatsApp a " + w.name + " (se abre en otra pestaña)");
				a.href = "https://wa.me/" + String(w.wa || "").replace(/\D/g, "") + "?text=" + encodeURIComponent("Hola! Vi tu búsqueda en La Casa del Judoka: " + w.text); b.appendChild(a);
				if (canAdmin || (uid && w.owner === uid)) {const ac = mk("div", "acts"); ac.appendChild(mb("Eliminar búsqueda", "Eliminar búsqueda: " + w.text, async () => {if (confirm("¿Eliminar esta búsqueda?")) {try {await db.doc("wanted/" + w.id).delete()} catch (e) {alert("No se pudo eliminar")} } })); b.appendChild(ac)}
				c.appendChild(b); L.appendChild(c)
			})
		}
		function admin() {
			const s = $("#adm"); if (!s) return; if (!canAdmin) {s.hidden = true; return } s.hidden = false;
			const L = $("#al"); L.innerHTML = "";
			const pend = all.filter(d => M(d.id).approved !== true), pw = WNT.filter(w => M(w.id).approved !== true), fe = all.filter(d => M(d.id).featured).length;
			[pend.length + " publicaciones por aprobar", pw.length + " búsquedas por aprobar", REP.length + " denuncias", fe + " destacados activos", REV.length + " opiniones en total"].forEach(t => L.appendChild(mk("li", null, t)));
			const R = $("#ar2"); R.innerHTML = "";
			pend.forEach(d => {
				const x = d.data(), row = mk("div", "pay"), a = mk("div", "acts"); row.appendChild(mk("p", null, "Publicación: " + (x.title || "") + " — " + (x.seller || "sin nombre")));
				a.appendChild(mb("Aprobar", "Aprobar publicación: " + x.title, async () => {try {await setMod(d.id, {approved: true})} catch (e) {alert("No se pudo aprobar")} }));
				a.appendChild(mb("Rechazar y borrar", "Rechazar y borrar publicación: " + x.title, async () => {if (confirm("¿Borrar esta publicación?")) {try {await db.doc("listings/" + d.id).delete()} catch (e) {alert("No se pudo borrar")} } }));
				row.appendChild(a); R.appendChild(row)
			});
			pw.forEach(w => {
				const row = mk("div", "pay"), a = mk("div", "acts"); row.appendChild(mk("p", null, "Búsqueda: " + w.text + " — " + w.name));
				a.appendChild(mb("Aprobar", "Aprobar búsqueda: " + w.text, async () => {try {await setMod(w.id, {approved: true})} catch (e) {alert("No se pudo aprobar")} }));
				a.appendChild(mb("Rechazar y borrar", "Rechazar y borrar búsqueda: " + w.text, async () => {if (confirm("¿Borrar esta búsqueda?")) {try {await db.doc("wanted/" + w.id).delete()} catch (e) {alert("No se pudo borrar")} } }));
				row.appendChild(a); R.appendChild(row)
			});
			REP.forEach(r => {
				const row = mk("div", "pay"), a = mk("div", "acts"); row.appendChild(mk("p", null, "Denuncia sobre: " + (r.title || r.listing)));
				a.appendChild(mb("Ocultar publicación", "Ocultar publicación denunciada: " + (r.title || ""), async () => {try {await setMod(r.listing, {approved: false})} catch (e) {alert("No se pudo ocultar")} }));
				a.appendChild(mb("Descartar denuncia", "Descartar denuncia sobre " + (r.title || ""), async () => {try {await db.doc("reports/" + r.id).delete()} catch (e) {alert("No se pudo descartar")} }));
				row.appendChild(a); R.appendChild(row)
			})
		}
		function tg(t, a) {return Array.isArray(a) && a.length ? '<div class="m">' + t + ':</div><div class="tags">' + a.map(v => '<span>' + esc(v) + '</span>').join("") + '</div>' : ""}
		function render() {
			admin(); wanted();
			const av = all.filter(d => !d.data().sold && M(d.id).approved === true).length; $("#cnt").textContent = all.length ? av + (av === 1 ? " producto disponible" : " productos disponibles") : "";
			let docs = all.filter(d => {const x = d.data(), q = $("#q").value.trim().toLowerCase(), s = $("#fs").value; return vis(d) && (!cat || (cat === "__fav" ? FV.includes(d.id) : (x.cat || "Judogis") === cat)) && (!s || x.cond === s) && (!q || (String(x.title) + " " + String(x.size)).toLowerCase().includes(q))});
			const o = $("#so").value;
			if (o !== "new") docs = docs.slice().sort((a, b) => o === "lo" ? a.data().price - b.data().price : b.data().price - a.data().price);
			docs = docs.filter(d => M(d.id).featured).concat(docs.filter(d => !M(d.id).featured));
			const g = $("#grid"); g.innerHTML = "";
			$("#msg").textContent = docs.length ? (docs.length === 1 ? "1 producto" : docs.length + " productos") : (all.length ? "No hay resultados con esos filtros." : "Todavía no hay publicaciones. ¡Sé el primero en publicar!");
			docs.forEach(d => {
				const x = d.data(), el = document.createElement("article"); el.className = "card" + (x.sold ? " sold" : "") + (M(d.id).featured ? " feat" : "");
				const num = String(x.wa || "").replace(/\D/g, "");
				const ids = (x.photos && x.photos.length) ? x.photos : (x.photo ? [x.photo] : []);
				const img = ids.length ? ids.map((id, i) => '<img alt="' + esc((x.alt || ("Foto de " + x.title)) + (ids.length > 1 ? " (foto " + (i + 1) + " de " + ids.length + ")" : "")) + '" loading="lazy" src="' + esc(id) + '">').join("") : "Foto no disponible";
				el.innerHTML = '<div class="ph' + (ids.length > 1 ? ' g" tabindex="0" role="group" aria-label="Fotos del producto: deslizá para ver más' : '') + '">' + (x.sold ? '<span class="badge">Vendido</span>' : "") + (M(d.id).featured ? '<span class="badge f">Destacado</span>' : "") + (M(d.id).approved !== true ? '<span class="badge f">En revisión</span>' : "") + img + '</div><div class="b"><div class="pr">$' + esc(Number(x.price).toLocaleString("es-AR")) + '</div><div>' + esc(x.title) + '</div><div class="m">Talle ' + esc(x.size) + ' · ' + esc(x.cond) + '</div>' + '<div class="m">Vendedor: ' + esc(x.seller || "sin nombre") + ratingTxt(x.owner) + (VER[x.owner] ? ' <span class="vf"><span aria-hidden="true">✔ </span>Vendedor verificado</span>' : "") + '</div>' + (x.city ? '<div class="m"><span aria-hidden="true">📍</span> Zona: ' + esc(x.city) + '</div>' : "") + tg("Pago", x.pay) + tg("Entrega", x.ship) +
					'<a class="btn" target="_blank" rel="noopener" aria-label="Consultar por WhatsApp sobre ' + esc(x.title) + ' (se abre en otra pestaña)" href="https://wa.me/' + num + '?text=' + encodeURIComponent("Hola! Vi tu publicación en La Casa del Judoka: " + (x.title || "")) + '">Consultar por WhatsApp</a></div>';
				const ac = document.createElement("div"); ac.className = "acts"; el.querySelector(".b").appendChild(ac);
				const sh = document.createElement("button"); sh.className = "x"; sh.textContent = "Compartir"; sh.setAttribute("aria-label", "Compartir: " + x.title);
				sh.onclick = async () => {const t = x.title + " - $" + Number(x.price).toLocaleString("es-AR") + " en La Casa del Judoka", u = location.href; try {if (navigator.share) {await navigator.share({title: t, text: t, url: u})} else {window.open("https://wa.me/?text=" + encodeURIComponent(t + " " + u), "_blank", "noopener")} } catch (e) { } }; ac.appendChild(sh);
				const fv = document.createElement("button"); fv.className = "x";
				const sync = () => {const on = FV.includes(d.id); fv.textContent = on ? "♥ Guardado" : "♡ Guardar"; fv.setAttribute("aria-pressed", String(on)); fv.setAttribute("aria-label", (on ? "Quitar de favoritos: " : "Guardar en favoritos: ") + x.title)}; sync();
				fv.onclick = () => {const i = FV.indexOf(d.id); if (i < 0) FV.push(d.id); else FV.splice(i, 1); try {localStorage.setItem("fav", JSON.stringify(FV))} catch (e) { } sync(); if (cat === "__fav") render()}; ac.appendChild(fv);
				const rp = document.createElement("button"); rp.className = "x"; rp.textContent = "Denunciar"; rp.setAttribute("aria-label", "Denunciar publicación: " + x.title);
				rp.onclick = async () => {if (!db || !confirm("¿Querés denunciar esta publicación? La vamos a revisar.")) return; try {await db.doc("reports/r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5)).set({listing: d.id, title: x.title, ts: Date.now(), by: uid}); alert("Gracias. Vamos a revisar la publicación.")} catch (e) {alert("No se pudo enviar la denuncia. Probá de nuevo.")} }; ac.appendChild(rp);
				{
					const rb = mk("button", "x", "Opiniones"); rb.setAttribute("aria-expanded", "false"); rb.setAttribute("aria-label", "Ver u opinar sobre el vendedor de " + x.title);
					rb.onclick = () => {const old = el.querySelector(".rev"); if (old) {old.remove(); rb.setAttribute("aria-expanded", "false"); return } el.querySelector(".b").appendChild(revPanel(x)); rb.setAttribute("aria-expanded", "true")}; ac.appendChild(rb)
				}
				if (canAdmin || (uid && x.owner === uid)) {
					const s = document.createElement("button"); s.className = "x"; s.textContent = x.sold ? "Marcar como disponible" : "Marcar como vendido"; s.setAttribute("aria-label", (x.sold ? "Marcar como disponible: " : "Marcar como vendido: ") + x.title);
					s.onclick = async () => {try {await db.doc("listings/" + d.id).update({sold: !x.sold})} catch (e) {alert("No se pudo actualizar")} };
					ac.appendChild(s);
					const b = document.createElement("button"); b.className = "x"; b.textContent = "Eliminar publicación"; b.setAttribute("aria-label", "Eliminar publicación: " + x.title);
					b.onclick = async () => {if (confirm("¿Eliminar esta publicación?")) {try {await d.ref ? d.ref.delete() : db.doc("listings/" + d.id).delete()} catch (e) {alert("No se pudo eliminar")} } };
					ac.appendChild(b);
					if (payOn() && uid && x.owner === uid && !M(d.id).featured && !x.sold) {
						const f = document.createElement("button"); f.className = "x"; f.textContent = "Destacar mi publicación"; f.setAttribute("aria-label", "Destacar publicación: " + x.title); f.setAttribute("aria-expanded", "false");
						f.onclick = () => {
							const old = el.querySelector(".pay"); if (old) {old.remove(); f.setAttribute("aria-expanded", "false"); return }
							const p = document.createElement("div"); p.className = "pay"; p.setAttribute("role", "region"); p.setAttribute("aria-label", "Cómo destacar la publicación");
							p.innerHTML = '<p>Destacar cuesta <b>$' + esc(CFG.precio) + '</b>. Tu publicación aparece primera y con etiqueta "Destacado".</p><p>1. Pagá ' + (CFG.link ? '<a target="_blank" rel="noopener" href="' + esc(CFG.link) + '">con este link de pago (se abre en otra pestaña)</a>' : '') + (CFG.link && CFG.alias ? ' o ' : '') + (CFG.alias ? 'por transferencia al alias <b>' + esc(CFG.alias) + '</b>' : '') + '.</p><p>2. <a target="_blank" rel="noopener" href="https://wa.me/' + esc(String(CFG.wa).replace(/\D/g, "")) + '?text=' + encodeURIComponent("Hola! Pagué para destacar mi publicación en La Casa del Judoka: " + (x.title || "")) + '">Enviá el comprobante por WhatsApp (se abre en otra pestaña)</a>.</p><p>3. Lo revisamos y la destacamos.</p>';
							el.querySelector(".b").appendChild(p); f.setAttribute("aria-expanded", "true")
						};
						ac.appendChild(f);
					}
					if (canAdmin) {
						const ft = document.createElement("button"); ft.className = "x"; ft.textContent = M(d.id).featured ? "Quitar destacado" : "Activar destacado"; ft.setAttribute("aria-label", (M(d.id).featured ? "Quitar destacado: " : "Activar destacado: ") + x.title);
						ft.onclick = async () => {try {await setMod(d.id, {featured: !M(d.id).featured})} catch (e) {alert("No se pudo actualizar")} };
						const ap1 = document.createElement("button"); ap1.className = "x"; ap1.textContent = M(d.id).approved === true ? "Ocultar publicación" : "Aprobar publicación"; ap1.setAttribute("aria-label", (M(d.id).approved === true ? "Ocultar publicación: " : "Aprobar publicación: ") + x.title);
						ap1.onclick = async () => {try {await setMod(d.id, {approved: M(d.id).approved !== true})} catch (e) {alert("No se pudo actualizar")} }; ac.appendChild(ap1);
						if (x.owner) {
							const vb = document.createElement("button"); vb.className = "x"; vb.textContent = VER[x.owner] ? "Quitar verificado" : "Verificar vendedor"; vb.setAttribute("aria-label", (VER[x.owner] ? "Quitar verificado a " : "Verificar a ") + (x.seller || "vendedor"));
							vb.onclick = async () => {try {await db.doc("sellers/" + x.owner).set({verified: !VER[x.owner], name: x.seller || ""})} catch (e) {alert("No se pudo actualizar")} }; ac.appendChild(vb)
						}
						ac.appendChild(ft);
					}
				}
				if (x.sold) {const a = el.querySelector("a.btn"); if (a) a.remove()}
				g.appendChild(el);
			});
		}
		$("#fm").onsubmit = async e => {
			e.preventDefault(); if (!db) {$("#st").textContent = "Publicar no está disponible ahora."; return }
			if (!uid) {$("#st").textContent = "Primero ingresá o creá tu cuenta (botón Ingresar, arriba)."; const b = $("#ub"); if (b) b.focus(); return }
			const wd = $("#w").value.replace(/\D/g, ""); if (wd.length < 10 || wd.length > 15) {$("#st").textContent = "Revisá el WhatsApp: usá solo números con código de país."; return }
			if ($("#f").files[0] && !$("#alt").value.trim()) {$("#st").textContent = "Escribí una descripción corta de la foto. Ayuda a quienes usan lector de pantalla."; $("#alt").focus(); return }
			$("#go").disabled = true; $("#st").textContent = "Preparando fotos y publicando…";
			try {
				let photo = null, photos = []; const fl = [...$("#f").files].slice(0, 4);
				if (fl.length && assets) {for (const fi of fl) {photos.push((await assets.upload(await shrink(fi))).id)} photo = null}
				const id = "l" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
				await db.doc("listings/" + id).set({title: $("#t").value.trim(), seller: $("#sn").value.trim(), size: $("#z").value.trim(), alt: $("#alt").value.trim(), pay: [...document.querySelectorAll("#pay input:checked")].map(i => i.value), ship: [...document.querySelectorAll("#ship input:checked")].map(i => i.value), city: $("#ci").value.trim(), cat: $("#k").value, sold: false, cond: $("#c").value, price: Number($("#p").value), wa: $("#w").value.trim(), photo, photos, owner: uid, ts: Date.now()});
				if (canAdmin) {try {await setMod(id, {approved: true})} catch (e) { } }
				$("#fm").reset(); $("#fm").classList.remove("on"); $("#tg").setAttribute("aria-expanded", "false"); $("#st").textContent = "";
				$("#ok").textContent = canAdmin ? "Publicación creada." : "¡Listo! Tu publicación aparece cuando la revisemos. Mientras tanto la ves con la etiqueta En revisión.";
			} catch (err) {$("#st").textContent = "No se pudo publicar. Probá de nuevo."}
			$("#go").disabled = false;
		};
		const A = {fs: "", th: "", sp: "", ul: ""};
		try {Object.assign(A, JSON.parse(localStorage.getItem("a11y") || "{}"))} catch (e) { }
		function ap() {const h = document.documentElement;["big", "xl", "hc", "dk", "sp", "ul"].forEach(c => h.classList.remove(c)); Object.values(A).forEach(v => v && h.classList.add(v)); document.querySelectorAll("#ap [data-g]").forEach(b => b.setAttribute("aria-pressed", String(A[b.dataset.g] === b.dataset.v))); try {localStorage.setItem("a11y", JSON.stringify(A))} catch (e) { } }
		document.querySelectorAll("#ap [data-g]").forEach(b => b.onclick = () => {const g = b.dataset.g, v = b.dataset.v; A[g] = b.dataset.tog ? (A[g] === v ? "" : v) : v; ap()});
		$("#ar").onclick = () => {A.fs = A.th = A.sp = A.ul = ""; ap()};
		$("#ab").onclick = () => {const p = $("#ap"); p.hidden = !p.hidden; $("#ab").setAttribute("aria-expanded", String(!p.hidden))};
		ap();
		(async () => {
			if (user) {uid = await user.id(); canAdmin = user.canEdit()}
			unsubscribeAuth = user?.subscribe(() => {
				user.id().then(nextUid => {
					if (disposed) return;
					const wasAdmin = canAdmin;
					uid = nextUid;
					canAdmin = user.canEdit();
					if (wasAdmin && !canAdmin) {
						unsubscribeReports();
						unsubscribeReports = () => {};
						REP = [];
					} else if (!wasAdmin && canAdmin) {
						unsubscribeReports = db.collection("reports").onSnapshot(s => {
							REP = s.docs.map(d => Object.assign({id: d.id}, d.data()));
							admin();
						}, () => {});
					}
					render();
				});
			}) ?? (() => {});
			if (!assets) $("#phw").style.display = "none";
			unsubscribers.push(db.collection("mod").onSnapshot(s => {MOD = {}; s.docs.forEach(d => {MOD[d.id] = d.data()}); render()}, () => { }));
			unsubscribers.push(db.collection("reviews").onSnapshot(s => {REV = s.docs.map(d => Object.assign({id: d.id}, d.data())); render()}, () => { }));
			unsubscribers.push(db.collection("wanted").orderBy("ts", "desc").onSnapshot(s => {WNT = s.docs.map(d => Object.assign({id: d.id}, d.data())); wanted(); admin()}, () => {$("#wm").textContent = "No se pudieron cargar las búsquedas."}));
			if (canAdmin) unsubscribeReports = db.collection("reports").onSnapshot(s => {REP = s.docs.map(d => Object.assign({id: d.id}, d.data())); admin()}, () => { });
			unsubscribers.push(db.collection("sellers").onSnapshot(s => {VER = {}; s.docs.forEach(d => {if (d.data().verified) VER[d.id] = true}); render()}, () => { }));
			listingTimer = setTimeout(() => {if (!db) $("#msg").textContent = "No se pudieron cargar las publicaciones."}, 10000);
			unsubscribers.push(db.collection("listings").orderBy("ts", "desc").onSnapshot(s => {clearTimeout(listingTimer); all = s.docs; render()}, () => {$("#msg").textContent = "No se pudieron cargar las publicaciones."}));
		})();
		return () => {
			disposed = true;
			clearTimeout(listingTimer);
			unsubscribeAuth();
			unsubscribeReports();
			unsubscribers.forEach(unsubscribe => unsubscribe());
			["#q", "#fs", "#so"].forEach(i => $(i).removeEventListener("input", onFilterInput));
		};
}
