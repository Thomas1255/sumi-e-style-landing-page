import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const server = spawn(process.execPath, [fileURLToPath(new URL('../server.mjs', import.meta.url)), '--port', '0'], { stdio: ['ignore','pipe','pipe'] });
try {
  const url = await new Promise((resolve,reject) => {
    const timer=setTimeout(()=>reject(new Error('Preview server did not start')),10000);
    server.stdout.on('data',data=>{const match=String(data).match(/http:\/\/localhost:\d+/);if(match){clearTimeout(timer);resolve(match[0]);}});
    server.on('error',error=>{clearTimeout(timer);reject(error);});
    server.on('exit',code=>{clearTimeout(timer);reject(new Error(`Preview server exited: ${code}`));});
  });
  const local=await readFile(new URL('../dist/assets/videos/crane-01-rear-follow.mp4',import.meta.url));
  const file=`${url}/assets/videos/crane-01-rear-follow.mp4`;
  const head=await fetch(file,{method:'HEAD'});
  assert.equal(head.status,200);assert.equal(head.headers.get('content-type'),'video/mp4');
  assert.equal(Number(head.headers.get('content-length')),local.length);assert.equal((await head.arrayBuffer()).byteLength,0);
  for(const [range,start,end] of [['bytes=0-1023',0,1023],['bytes=4096-5119',4096,5119],['bytes=-128',local.length-128,local.length-1]]){
    const response=await fetch(file,{headers:{Range:range}});
    assert.equal(response.status,206);assert.equal(response.headers.get('content-range'),`bytes ${start}-${end}/${local.length}`);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()),local.subarray(start,end+1));
  }
  assert.equal((await fetch(file,{headers:{Range:`bytes=${local.length}-`}})).status,416);
  assert.equal((await fetch(`${url}/missing.mp4`)).status,404);
} finally {
  server.kill(); if(server.exitCode===null)await once(server,'exit');
}
