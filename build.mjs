import {mkdir,copyFile} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
for (const file of ['index.html','styles.css','app.js','core.js','data.json','README.md','SOURCES.md','LICENSE']) await copyFile(file,`dist/${file}`);
console.log('Built static app in dist/');
