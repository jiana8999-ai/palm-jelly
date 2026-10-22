import fs from 'node:fs';fs.rmSync('dist',{recursive:true,force:true});fs.cpSync('public','dist',{recursive:true});console.log('Static site built in dist/');
// Keep original approved PNGs in source history; deploy pixel-preserving WebP copies.
for(const file of fs.readdirSync('dist/assets',{recursive:true})){if(file.endsWith('.png'))fs.rmSync(`dist/assets/${file}`)}
