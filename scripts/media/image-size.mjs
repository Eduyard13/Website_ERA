import {readFileSync} from 'node:fs';

// Read export dimensions at build time; the browser needs no metadata request.
export function imageSize(file){
 try{
  const data=readFileSync(file);
  if(data.length>=24&&data.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')))return {width:data.readUInt32BE(16),height:data.readUInt32BE(20)};
  if(data.toString('ascii',0,4)==='RIFF'&&data.toString('ascii',8,12)==='WEBP'){
   for(let offset=12;offset+8<data.length;){
    const kind=data.toString('ascii',offset,offset+4),length=data.readUInt32LE(offset+4),start=offset+8;
    if(start+length>data.length)return null;
    if(kind==='VP8X'&&length>=10)return {width:data.readUIntLE(start+4,3)+1,height:data.readUIntLE(start+7,3)+1};
    if(kind==='VP8 '&&length>=10)return {width:data.readUInt16LE(start+6)&16383,height:data.readUInt16LE(start+8)&16383};
    if(kind==='VP8L'&&length>=5){const bits=data.readUInt32LE(start+1);return {width:(bits&16383)+1,height:((bits>>>14)&16383)+1};}
    offset=start+length+(length%2);
   }
  }
  if(data[0]===255&&data[1]===216){
   const frames=new Set([192,193,194,195,197,198,199,201,202,203,205,206,207]);
   for(let offset=2;offset+3<data.length;){
    if(data[offset++]!==255)continue;
    while(data[offset]===255)offset++;
    const marker=data[offset++];if(marker===0||marker===1||(marker>=208&&marker<=217))continue;
    const length=data.readUInt16BE(offset);if(length<2||offset+length>data.length)return null;
    if(frames.has(marker)&&length>=7)return {width:data.readUInt16BE(offset+5),height:data.readUInt16BE(offset+3)};
    offset+=length;
   }
  }
 }catch{/* Keep the reviewed fallback dimensions for missing or unknown formats. */}
 return null;
}
