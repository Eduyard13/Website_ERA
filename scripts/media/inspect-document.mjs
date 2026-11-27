import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {safeDocumentPath} from '../build/validate-document-library.mjs';
const file=process.argv[2];if(!safeDocumentPath(file))throw new Error('Pass the relative path within public/documents, for example brochures/era-separatsiya-02-overview.pdf');
const buffer=await readFile('public/documents/'+file);if(buffer.subarray(0,5).toString()!=='%PDF-')throw new Error('Not a PDF');
const info=execFileSync('pdfinfo',['public/documents/'+file],{encoding:'utf8'}),pages=Number(info.match(/^Pages:\s+(\d+)/m)?.[1]);
console.log(JSON.stringify({file,bytes:buffer.length,pages,sha256:createHash('sha256').update(buffer).digest('hex')},null,2));
