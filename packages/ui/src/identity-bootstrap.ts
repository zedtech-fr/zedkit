/**
 * Fixed bootstrap run before paint. Props are read from `document.currentScript`
 * data attributes (JSON for ids) so the script body is never assembled from
 * user input.
 */
export const IDENTITY_BOOTSTRAP_SOURCE = `(function(){var s=document.currentScript;if(!s)return;var a=JSON.parse(s.getAttribute("data-ids")||"[]"),k=s.getAttribute("data-storage-key"),v=s.getAttribute("data-default");if(v===null||v==="")v=null;try{var x=localStorage.getItem(k);if(x&&a.indexOf(x)>-1)v=x}catch(e){}if(v)document.documentElement.setAttribute("data-identity",v)})()`;
