/* Run: node tests/applink.test.js */
const assert=require('node:assert/strict');
const A=require('../assets/js/applink.js');
let count=0;
function check(label,fn){fn();count++;console.log('ok '+label);}
const video='dQw4w9WgXcQ',channel='UCX6OQ3DkcsbYNE6H8uQQuVA',list='PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf';
const cases=[
 ['bare video',video,'video',video],
 ['watch','https://www.youtube.com/watch?v='+video,'video',video],
 ['short URL','https://youtu.be/'+video+'?t=43','video',video],
 ['no scheme','youtu.be/'+video,'video',video],
 ['mobile','https://m.youtube.com/watch?v='+video,'video',video],
 ['music','https://music.youtube.com/watch?v='+video,'video',video],
 ['embed','https://www.youtube-nocookie.com/embed/'+video,'video',video],
 ['live','https://youtube.com/live/'+video,'video',video],
 ['Shorts','https://youtube.com/shorts/'+video,'shorts',video],
 ['playlist','https://youtube.com/playlist?list='+list,'playlist',list],
 ['channel','https://youtube.com/channel/'+channel,'channel',channel],
 ['UC ID',channel,'channel',channel],
 ['handle','https://youtube.com/@MrBeast/videos','channel','@MrBeast'],
 ['bare handle','@MrBeast','channel','@MrBeast'],
 ['Unicode handle','https://youtube.com/@%E6%97%A5%E6%9C%AC%E8%AA%9E','channel','@日本語'],
 ['legacy c','https://youtube.com/c/MrBeast6000','channel','MrBeast6000'],
 ['legacy user','https://youtube.com/user/PewDiePie','channel','PewDiePie']
];
cases.forEach(([label,input,kind,id])=>check(label,()=>{
 const p=A.parse(input);assert.equal(p.kind,kind);assert.equal(p.id,id);
 assert.deepEqual(A.unpack(A.pack(p)),JSON.parse(JSON.stringify(p)));
 assert.match(A.webUrl(p),/^https:\/\/www\.youtube\.com\//);
 const intent=A.androidIntent(p);assert.ok(intent.startsWith('intent://www.youtube.com/'));assert.ok(intent.includes('S.browser_fallback_url='+encodeURIComponent(A.webUrl(p))));
 assert.ok(A.iosDeepLinks(p)[0].startsWith('youtube://www.youtube.com/'));
}));
['','hello world','https://vimeo.com/123','https://youtube.com.evil.test/watch?v='+video,'javascript:alert(1)','ftp://youtube.com/watch?v='+video,'https://youtube.com/watch','https://youtu.be/'+video+'EXTRA','https://youtube.com/shorts/'+video+'extra','https://youtube.com/playlistfake?list='+list,'https://evil.test/@MrBeast','https://youtube.com/channel/'+channel+'extra','https://user:password@youtube.com/@MrBeast'].forEach(input=>check('reject '+input,()=>assert.equal(A.parse(input),null)));
check('time and playlist roundtrip',()=>{let p=A.parse('https://youtube.com/watch?v='+video+'&t=1m30s&list='+list);assert.deepEqual(A.unpack(A.pack(p)),p);assert.ok(A.webUrl(p).includes('&t=1m30s&list='));});
check('invalid time stripped',()=>assert.equal(A.webUrl({kind:'video',id:video,t:'evil;end'}),'https://www.youtube.com/watch?v='+video));
check('legacy path preserved',()=>{assert.equal(A.webUrl(A.parse('https://youtube.com/user/PewDiePie')),'https://www.youtube.com/user/PewDiePie');});
['#v=bad','#url=https://evil.test','#v='+video+'&s='+video,'#c=bad'].forEach(hash=>check('bad fragment '+hash,()=>assert.equal(A.unpack(hash),null)));
check('iOS alternate video',()=>assert.equal(A.iosDeepLinks(A.parse(video))[1],'vnd.youtube://'+video));
[['Android 13','android'],['iPhone OS 17','ios'],['iPad','ios'],['Windows NT 10','desktop']].forEach(([ua,want])=>check('platform '+ua,()=>assert.equal(A.platform(ua),want)));
[['Instagram','Instagram'],['musical_ly_35','TikTok'],['FBAN/FBIOS','Facebook'],['Threads','Threads'],['Chrome/130',null]].forEach(([ua,want])=>check('webview '+ua,()=>assert.equal(A.inAppBrowser(ua),want)));
console.log(count+' checks passed');
