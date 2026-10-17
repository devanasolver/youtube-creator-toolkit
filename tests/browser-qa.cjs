const {chromium}=require('playwright');
const {spawn}=require('child_process');const assert=require('assert/strict');const fs=require('fs');const path=require('path');const os=require('os');
const root=path.resolve(__dirname,'..'),out=fs.mkdtempSync(path.join(os.tmpdir(),'toolkit-qa-'));
console.log('QA artifacts: '+out);
(async()=>{
 const server=spawn('python3',['-m','http.server','8000','--directory',root],{stdio:'ignore'});
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||undefined,headless:true,args:['--no-sandbox']});
 const base='http://localhost:8000/';let report=[];
 try{
  for(let n=0;n<20;n++){try{await fetch(base);break;}catch(e){await new Promise(r=>setTimeout(r,100));}}
  for(const [name,width,height] of [['desktop',1440,1100],['mobile',390,844]]){
   const ctx=await browser.newContext({viewport:{width,height},permissions:['clipboard-read','clipboard-write']});const page=await ctx.newPage();if(process.env.LIVE_VIDEO!=='1')await page.route('https://yt-transcript-proxy.pages.dev/api/video?*',r=>r.fulfill({status:200,contentType:'application/json',body:fs.readFileSync(path.join(__dirname,'fixtures/video.json'),'utf8')}));let errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base);await page.locator('#appLinkInput').fill('https://youtu.be/dQw4w9WgXcQ?t=43');await page.locator('#appLinkForm button').click();
   assert.equal(await page.locator('#appLinkOutput').inputValue(),base+'open/#v=dQw4w9WgXcQ&t=43');
   await page.locator('#appLinkCopy').click();assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),base+'open/#v=dQw4w9WgXcQ&t=43');
   const downloadPromise=page.waitForEvent('download');await page.locator('#appLinkQRSave').click();const dl=await downloadPromise;await dl.saveAs(out+'/app-link-qr.png');
   await page.locator('#subscribeInput').fill('UCX6OQ3DkcsbYNE6H8uQQuVA');await page.locator('#subscribeMake').click();assert.equal(await page.locator('#subscribeOutput').inputValue(),'https://www.youtube.com/channel/UCX6OQ3DkcsbYNE6H8uQQuVA?sub_confirmation=1');
   // Live proxy, not a fixture: @handle resolves to canonical UC channel ID.
   await page.locator('#subscribeInput').fill('@MrBeast');await page.locator('#subscribeMake').click();await page.locator('#subscribeResult').waitFor({state:'visible',timeout:25000});assert.ok((await page.locator('#subscribeOutput').inputValue()).includes('UCX6OQ3DkcsbYNE6H8uQQuVA'));
   await page.locator('#videoStatsInput').fill('https://youtu.be/dQw4w9WgXcQ');await page.locator('#videoStatsGo').click();await page.locator('#videoStatsResult').waitFor({state:'visible',timeout:25000});assert.ok((await page.locator('#videoStatsTitle').textContent()).includes('Rick Astley'));
   await page.locator('#tagExtractInput').fill('dQw4w9WgXcQ');await page.locator('#tagExtractGo').click();await page.locator('#tagExtractResult').waitFor({state:'visible',timeout:25000});assert.ok((await page.locator('#tagExtractOutput').inputValue()).includes('rick astley'));await page.locator('#tagExtractCopy').click();assert.ok((await page.evaluate(()=>navigator.clipboard.readText())).includes('rick astley'));
   for(const theme of ['dark','light']){
    await page.evaluate(t=>{document.documentElement.dataset.theme=t;document.documentElement.style.scrollBehavior='auto';},theme);
    for(const id of ['app-links','subscribe-links','video-stats','tag-extractor']){
     await page.locator('#'+id).scrollIntoViewIfNeeded();await page.locator('#'+id).screenshot({style:'.site-header{visibility:hidden}',path:out+'/'+name+'-'+theme+'-'+id+'.png'});
    }
    await page.screenshot({path:out+'/'+name+'-'+theme+'-viewport.png'});
   }
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.locator('#appLinkInput').fill('https://evil.test/watch?v=dQw4w9WgXcQ');await page.locator('#appLinkForm button').click();assert.equal(await page.locator('#appLinkResult').isVisible(),false);
   assert.equal(errors.length,0,errors.join('\n'));report.push(name+': UI, live handle resolve, QR download, clipboard, no overflow, no JS errors, invalid URL all pass (video data: '+(process.env.LIVE_VIDEO==='1'?'live':'saved public fixture')+')');await ctx.close();
  }
  const ios='Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
  const android='Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';
  for(const [name,ua] of [['ios',ios],['android',android],['instagram',ios+' Instagram 289.0.0.17'],['desktop','Mozilla/5.0 (X11; Linux x86_64) Chrome/130.0.0.0']]){
   const ctx=await browser.newContext({userAgent:ua,viewport:{width:390,height:844}});const page=await ctx.newPage();let attempts=[];
   const cdp=await ctx.newCDPSession(page);await cdp.send('Page.enable');cdp.on('Page.frameRequestedNavigation',e=>attempts.push(e.url));
   await page.route('https://www.youtube.com/**',route=>route.fulfill({status:200,body:'<title>YouTube fallback test</title>Web fallback reached'}));
   await page.goto(base+'open/#v=dQw4w9WgXcQ',{waitUntil:'commit'});
   if(name!=='desktop'){
    await page.waitForFunction(()=>document.querySelector('#openApp')?.getAttribute('href')||location.hostname==='www.youtube.com');
    if(page.url().startsWith(base)){const href=await page.locator('#openApp').getAttribute('href');assert.ok(href.startsWith(name==='android'?'intent://':'youtube://'));}else{assert.equal(name,'android');assert.ok(attempts.some(u=>u.startsWith('intent://')));}
    if(page.url().startsWith(base))await page.waitForTimeout(500);if(page.url().startsWith(base))await page.screenshot({path:out+'/redirect-'+name+'.png'});
    if(name==='instagram'){assert.ok((await page.locator('#openMessage').textContent()).includes('Instagram'));await page.locator('#openStay').click();await page.waitForTimeout(8500);assert.ok(page.url().startsWith(base));await page.locator('#openWeb').click();}
   }
   await page.waitForURL('https://www.youtube.com/watch?v=dQw4w9WgXcQ',{timeout:12000});
   report.push(name+': correct app href, attempted navigation and web fallback verified ('+attempts.length+' navigation events)');await ctx.close();
  }
  // Simulate leaving for an app: backgrounding must cancel the web fallback.
  const ctx=await browser.newContext({userAgent:ios});const page=await ctx.newPage();await page.goto(base+'open/#v=dQw4w9WgXcQ',{waitUntil:'commit'});
  await page.waitForFunction(()=>document.querySelector('#openApp')?.getAttribute('href'));await page.evaluate(()=>{Object.defineProperty(document,'hidden',{get:()=>true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});await page.waitForTimeout(4500);assert.ok(page.url().startsWith(base));report.push('visibility hidden: fallback cancelled, no later web navigation');
  await page.evaluate(()=>{location.hash='v=bad';});await page.waitForFunction(()=>document.querySelector('#openTitle')?.textContent==='This link is incomplete');assert.equal(await page.locator('#openContent').isVisible(),false);report.push('malformed fragment: safe error, no redirect');await ctx.close();
  fs.writeFileSync(out+'/qa-report.txt',report.join('\n'));console.log(report.join('\n'));
 }finally{await browser.close();server.kill();}
})().catch(e=>{console.error(e);process.exit(1);});
