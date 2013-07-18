/*
*/
/*
 MIT
*/
var Url=require("url"),spawn=require("child_process").spawn,fs=require("fs"),XMLHttpRequest=function(){var b=this,o=require("http"),p=require("https"),j,c,e={},n={"User-Agent":"node.js",Accept:"*/*"},h=!1,l=!1,m=n;this.UNSENT=0;this.OPENED=1;this.HEADERS_RECEIVED=2;this.LOADING=3;this.DONE=4;this.readyState=this.UNSENT;this.onreadystatechange=null;this.responseXML=this.responseText="";this.statusText=this.status=null;this.open=function(a,b,f,c,g){e={method:a,url:b.toString(),async:"boolean"!==typeof f?
!0:f,user:c||null,password:g||null};this.abort();i(this.OPENED)};this.setRequestHeader=function(a,b){if(this.readyState!=this.OPENED)throw"INVALID_STATE_ERR: setRequestHeader can only be called when state is OPEN";if(h)throw"INVALID_STATE_ERR: send flag is true";m[a]=b};this.getResponseHeader=function(a){return this.readyState>this.OPENED&&c.headers[a]&&!l?c.headers[a]:null};this.getAllResponseHeaders=function(){if(this.readyState<this.HEADERS_RECEIVED||l)return"";var a="",b;for(b in c.headers)a+=
b+": "+c.headers[b]+"\r\n";return a.substr(0,a.length-2)};this.send=function(a){if(this.readyState!=this.OPENED)throw"INVALID_STATE_ERR: connection must be opened before send() is called";if(h)throw"INVALID_STATE_ERR: send has already been called";var k=!1,f=Url.parse(e.url);switch(f.protocol){case "https:":k=!0;case "http:":var d=f.hostname;break;case void 0:case "":d="localhost";break;default:throw"Protocol not supported.";}var g=f.port||(k?443:80),f=f.pathname+(f.search?f.search:"");this.setRequestHeader("Host",
d);if(e.user){"undefined"==typeof e.password&&(e.password="");var n=new Buffer(e.user+":"+e.password);m.Authorization="Basic "+n.toString("base64")}"GET"==e.method||"HEAD"==e.method?a=null:a&&(this.setRequestHeader("Content-Length",Buffer.byteLength(a)),m["Content-Type"]||this.setRequestHeader("Content-Type","text/plain;charset=UTF-8"));d={host:d,port:g,path:f,method:e.method,headers:m};l=!1;if(!e.hasOwnProperty("async")||e.async){k=k?p.request:o.request;h=!0;if("function"===typeof b.onreadystatechange)b.onreadystatechange();
j=k(d,function(a){c=a;c.setEncoding("utf8");i(b.HEADERS_RECEIVED);b.status=c.statusCode;c.on("data",function(a){if(a)b.responseText=b.responseText+a;h&&i(b.LOADING)});c.on("end",function(){if(h){i(b.DONE);h=false}});c.on("error",function(a){b.handleError(a)})}).on("error",function(a){b.handleError(a)});a&&j.write(a);j.end()}else{g=".node-xmlhttprequest-sync-"+process.pid;fs.writeFileSync(g,"","utf8");a="var http = require('http'), https = require('https'), fs = require('fs');var doRequest = http"+
(k?"s":"")+".request;var options = "+JSON.stringify(d)+";var responseText = '';var req = doRequest(options, function(response) {response.setEncoding('utf8');response.on('data', function(chunk) {responseText += chunk;});response.on('end', function() {fs.writeFileSync('"+g+"', 'NODE-XMLHTTPREQUEST-STATUS:' + response.statusCode + ',' + responseText, 'utf8');});response.on('error', function(error) {fs.writeFileSync('"+g+"', 'NODE-XMLHTTPREQUEST-ERROR:' + JSON.stringify(error), 'utf8');});}).on('error', function(error) {fs.writeFileSync('"+
g+"', 'NODE-XMLHTTPREQUEST-ERROR:' + JSON.stringify(error), 'utf8');});"+(a?"req.write('"+a.replace(/'/g,"\\'")+"');":"")+"req.end();";for(syncProc=spawn(process.argv[0],["-e",a]);""==(b.responseText=fs.readFileSync(g,"utf8")););syncProc.stdin.end();fs.unlinkSync(g);b.responseText.match(/^NODE-XMLHTTPREQUEST-ERROR:/)?(a=b.responseText.replace(/^NODE-XMLHTTPREQUEST-ERROR:/,""),b.handleError(a)):(b.status=b.responseText.replace(/^NODE-XMLHTTPREQUEST-STATUS:([0-9]*),.*/,"$1"),b.responseText=b.responseText.replace(/^NODE-XMLHTTPREQUEST-STATUS:[0-9]*,(.*)/,
"$1"),i(b.DONE))}};this.handleError=function(a){this.status=503;this.statusText=a;this.responseText=a.stack;l=!0;i(this.DONE)};this.abort=function(){j&&(j.abort(),j=null);m=n;this.responseXML=this.responseText="";l=!0;if(this.readyState!==this.UNSENT&&(this.readyState!==this.OPENED||h)&&this.readyState!==this.DONE)h=!1,i(this.DONE);this.readyState=this.UNSENT};var d={};this.addEventListener=function(a,b){a in d||(d[a]=[]);d[a].push(b)};var i=function(a){b.readyState=a;if("function"===typeof b.onreadystatechange)b.onreadystatechange();
if("readystatechange"in d)for(var a=d.readystatechange.length,c=0;c<a;c++)d.readystatechange[c].call(b)}};
var CryptoJS=CryptoJS||function(e,i){var d={},a=d.lib={},c=a.Base=function(){function g(){}return{extend:function(b){g.prototype=this;var a=new g;b&&a.mixIn(b);a.$super=this;return a},create:function(){var g=this.extend();g.init.apply(g,arguments);return g},init:function(){},mixIn:function(g){for(var b in g)g.hasOwnProperty(b)&&(this[b]=g[b]);g.hasOwnProperty("toString")&&(this.toString=g.toString)},clone:function(){return this.$super.extend(this)}}}(),l=a.WordArray=c.extend({init:function(g,b){g=
this.words=g||[];this.sigBytes=b!=i?b:4*g.length},toString:function(g){return(g||h).stringify(this)},concat:function(g){var b=this.words,a=g.words,c=this.sigBytes,g=g.sigBytes;this.clamp();if(c%4)for(var f=0;f<g;f++)b[c+f>>>2]|=(a[f>>>2]>>>24-8*(f%4)&255)<<24-8*((c+f)%4);else if(65535<a.length)for(f=0;f<g;f+=4)b[c+f>>>2]=a[f>>>2];else b.push.apply(b,a);this.sigBytes+=g;return this},clamp:function(){var g=this.words,b=this.sigBytes;g[b>>>2]&=4294967295<<32-8*(b%4);g.length=e.ceil(b/4)},clone:function(){var g=
c.clone.call(this);g.words=this.words.slice(0);return g},random:function(g){for(var b=[],a=0;a<g;a+=4)b.push(4294967296*e.random()|0);return l.create(b,g)}}),k=d.enc={},h=k.Hex={stringify:function(g){for(var b=g.words,g=g.sigBytes,a=[],f=0;f<g;f++){var c=b[f>>>2]>>>24-8*(f%4)&255;a.push((c>>>4).toString(16));a.push((c&15).toString(16))}return a.join("")},parse:function(b){for(var a=b.length,f=[],c=0;c<a;c+=2)f[c>>>3]|=parseInt(b.substr(c,2),16)<<24-4*(c%8);return l.create(f,a/2)}},j=k.Latin1={stringify:function(b){for(var a=
b.words,b=b.sigBytes,f=[],c=0;c<b;c++)f.push(String.fromCharCode(a[c>>>2]>>>24-8*(c%4)&255));return f.join("")},parse:function(b){for(var a=b.length,f=[],c=0;c<a;c++)f[c>>>2]|=(b.charCodeAt(c)&255)<<24-8*(c%4);return l.create(f,a)}},b=k.Utf8={stringify:function(b){try{return decodeURIComponent(escape(j.stringify(b)))}catch(a){throw Error("Malformed UTF-8 data");}},parse:function(b){return j.parse(unescape(encodeURIComponent(b)))}},f=a.BufferedBlockAlgorithm=c.extend({reset:function(){this._data=l.create();
this._nDataBytes=0},_append:function(a){"string"==typeof a&&(a=b.parse(a));this._data.concat(a);this._nDataBytes+=a.sigBytes},_process:function(b){var a=this._data,c=a.words,f=a.sigBytes,h=this.blockSize,k=f/(4*h),k=b?e.ceil(k):e.max((k|0)-this._minBufferSize,0),b=k*h,f=e.min(4*b,f);if(b){for(var j=0;j<b;j+=h)this._doProcessBlock(c,j);j=c.splice(0,b);a.sigBytes-=f}return l.create(j,f)},clone:function(){var b=c.clone.call(this);b._data=this._data.clone();return b},_minBufferSize:0});a.Hasher=f.extend({init:function(){this.reset()},
reset:function(){f.reset.call(this);this._doReset()},update:function(b){this._append(b);this._process();return this},finalize:function(b){b&&this._append(b);this._doFinalize();return this._hash},clone:function(){var b=f.clone.call(this);b._hash=this._hash.clone();return b},blockSize:16,_createHelper:function(b){return function(a,f){return b.create(f).finalize(a)}},_createHmacHelper:function(b){return function(a,f){return o.HMAC.create(b,f).finalize(a)}}});var o=d.algo={};return d}(Math);
(function(){var e=CryptoJS,i=e.lib,d=i.WordArray,i=i.Hasher,a=[],c=e.algo.SHA1=i.extend({_doReset:function(){this._hash=d.create([1732584193,4023233417,2562383102,271733878,3285377520])},_doProcessBlock:function(c,k){for(var h=this._hash.words,j=h[0],b=h[1],f=h[2],e=h[3],g=h[4],d=0;80>d;d++){if(16>d)a[d]=c[k+d]|0;else{var i=a[d-3]^a[d-8]^a[d-14]^a[d-16];a[d]=i<<1|i>>>31}i=(j<<5|j>>>27)+g+a[d];i=20>d?i+((b&f|~b&e)+1518500249):40>d?i+((b^f^e)+1859775393):60>d?i+((b&f|b&e|f&e)-1894007588):i+((b^f^e)-
899497514);g=e;e=f;f=b<<30|b>>>2;b=j;j=i}h[0]=h[0]+j|0;h[1]=h[1]+b|0;h[2]=h[2]+f|0;h[3]=h[3]+e|0;h[4]=h[4]+g|0},_doFinalize:function(){var a=this._data,c=a.words,d=8*this._nDataBytes,j=8*a.sigBytes;c[j>>>5]|=128<<24-j%32;c[(j+64>>>9<<4)+15]=d;a.sigBytes=4*c.length;this._process()}});e.SHA1=i._createHelper(c);e.HmacSHA1=i._createHmacHelper(c)})();
(function(){var e=CryptoJS,i=e.enc.Utf8;e.algo.HMAC=e.lib.Base.extend({init:function(d,a){d=this._hasher=d.create();"string"==typeof a&&(a=i.parse(a));var c=d.blockSize,l=4*c;a.sigBytes>l&&(a=d.finalize(a));for(var e=this._oKey=a.clone(),h=this._iKey=a.clone(),j=e.words,b=h.words,f=0;f<c;f++)j[f]^=1549556828,b[f]^=909522486;e.sigBytes=h.sigBytes=l;this.reset()},reset:function(){var d=this._hasher;d.reset();d.update(this._iKey)},update:function(d){this._hasher.update(d);return this},finalize:function(d){var a=
this._hasher,d=a.finalize(d);a.reset();return a.finalize(this._oKey.clone().concat(d))}})})();var N=N||{};N.authors=["aalonsog@dit.upm.es","prodriguez@dit.upm.es","jcervino@dit.upm.es"];N.version=0.1;N=N||{};
N.Base64=function(){var e,i,d,a,c,l,k,h,j;e="A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z,a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,0,1,2,3,4,5,6,7,8,9,+,/".split(",");i=[];for(c=0;c<e.length;c+=1)i[e[c]]=c;l=function(b){d=b;a=0};k=function(){var b;if(!d||a>=d.length)return-1;b=d.charCodeAt(a)&255;a+=1;return b};h=function(){if(!d)return-1;for(;;){if(a>=d.length)return-1;var b=d.charAt(a);a+=1;if(i[b])return i[b];if("A"===b)return 0}};j=function(b){b=b.toString(16);1===b.length&&(b=
"0"+b);return unescape("%"+b)};return{encodeBase64:function(b){var a,c,g;l(b);b="";a=Array(3);c=0;for(g=!1;!g&&-1!==(a[0]=k());)if(a[1]=k(),a[2]=k(),b+=e[a[0]>>2],-1!==a[1]?(b+=e[a[0]<<4&48|a[1]>>4],-1!==a[2]?(b+=e[a[1]<<2&60|a[2]>>6],b+=e[a[2]&63]):(b+=e[a[1]<<2&60],b+="=",g=!0)):(b+=e[a[0]<<4&48],b+="=",b+="=",g=!0),c+=4,76<=c)b+="\n",c=0;return b},decodeBase64:function(b){var a,c;l(b);b="";a=Array(4);for(c=!1;!c&&-1!==(a[0]=h())&&-1!==(a[1]=h());)a[2]=h(),a[3]=h(),b+=j(a[0]<<2&255|a[1]>>4),-1!==
a[2]?(b+=j(a[1]<<4&255|a[2]>>2),-1!==a[3]?b+=j(a[2]<<6&255|a[3]):c=!0):c=!0;return b}}}(N);N=N||{};
N.API=function(e){var i,d;i=function(a,c,l,i,h,j,b,f){var o,g,q,p,n,m;void 0===j?(o=e.API.params.service,g=e.API.params.key,h=e.API.params.url+h):(o=j.service,g=j.key,h=j.url+h);""===o||""===g?console.log("ServiceID and Key are required!!"):(j=(new Date).getTime(),q=Math.floor(99999*Math.random()),p=j+","+q,n="MAuth realm=http://marte3.dit.upm.es,mauth_signature_method=HMAC_SHA1",""!==b&&""!==f&&(n=n+",mauth_username="+b+",mauth_role="+f,p+=","+b+","+f),b=d(p,g),n=n+",mauth_serviceid="+o+",mauth_cnonce="+
q+",mauth_timestamp="+j+",mauth_signature="+b,m=new XMLHttpRequest,m.onreadystatechange=function(){if(m.readyState===4)switch(m.status){case 100:case 200:case 201:case 202:case 203:case 204:case 205:a(m.responseText);break;case 400:c!==void 0&&c("400 Bad Request");break;case 401:c!==void 0&&c("401 Unauthorized");break;case 403:c!==void 0&&c("403 Forbidden");break;default:c!==void 0&&c(m.status+" Error"+m.responseText)}},m.open(l,h,!0),m.setRequestHeader("Authorization",n),void 0!==i)?(m.setRequestHeader("Content-Type",
"application/json"),m.send(JSON.stringify(i))):m.send()};d=function(a,c){var d;d=CryptoJS.HmacSHA1(a,c).toString(CryptoJS.enc.Hex);return e.Base64.encodeBase64(d)};return{params:{service:void 0,key:void 0,url:void 0},init:function(a,c,d){e.API.params.service=a;e.API.params.key=c;e.API.params.url=d},createRoom:function(a,c,d,e,h){i(function(a){a=JSON.parse(a);c(a)},d,"POST",{name:a,options:e},"rooms",h)},getRooms:function(a,c,d){i(a,c,"GET",void 0,"rooms",d)},getRoom:function(a,c,d,e){i(c,d,"GET",
void 0,"rooms/"+a,e)},deleteRoom:function(a,c,d,e){i(c,d,"DELETE",void 0,"rooms/"+a,e)},createToken:function(a,c,d,e,h,j){i(e,h,"POST",void 0,"rooms/"+a+"/tokens",j,c,d)},createService:function(a,c,d,e,h){i(d,e,"POST",{name:a,key:c},"services/",h)},getServices:function(a,c,d){i(a,c,"GET",void 0,"services/",d)},getService:function(a,c,d,e){i(c,d,"GET",void 0,"services/"+a,e)},deleteService:function(a,c,d,e){i(c,d,"DELETE",void 0,"services/"+a,e)},getUsers:function(a,c,d,e){i(c,d,"GET",void 0,"rooms/"+
a+"/users/",e)},getUser:function(a,c,d,e,h){i(d,e,"GET",void 0,"rooms/"+a+"/users/"+c,h)},deleteUser:function(a,c,d,e){i(d,e,"DELETE",void 0,"rooms/"+a+"/users/"+c)}}}(N);
module.exports = N;
