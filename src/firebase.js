export async function initializeFirebase() {
	window.__fbReady = new Promise(function (r) { window.__fbResolve = r });
	window.claude = { use: async function (n) { var f = await window.__fbReady; return f ? (f[n] || null) : null } };
const FB = {
		apiKey: "AIzaSyACiz3TbNHISj35STjcxE-b-SjaWwWVy48",
		authDomain: "casa-del-judoca.firebaseapp.com",
		projectId: "casa-del-judoca",
		storageBucket: "casa-del-judoca.firebasestorage.app",
		messagingSenderId: "514893312596",
		appId: "1:514893312596:web:fce75a937f4e75814c33c1"
	};
	const ADMIN_EMAILS=["davidjudo.23@gmail.com","alejkunkel@gmail.com"];

	const $$=id=>document.getElementById(id);
	const ST=t=>{$$("ast").textContent=t};
	let cur=null,started=false;
	$$("ub").onclick=()=>{const
	p=$$("auth");p.hidden=!p.hidden;$$("ub").setAttribute("aria-expanded",String(!p.hidden));if(!p.hidden)(cur?$$("alo"):$$("ae")).focus()};
	try{
	if(String(FB.apiKey).indexOf("PEGAR")===0)throw new Error("sin configurar");
	const V="https://www.gstatic.com/firebasejs/10.12.2/";
	const A1=await import(V+"firebase-app.js"),A2=await import(V+"firebase-auth.js"),A3=await
	import(V+"firebase-firestore.js");
	const {initializeApp}=A1;
	const
	{getAuth,onAuthStateChanged,createUserWithEmailAndPassword,signInWithEmailAndPassword,signOut,sendPasswordResetEmail,sendEmailVerification}=A2;
	const {getFirestore,doc,setDoc,updateDoc,deleteDoc,collection,query,orderBy,onSnapshot}=A3;
	const app=initializeApp(FB),auth=getAuth(app),fs=getFirestore(app);
	const wrap=s=>({docs:s.docs.map(d=>({id:d.id,data:()=>d.data()}))});
	const db={
	doc:p=>({set:d=>setDoc(doc(fs,p),d),update:d=>updateDoc(doc(fs,p),d),delete:()=>deleteDoc(doc(fs,p))}),
	collection:n=>({
	orderBy:(f,dir)=>({onSnapshot:(ok,err)=>onSnapshot(query(collection(fs,n),orderBy(f,dir)),s=>ok(wrap(s)),err)}),
	onSnapshot:(ok,err)=>onSnapshot(collection(fs,n),s=>ok(wrap(s)),err)
	})
	};
	const isAdmin=()=>!!(cur&&cur.email&&ADMIN_EMAILS.includes(cur.email.toLowerCase())&&cur.emailVerified);
	const user={id:async()=>cur?cur.uid:null,canEdit:()=>isAdmin(),isOwner:()=>isAdmin()};
	const assets={upload:blob=>new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>{const
	u=String(r.result);if(u.length>230000){no(new Error("foto muy pesada"))}else
	ok({id:u})};r.onerror=()=>no(r.error);r.readAsDataURL(blob)})};
	const services={db:db,user:user,assets:assets};
	const msgs={"auth/invalid-email":"El correo no es válido.","auth/email-already-in-use":"Ese correo ya tiene una cuenta. Probá con Ingresar.","auth/weak-password":"La contraseña es muy corta. Usá al menos 6 caracteres.","auth/invalid-credential":"Correo o contraseña incorrectos.","auth/user-not-found":"Correo o contraseña incorrectos.","auth/wrong-password":"Correo o contraseña incorrectos.","auth/missing-password":"Escribí tu contraseña.","auth/too-many-requests":"Demasiados intentos. Esperá unos minutos."};
	const err=e=>ST(msgs[e&&e.code]||"No se pudo. Probá de nuevo.");
	const after=t=>{try{sessionStorage.setItem("authmsg",t)}catch(e){}};
	onAuthStateChanged(auth,u=>{
	cur=u;
	if(!started){
	started=true;
	$$("aout").hidden=!u;$$("ain").hidden=!!u;
	if(u){$$("aem").textContent="Ingresaste como "+u.email+(u.emailVerified?"":". Todavía falta confirmar tu correo: revisá tu bandeja de entrada.");$$("ub").textContent="Mi cuenta"}
	try{const
	m=sessionStorage.getItem("authmsg");if(m){sessionStorage.removeItem("authmsg");$$("ok").textContent=m}}catch(e){}
	window.__fbResolve(services);
	}else{location.reload()}
	});
	$$("ali").onclick=async()=>{const e=$$("ae").value.trim(),p=$$("apw").value;if(!e||!p){ST("Escribí tu correo y tu contraseña.");return}ST("Ingresando…");try{after("Ingresaste correctamente.");await
	signInWithEmailAndPassword(auth,e,p)}catch(x){after("");err(x)}};
	$$("arg").onclick=async()=>{const e=$$("ae").value.trim(),p=$$("apw").value;if(!e||!p){ST("Escribí tu correo y una contraseña.");return}ST("Creando cuenta…");try{after("Cuenta creada. Te mandamos un correo para confirmar tu dirección.");const c=await createUserWithEmailAndPassword(auth,e,p);try{await
	sendEmailVerification(c.user)}catch(z){}}catch(x){after("");err(x)}};
	$$("afp").onclick=async()=>{const e=$$("ae").value.trim();if(!e){ST("Escribí tu correo y volvé a tocar este botón.");return}try{await sendPasswordResetEmail(auth,e);ST("Si el correo tiene una cuenta, te mandamos un enlace para cambiar la contraseña.")}catch(x){err(x)}};
	$$("alo").onclick=async()=>{try{after("Saliste de tu cuenta.");await signOut(auth)}catch(x){after("");err(x)}};
	}catch(e){
	if(String(FB.apiKey).indexOf("PEGAR")!==0)$$("cfgwarn").textContent="No se pudo conectar con la base de datos. Revisá tu conexión y probá de nuevo.";
	$$("cfgwarn").hidden=false;
	window.__fbResolve(null);
	}
}
