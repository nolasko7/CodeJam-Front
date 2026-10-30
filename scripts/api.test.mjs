import assert from "node:assert/strict";
import test from "node:test";
import {claveInstalacion,guardarTrabajo,restaurarTrabajo,crearTrabajo,consultarTrabajo,ErrorApi} from "../src/api.ts";
const values=new Map();
globalThis.localStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
globalThis.window={location:{href:"http://localhost/"}};
const id="6fd72a53-415e-498f-9a78-d115898bdc53";

test("identidad persistida de 256 bits y trabajo recuperable desde un aviso",()=>{
  values.clear();
  const key=claveInstalacion();assert.match(key,/^[a-f0-9]{64}$/);assert.equal(claveInstalacion(),key);
  const job={id,solicitud:{archivos:{"mundo.json":"{}"},opciones:{iteraciones:0}}};
  guardarTrabajo(job);assert.deepEqual(restaurarTrabajo(),job);
  guardarTrabajo({id});assert.deepEqual(restaurarTrabajo(),{id});
  window.location.href=`http://localhost/?trabajo=${id}`;
  values.set("quickdrop:http://localhost:8787:trabajo:v1","corrupto");
  assert.deepEqual(restaurarTrabajo(),{id});
  window.location.href="http://localhost/?trabajo=invalido";assert.equal(restaurarTrabajo(),null);
});

test("crear usa el mismo ID y Bearer privado; no coloca claves en URL",async()=>{
  values.clear();const token=claveInstalacion();
  const calls=[];globalThis.fetch=async(url,options)=>{calls.push({url,options});return new Response(JSON.stringify({id}),{status:202});};
  const job={id,solicitud:{archivos:{"mundo.json":"{}"},opciones:{iteraciones:0}}};
  await crearTrabajo(job,new AbortController().signal);await crearTrabajo(job,new AbortController().signal);
  assert.equal(calls[0].url,calls[1].url);assert.equal(calls[0].options.method,"PUT");
  assert.equal(calls[0].options.headers.Authorization,`Bearer ${token}`);assert.ok(!calls[0].url.includes(token));
  assert.equal(calls[0].options.cache,"no-store");
});

test("conserva errores permanentes y distingue una respuesta rota para reintentar",async()=>{
  globalThis.fetch=async()=>new Response(JSON.stringify({error:"Ajeno"}),{status:404});
  await assert.rejects(()=>consultarTrabajo(id,new AbortController().signal),error=>error instanceof ErrorApi&&error.status===404&&error.message==="Ajeno");
  globalThis.fetch=async()=>new Response("no json",{status:200});
  await assert.rejects(()=>consultarTrabajo(id,new AbortController().signal),{status:502});
});
